/**
 * Cliente da API local (server/jsonApi.ts), que grava em data/db.json.
 * Ocupa o lugar de `lib/firebase.ts` enquanto o Firebase não é usado:
 * para migrar, basta reimplementar os services/hooks sobre o SDK do Firebase.
 */
const BASE = `${import.meta.env.BASE_URL}api`;
const CHAVE_SESSAO = 'calendarioEAD:uid';

export const sessao = {
  get uid(): string | null {
    try {
      return localStorage.getItem(CHAVE_SESSAO);
    } catch {
      return null;
    }
  },
  set uid(valor: string | null) {
    try {
      if (valor) localStorage.setItem(CHAVE_SESSAO, valor);
      else localStorage.removeItem(CHAVE_SESSAO);
    } catch {
      /* armazenamento indisponível: sessão dura só até recarregar */
    }
  },
};

export class ErroApi extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opcoes.corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (sessao.uid) headers['x-user-id'] = sessao.uid;
  const res = await fetch(`${BASE}${caminho}`, {
    method: opcoes.metodo ?? 'GET',
    headers,
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErroApi(res.status, (dados as { erro?: string }).erro ?? `Erro ${res.status}`);
  return dados as T;
}

// ---------- Tempo real (substitui onValue) ----------
type No = 'usuarios' | 'ausencias' | 'feriados';
const ouvintes = new Map<No, Set<() => void>>();
let fonte: EventSource | null = null;

/** Chama `cb` sempre que o nó mudar no servidor. Retorna a função para cancelar. */
export function assinar(no: No, cb: () => void): () => void {
  if (!ouvintes.has(no)) ouvintes.set(no, new Set());
  ouvintes.get(no)!.add(cb);
  if (!fonte) {
    fonte = new EventSource(`${BASE}/eventos`);
    fonte.onmessage = (ev) => {
      const { no: alterado } = JSON.parse(ev.data) as { no: No };
      ouvintes.get(alterado)?.forEach((f) => f());
    };
  }
  return () => {
    ouvintes.get(no)?.delete(cb);
    const restantes = [...ouvintes.values()].reduce((n, s) => n + s.size, 0);
    if (restantes === 0 && fonte) {
      fonte.close();
      fonte = null;
    }
  };
}
