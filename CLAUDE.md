# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Calendário colaborativo de ausências do time EAD (React 19 + TypeScript + Vite + Tailwind 4). Código, nomes e mensagens estão em português; mantenha esse padrão.

## Comandos

```bash
npm install
npm run dev       # servidor de dev + API local: http://localhost:5173/CalendarioEaD/
npm run build     # tsc -b (checagem de tipos) + vite build → dist/
npm run preview   # serve dist/ (sem API: a API só existe no dev server)
```

Não há lint nem testes configurados. `npm run build` é a verificação de tipos (strict, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` → use `import type` para tipos).

## Arquitetura

O projeto foi planejado para Firebase Realtime Database, mas por enquanto roda **sem Firebase**: um plugin do Vite ([server/jsonApi.ts](server/jsonApi.ts)) expõe uma API REST em `<base>/api/*` e persiste tudo em [data/db.json](data/db.json), que imita o nó `calendarioEAD` do RTDB (`usuarios`, `ausencias`, `feriados`, cada um `Record<id, objeto>`).

- **Regras de negócio e segurança ficam no servidor** ([server/jsonApi.ts](server/jsonApi.ts)), espelhando as regras de segurança planejadas para o Firebase: membro só escreve ausências próprias, liderança escreve qualquer uma e é a única que gerencia feriados; datas em feriado ou fim de semana são recusadas; ausência do tipo `ferias` só é criada via `POST /ferias` (vários dias, atômico) e não pode ser editada, apenas excluída. Validação com zod.
- **Escritas são serializadas** por uma fila (`transacao`) e gravadas com arquivo `.tmp` + `rename` (atômico).
- **Tempo real**: após cada escrita o servidor emite Server-Sent Events em `/api/eventos` com o nó alterado. No cliente, `assinar(no, cb)` em [src/lib/api.ts](src/lib/api.ts) substitui o `onValue` do Firebase; os hooks em [src/hooks/](src/hooks/) recarregam os dados ao receber o evento.
- **Autenticação provisória**: login só por e-mail (sem senha); o uid fica no `localStorage` (`calendarioEAD:uid`) e vai no header `x-user-id`. Novo cadastro sempre nasce `membro`; promover a `lideranca` é manual, editando `data/db.json`.
- Tipos compartilhados entre cliente e servidor: [src/types/index.ts](src/types/index.ts) e [src/constants/tiposAusencia.ts](src/constants/tiposAusencia.ts) (o servidor importa ambos).

**Camadas do cliente**: componentes/páginas → `src/hooks/*` (leitura em tempo real) e `src/services/*` (escrita) → `src/lib/api.ts`. Apenas `src/lib/api.ts`, `src/services/*`, `src/hooks/*` e `src/contexts/AuthContext.tsx` conhecem a API; a migração futura para o Firebase deve reescrever só essas peças, sem tocar nos componentes. As variáveis `VITE_FIREBASE_*` já são passadas no workflow de deploy para essa migração.

Feriados nacionais são importados da BrasilAPI (`src/services/feriados.ts`).

## Datas

Datas trafegam como string `YYYY-MM-DD`. Use `toISO`/`fromISO` de [src/lib/datas.ts](src/lib/datas.ts): `fromISO` cria a data no fuso local (evita o deslocamento de `new Date(iso)`). A grade do mês (`gerarGradeMes`) inclui dias dos meses vizinhos, e as ausências são buscadas para esse intervalo inteiro.

## Deploy

Push em `main` publica no GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (`npm ci` + `npm run build`, Node 22). O `base` em [vite.config.ts](vite.config.ts) precisa ser igual ao nome do repositório (`/CalendarioEaD/`). O build estático não tem API, então a versão publicada não funciona até a migração para o Firebase.

Existe também [.github/workflows/static.yml](.github/workflows/static.yml), que roda no mesmo push e publica o repositório inteiro sem build; os dois disputam o mesmo deploy do Pages.
