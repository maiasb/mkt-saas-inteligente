# Setup e execução

Requisitos: Node 22 (as migrations 016–017 dependem de `require(esm)`), npm, Docker (para o MySQL).

## Variáveis de ambiente
Copie `.env.example` para `.env` e preencha. Nunca commite `.env`.
| Grupo | Variáveis |
|---|---|
| Banco (compose) | `DB_ROOT_PASSWORD`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_EXPOSED_PORT` |
| App (compose) | `APP_PORT`, `NEXT_PUBLIC_BASE_URL` (embutida no bundle no build) |
| Guará | `GUARA_API_URL`, `GUARA_API_TOKEN` |
| Limber Card | `LIMBER_CARD_API_URL`, `LIMBER_CARD_USER`, `LIMBER_CARD_PASSWORD` |

`DB_HOST` e `DB_PORT` não estão no `.env.example`: o código assume `localhost:3306`. O compose define `DB_HOST=db` para os contêineres.

## Tudo no Docker
```bash
docker compose up -d --build   # db → migrate (roda e encerra) → app
```
App em `http://localhost:${APP_PORT:-3000}`.

## Desenvolvimento local (app fora do Docker, banco no compose)
```bash
npm ci
docker compose up -d db
set -a; . ./.env; set +a                       # o Next carrega .env sozinho, o node puro (migrate) não
export DB_HOST=127.0.0.1 DB_PORT=$DB_EXPOSED_PORT
npm run migrate
npm run dev
```
`DB_HOST`/`DB_PORT` precisam estar exportados também para `npm run dev` (ou colocados no `.env`).

## Verificações
```bash
npm run lint
npx tsc --noEmit
npm run build
```
Não há testes automatizados nem CI.

## Observações
- Use npm. `npm` reescreve o `yarn.lock`; descarte com `git checkout yarn.lock`.
- Sem `GUARA_API_URL`/`GUARA_API_TOKEN`, a listagem de clientes do Guará retorna dados mockados.
- Login do painel: fixo no cliente (`src/app/login/page.tsx`), sem autenticação real no servidor.
