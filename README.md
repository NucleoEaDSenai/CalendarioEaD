# Calendário EAD

Calendário colaborativo de ausências do time. Por enquanto **sem Firebase**: os dados ficam em
[`data/db.json`](data/db.json), servidos por uma API local embutida no Vite ([`server/jsonApi.ts`](server/jsonApi.ts)).

```bash
npm install
npm run dev     # http://localhost:5173/calendario-ead/
```

## Como funciona sem o Firebase

| Plano original (Firebase)            | Agora                                                        |
|--------------------------------------|--------------------------------------------------------------|
| Realtime Database, nó `calendarioEAD` | `data/db.json` com a mesma estrutura                          |
| `database.rules.json`                | Mesmas regras aplicadas em `server/jsonApi.ts`               |
| `onValue` (tempo real)               | Server-Sent Events em `/api/eventos`                         |
| `update()` multi-path                | `POST /api/ausencias` com vários itens, gravação atômica     |
| Firebase Auth                        | Login provisório por e-mail (sem senha), uid no `localStorage` |

Extra: o servidor também bloqueia **fins de semana** (no Firebase isso exigiria Cloud Function).

## Promover alguém a liderança

Como no console do Firebase, é manual: em `data/db.json`, troque
`"papel": "membro"` por `"papel": "lideranca"` no usuário desejado e recarregue a página.

## Limitações atuais

- A API só existe no `npm run dev`. O build estático (GitHub Pages) não grava arquivos;
  o deploy no Pages volta a fazer sentido quando o Firebase for integrado.
- O login não tem senha: serve para desenvolvimento, não para uso real.

## Migrar para o Firebase depois

Só `src/lib/api.ts`, `src/services/*`, `src/hooks/*` e `src/contexts/AuthContext.tsx` conversam com a API.
Basta reescrevê-los com o SDK do Firebase; os componentes não mudam.
