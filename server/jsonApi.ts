/**
 * API local que substitui o Firebase enquanto ele não é usado.
 *
 * - Persiste tudo em um arquivo .json com o mesmo formato do nó `calendarioEAD`
 *   planejado para o Realtime Database.
 * - Reproduz no servidor as regras de segurança da seção 3.3 do plano
 *   (e também bloqueia fins de semana, que no Firebase ficariam só no front).
 * - Notifica os clientes em tempo real via Server-Sent Events (substitui o `onValue`).
 *
 * Autenticação provisória: o cliente envia o uid no header `x-user-id`.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { z } from 'zod';
import { CHAVES_TIPO, exigeMotivo } from '../src/constants/tiposAusencia.ts';
import type { Ausencia, BancoCalendario, Usuario } from '../src/types/index.ts';

const BANCO_VAZIO: BancoCalendario = {
  calendarioEAD: { usuarios: {}, ausencias: {}, feriados: {} },
};

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const ausenciaEntradaSchema = z
  .object({
    userId: z.string().min(1),
    data: z.string().regex(RE_DATA),
    tipo: z.enum(CHAVES_TIPO),
    motivo: z.string().trim().max(200).optional(),
    diaTodo: z.boolean(),
    horaInicio: z.string().regex(RE_HORA).optional(),
    horaFim: z.string().regex(RE_HORA).optional(),
  })
  .strict()
  .refine((v) => !exigeMotivo(v.tipo) || !!v.motivo, { message: 'Informe o motivo' })
  .refine((v) => v.diaTodo || (!!v.horaInicio && !!v.horaFim && v.horaFim > v.horaInicio), {
    message: 'Informe início e fim (fim maior que início)',
  });

const feriasSchema = z.object({
  userId: z.string().min(1),
  dias: z.array(z.string().regex(RE_DATA)).min(1).max(400),
});

const feriadoSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  tipo: z.enum(['nacional', 'estadual', 'municipal', 'outro']),
});

const cadastroSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
});

class ErroHttp extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function ehFimDeSemana(iso: string) {
  const dia = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dia === 0 || dia === 6;
}

export function jsonApi({ arquivo }: { arquivo: string }): Plugin {
  const caminho = path.resolve(arquivo);
  const clientesSse = new Set<ServerResponse>();
  // Fila simples para que gravações concorrentes não se sobreponham.
  let fila: Promise<unknown> = Promise.resolve();

  async function ler(): Promise<BancoCalendario> {
    try {
      const banco = JSON.parse(await fs.readFile(caminho, 'utf8')) as BancoCalendario;
      banco.calendarioEAD ??= structuredClone(BANCO_VAZIO.calendarioEAD);
      banco.calendarioEAD.usuarios ??= {};
      banco.calendarioEAD.ausencias ??= {};
      banco.calendarioEAD.feriados ??= {};
      return banco;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return structuredClone(BANCO_VAZIO);
      throw e;
    }
  }

  async function gravar(banco: BancoCalendario) {
    await fs.mkdir(path.dirname(caminho), { recursive: true });
    const tmp = `${caminho}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(banco, null, 2) + '\n');
    await fs.rename(tmp, caminho); // rename é atômico: o arquivo nunca fica pela metade
  }

  /** Lê, aplica a alteração e grava, tudo serializado. Equivale a um `update()` atômico. */
  function transacao<T>(fn: (banco: BancoCalendario) => T): Promise<T> {
    const resultado = fila.then(async () => {
      const banco = await ler();
      const r = fn(banco);
      await gravar(banco);
      return r;
    });
    fila = resultado.catch(() => undefined);
    return resultado;
  }

  function notificar(no: 'usuarios' | 'ausencias' | 'feriados') {
    for (const res of clientesSse) res.write(`data: ${JSON.stringify({ no })}\n\n`);
  }

  async function corpo(req: IncomingMessage): Promise<unknown> {
    const partes: Buffer[] = [];
    for await (const p of req) partes.push(p as Buffer);
    if (!partes.length) return {};
    try {
      return JSON.parse(Buffer.concat(partes).toString('utf8'));
    } catch {
      throw new ErroHttp(400, 'JSON inválido');
    }
  }

  function autenticar(req: IncomingMessage, banco: BancoCalendario) {
    const uid = req.headers['x-user-id'];
    if (typeof uid !== 'string' || !banco.calendarioEAD.usuarios[uid]) {
      throw new ErroHttp(401, 'Não autenticado');
    }
    return { uid, usuario: banco.calendarioEAD.usuarios[uid] };
  }

  /** Regras de `ausencias/$id` (seção 3.3): dono do dado atual e do novo, ou liderança. */
  function podeEscrever(
    auth: { uid: string; usuario: Usuario },
    atual: Ausencia | undefined,
    novoUserId: string | undefined,
  ) {
    if (auth.usuario.papel === 'lideranca') return true;
    return (!atual || atual.userId === auth.uid) && (novoUserId === undefined || novoUserId === auth.uid);
  }

  function montarAusencia(entrada: unknown, banco: BancoCalendario, auth: { uid: string }): Ausencia {
    const r = ausenciaEntradaSchema.safeParse(entrada);
    if (!r.success) throw new ErroHttp(400, r.error.issues[0]?.message ?? 'Dados inválidos');
    const v = r.data;
    const dono = banco.calendarioEAD.usuarios[v.userId];
    if (!dono) throw new ErroHttp(400, 'Usuário inexistente');
    if (banco.calendarioEAD.feriados[v.data]) throw new ErroHttp(400, `${v.data} é feriado`);
    if (ehFimDeSemana(v.data)) throw new ErroHttp(400, `${v.data} é fim de semana`);
    const a: Ausencia = {
      userId: v.userId,
      nomeUsuario: dono.nome,
      data: v.data,
      tipo: v.tipo,
      diaTodo: v.diaTodo,
      criadoPor: auth.uid,
      criadoEm: Date.now(),
    };
    if (v.motivo) a.motivo = v.motivo;
    if (!v.diaTodo) {
      a.horaInicio = v.horaInicio;
      a.horaFim = v.horaFim;
    }
    return a;
  }

  async function rotear(req: IncomingMessage, res: ServerResponse, rota: string): Promise<unknown> {
    const url = new URL(rota, 'http://local');
    const metodo = req.method ?? 'GET';
    const seg = url.pathname.split('/').filter(Boolean); // ex.: ['ausencias', '<id>']

    // ---------- Sessão / usuários ----------
    if (seg[0] === 'login' && metodo === 'POST') {
      const { email } = z.object({ email: z.string().trim().toLowerCase() }).parse(await corpo(req));
      const banco = await ler();
      const achado = Object.entries(banco.calendarioEAD.usuarios).find(([, u]) => u.email === email);
      if (!achado) throw new ErroHttp(404, 'E-mail não cadastrado');
      return { uid: achado[0], ...achado[1] };
    }

    if (seg[0] === 'usuarios' && metodo === 'POST' && !seg[1]) {
      // Primeiro acesso: perfil sempre nasce como "membro".
      const r = cadastroSchema.safeParse(await corpo(req));
      if (!r.success) throw new ErroHttp(400, r.error.issues[0]?.message ?? 'Dados inválidos');
      const criado = await transacao((banco) => {
        const usuarios = banco.calendarioEAD.usuarios;
        if (Object.values(usuarios).some((u) => u.email === r.data.email)) {
          throw new ErroHttp(409, 'E-mail já cadastrado');
        }
        const uid = randomUUID();
        usuarios[uid] = { nome: r.data.nome, email: r.data.email, papel: 'membro' };
        return { uid, ...usuarios[uid] };
      });
      notificar('usuarios');
      return criado;
    }

    if (seg[0] === 'usuarios' && metodo === 'GET') {
      const banco = await ler();
      autenticar(req, banco);
      if (seg[1]) {
        const u = banco.calendarioEAD.usuarios[seg[1]];
        if (!u) throw new ErroHttp(404, 'Usuário não encontrado');
        return { uid: seg[1], ...u };
      }
      return banco.calendarioEAD.usuarios;
    }

    // ---------- Ausências ----------
    if (seg[0] === 'ausencias') {
      if (metodo === 'GET') {
        const banco = await ler();
        autenticar(req, banco);
        const inicio = url.searchParams.get('inicio') ?? '0000-00-00';
        const fim = url.searchParams.get('fim') ?? '9999-99-99';
        // Equivalente a orderByChild('data').startAt(inicio).endAt(fim)
        return Object.fromEntries(
          Object.entries(banco.calendarioEAD.ausencias).filter(([, a]) => a.data >= inicio && a.data <= fim),
        );
      }

      if (metodo === 'POST' && !seg[1]) {
        const entrada = await corpo(req);
        const id = await transacao((banco) => {
          const auth = autenticar(req, banco);
          const a = montarAusencia(entrada, banco, auth);
          if (a.tipo === 'ferias') throw new ErroHttp(400, 'Férias só podem ser marcadas pelo botão "Marcar férias"');
          if (!podeEscrever(auth, undefined, a.userId)) {
            throw new ErroHttp(403, 'Você só pode marcar ausências para si mesmo');
          }
          const id = randomUUID();
          banco.calendarioEAD.ausencias[id] = a;
          return id;
        });
        notificar('ausencias');
        return { id };
      }

      if (metodo === 'PUT' && seg[1]) {
        const entrada = await corpo(req);
        await transacao((banco) => {
          const auth = autenticar(req, banco);
          const atual = banco.calendarioEAD.ausencias[seg[1]];
          if (!atual) throw new ErroHttp(404, 'Ausência não encontrada');
          if (atual.tipo === 'ferias') throw new ErroHttp(400, 'Férias não podem ser editadas, apenas excluídas');
          const nova = montarAusencia(entrada, banco, auth);
          if (nova.tipo === 'ferias') throw new ErroHttp(400, 'Férias só podem ser marcadas pelo botão "Marcar férias"');
          if (!podeEscrever(auth, atual, nova.userId)) throw new ErroHttp(403, 'Sem permissão');
          banco.calendarioEAD.ausencias[seg[1]] = nova;
        });
        notificar('ausencias');
        return { ok: true };
      }

      if (metodo === 'DELETE' && seg[1]) {
        await transacao((banco) => {
          const auth = autenticar(req, banco);
          const atual = banco.calendarioEAD.ausencias[seg[1]];
          if (!atual) throw new ErroHttp(404, 'Ausência não encontrada');
          if (!podeEscrever(auth, atual, undefined)) throw new ErroHttp(403, 'Sem permissão');
          delete banco.calendarioEAD.ausencias[seg[1]];
        });
        notificar('ausencias');
        return { ok: true };
      }
    }

    // ---------- Férias (único caminho para criar ausências do tipo "ferias") ----------
    if (seg[0] === 'ferias' && metodo === 'POST') {
      const r = feriasSchema.safeParse(await corpo(req));
      if (!r.success) throw new ErroHttp(400, 'Período de férias inválido');
      const { userId, dias } = r.data;
      // Atômico (equivale ao update() multi-path): ou grava todos os dias, ou nenhum.
      const ids = await transacao((banco) => {
        const auth = autenticar(req, banco);
        if (!podeEscrever(auth, undefined, userId)) {
          throw new ErroHttp(403, 'Você só pode marcar férias para si mesmo');
        }
        const novas = dias.map((data) =>
          montarAusencia({ userId, data, tipo: 'ferias', motivo: 'Férias', diaTodo: true }, banco, auth),
        );
        return novas.map((a) => {
          const id = randomUUID();
          banco.calendarioEAD.ausencias[id] = a;
          return id;
        });
      });
      notificar('ausencias');
      return { ids };
    }

    // ---------- Feriados ----------
    if (seg[0] === 'feriados') {
      if (metodo === 'GET') {
        const banco = await ler();
        autenticar(req, banco);
        return banco.calendarioEAD.feriados;
      }

      const exigirLideranca = (banco: BancoCalendario) => {
        if (autenticar(req, banco).usuario.papel !== 'lideranca') {
          throw new ErroHttp(403, 'Apenas a liderança gerencia feriados');
        }
      };

      if (metodo === 'POST') {
        const entrada = z.record(z.string().regex(RE_DATA), feriadoSchema).safeParse(await corpo(req));
        if (!entrada.success) throw new ErroHttp(400, 'Feriados inválidos');
        const total = await transacao((banco) => {
          exigirLideranca(banco);
          Object.assign(banco.calendarioEAD.feriados, entrada.data);
          return Object.keys(entrada.data).length;
        });
        notificar('feriados');
        return { total };
      }

      if (metodo === 'DELETE' && seg[1]) {
        await transacao((banco) => {
          exigirLideranca(banco);
          delete banco.calendarioEAD.feriados[seg[1]];
        });
        notificar('feriados');
        return { ok: true };
      }
    }

    // ---------- Tempo real ----------
    if (seg[0] === 'eventos' && metodo === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(': conectado\n\n');
      clientesSse.add(res);
      req.on('close', () => clientesSse.delete(res));
      return undefined; // a resposta fica aberta
    }

    throw new ErroHttp(404, 'Rota não encontrada');
  }

  return {
    name: 'calendario-json-api',
    configureServer(server) {
      const prefixo = `${server.config.base.replace(/\/$/, '')}/api`;
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(prefixo + '/')) return next();
        try {
          const resultado = await rotear(req, res, req.url.slice(prefixo.length));
          if (resultado === undefined) return;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(resultado));
        } catch (e) {
          const status = e instanceof ErroHttp ? e.status : e instanceof z.ZodError ? 400 : 500;
          if (status === 500) console.error(e);
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ erro: e instanceof ErroHttp ? e.message : 'Erro na requisição' }));
        }
      });
    },
  };
}
