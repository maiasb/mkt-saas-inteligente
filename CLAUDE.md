# CLAUDE.md

## Visão geral
Painel admin da Agência de Marketing para programas de indicação das empresas agenciadas. Cada indicador recebe um link (`/ref/[codigo]`); quem se cadastra por ele vira "indicado" e gera pontos/recompensas. Clientes, indicações, links e pontos ficam no MySQL local.

Stack: Next.js 15 (App Router) · React 18 · TypeScript strict · Tailwind 3 · MySQL 8 via `mysql2` (SQL puro, sem ORM) · Recharts · Node 22. Idioma do domínio, UI e commits: português.

## Comandos (todos verificados com `npm`)
- `npm ci` — instala. Use **npm**: o Dockerfile usa `package-lock.json`. Ignore `yarn.lock`. Rodar `npm` reescreve o `yarn.lock` (`git checkout yarn.lock`).
- `npm run dev` — dev em :3000.
- `npm run build` / `npm start` — produção.
- `npm run lint` — ESLint (`next/core-web-vitals`).
- `npx tsc --noEmit` — typecheck (não há script).
- `npm run migrate` — aplica migrations pendentes (`node database/migrate.js`).
- `docker compose up -d` — sobe MySQL 8 + migrate + app. Só o banco: `docker compose up -d db` (porta `DB_EXPOSED_PORT`, padrão 3307).
- **Não há testes, seed nem CI.** Não invente comandos de teste.

Rodar fora do Docker contra o banco do compose: exporte `DB_HOST=127.0.0.1` e `DB_PORT=<DB_EXPOSED_PORT>` além das `DB_USER/DB_PASSWORD/DB_NAME` do `.env`. O Next.js carrega `.env` sozinho; `npm run migrate` (node puro) **não** carrega — exporte as variáveis antes. Variáveis: ver `.env.example`.

## Estrutura
```
src/app/api/empresas/[slug]/…  rotas finas por empresa (slug dinâmico) → delegam ao controller
src/app/api/<recurso>/…        rotas genéricas (links, stats, cadastro, validate-link…)
src/app/dashboard/…            painel (client components)
src/app/ref/[codigo]/          landing pública do link de indicação
src/modules/empresas/          CRUD de empresas e regras (<x>.repository → service → controller + index.ts)
src/modules/programa-indicacao/ clientes, indicações e dashboard de uma empresa (recebe a empresa e suas regras)
src/config/empresas.config.ts  tipos EmpresaConfig/RegrasEmpresa e REGRAS_PADRAO (os dados ficam na tabela `empresas`)
src/lib/db.ts                  pool mysql2 (singleton em global.db)
src/components/                componentes compartilhados (hoje só Sidebar)
database/migrations/NNN_*.js   migrations numeradas
docs/                          arquitetura
```

## Convenções
- **Alias** `@/` = `src/`. TypeScript strict.
- **Módulos**: Repository (SQL) → Service (regras) → Controller (HTTP, `NextResponse`). Classes com instância singleton exportada. Siga `src/modules/programa-indicacao/`. A rota em `src/app/api/empresas/[slug]/…/route.ts` só chama o controller (ex.: `src/app/api/empresas/[slug]/indicacoes/route.ts`). O módulo é genérico: não crie código por empresa.
- **Rotas genéricas** (`src/app/api/links/route.ts`, `clientes/cadastro/route.ts`) fazem SQL direto com `db`. É o legado; para lógica nova de empresa, use o módulo.
- **Empresas** são dinâmicas (tabela `empresas`, cadastro em `/dashboard/configuracoes/empresas` ou `POST /api/empresas`), cada uma com suas `regras` (pontos, recompensa, limite). O `empresaId` (ex.: `empresa-exemplo-001`) é o `id` da tabela, não o slug. Busque via `empresasService`; em páginas client use `useEmpresa(slug)`.
- **SQL**: sempre parametrizado (`db.query('… WHERE x = ?', [x])`). Nunca interpole input em SQL.
- **Validação**: manual (`if (!nome || !email) return 400`), sem lib. Mantenha assim; não adicione zod sem perguntar.
- **Erros**: `try/catch` no controller/rota, `console.error('[NomeDaClasse] …')`, resposta `{ error: 'mensagem em pt-BR' }` com status 400/404/500.
- **Rotas dinâmicas (Next 15)**: `params` é `Promise` → `{ params }: { params: Promise<{ id: string }> }` e `await params` (ver `src/app/api/validate-link/[codigo]/route.ts`).
- **Páginas**: `'use client'` + `useState/useEffect` + `fetch('/api/…')`; sem SWR/React Query nem server actions. Siga `src/app/dashboard/empresas/[slug]/indicacoes/page.tsx`. Resposta paginada: `{ <itens>, paginacao: { total_paginas, total_itens } }`.
- **Estilo**: Tailwind inline; cor tema da empresa vem de `empresa.cor`. Gráficos com Recharts (`src/app/dashboard/page.tsx`).
- **Nomes**: pastas/rotas em kebab-case pt-BR; arquivos de módulo `<módulo>.<camada>.ts`; classes `PascalCase`; métodos em pt-BR (`listarClientes`); colunas SQL em snake_case.

## Modelo de dados (resumo)
Tabelas atuais: `empresas`, `indicacoes`, `links`, `pontuacoes`, `users`, `migrations`. `clientes` e `usuarios_indicados` foram removidas; os clientes de cada empresa são os participantes de `indicacoes` (cadastrados no painel ou via link).
- `indicacoes` guarda **todos** os participantes (nome, email, cpf…). `indicador_id IS NULL` = só indicador; preenchido = foi indicado por esse cliente. `cliente_id` = id do cliente (uuid local ou `MOCK_…` no cadastro por link simulado).
- `links.cliente_id` aponta para o indicador; `links.codigo` é o código público.
- Não há FKs (removidas na migration 008): a integridade é responsabilidade do código.

## Banco / migrations
- Crie `database/migrations/NNN_descricao_snake_case.js` com o próximo número (hoje 019). O runner ordena por nome e registra em `migrations`.
- Formato: `exports { up(connection), down(connection) }`. Prefira CommonJS (`module.exports = { up, down }`, como 001–015). 016–017 usam `export async function` e só rodam por causa do `require(esm)` do Node ≥ 22.
- **Nunca edite migration já aplicada** (o banco de produção já a executou): crie uma nova.
- Migrations não são transacionais (DDL no MySQL faz commit implícito): escreva-as idempotentes quando possível (`CREATE TABLE IF NOT EXISTS`, checar `SHOW COLUMNS`, como a 010).
- `dev.db` na raiz é resíduo (SQLite, ignorado); o banco é MySQL.

## Armadilhas
- **Sem autenticação real.** Login é fixo no cliente (`localStorage.isAuthenticated`, em `src/app/login/page.tsx`) e as rotas `/api/*` são abertas. Não trate nada como protegido; não exponha dado sensível novo sem avisar.
- `src/lib/db.ts` e `database/migrate.js` têm credenciais *default* hard-coded. Nunca copie esse padrão; use sempre env.
- `src/app/api/clientes/cadastro/route.ts` **simula** o cadastro no sistema externo (`MOCK_…` id + delay). É deliberado até a API existir; não "conserte" sem pedido. Detalhes em `src/app/api/clientes/cadastro/README.md`.
- As regras de negócio vêm de `empresas.regras`. `limite_indicacoes` é total por indicador (não filtra por mês) e só é checado em `api/clientes/cadastro`.
- `NEXT_PUBLIC_BASE_URL` é embutida no bundle no **build**: mudar exige rebuild da imagem.
- Ainda há SQL em tabela removida: `api/usuarios-indicados/[id]/tornar-cliente/route.ts` (`INSERT INTO clientes`). Não copie esse SQL.
- `src/app/api/registro/route.ts` é `@deprecated` (repassa para `clientes/cadastro`); não use.
- `next.config.mjs` e `next.config.ts` coexistem; o Next usa o `.mjs` (`reactStrictMode: false`, efeitos em dev rodam uma vez só).

## Regras de trabalho
- Para mudança não trivial, apresente o plano com os arquivos a alterar antes de editar.
- Faça a menor mudança que resolva; edite arquivos existentes em vez de criar novos.
- Não crie arquivos de resumo, docs, scripts avulsos nem cópias (`_v2`, `_new`, `.bak`) sem pedido.
- Não adicione dependências sem perguntar.
- Não deixe `console.log` de debug (use `console.error` com prefixo `[Classe]` em erros), código comentado, mocks nem dados fake novos.
- NUNCA leia, copie ou exiba valores de `.env` ou segredos. `.env.example` só tem nomes.
- Não corrija inconsistências alheias à tarefa; mencione-as.

## Definição de pronto
- `npm run lint` e `npx tsc --noEmit` sem erros; `npm run build` passa se tocou em rotas/páginas.
- Mudança de schema → nova migration aplicada com `npm run migrate`.
- Sem arquivos extras no `git status`.
- Comportamento ou arquitetura mudou → atualizar `docs/MODULES_ARCHITECTURE.md` (e `README.md` se afetar endpoints).
- Como não há testes, descreva como verificou manualmente (endpoint chamado, tela aberta).

## Git
Histórico: mensagens em português, uma linha, verbo no indicativo/imperativo (`Adiciona setup Docker…`). Branch única `main`; branches remotas de feature como `feature/<nome>`. Sem padrão formal — **proposta**: seguir Conventional Commits em português (`feat: …`, `fix: …`) a partir de agora. Commit só quando pedido; nunca `--force` em `main`.

## Referências
- `docs/SETUP.md` — env, Docker e dev local.
- `docs/DATABASE.md` — schema atual, tabelas removidas, como criar migration.
- `docs/INTEGRACOES.md` — integrações externas (hoje só o Gemini; cadastro externo é simulado).
- `docs/MODULES_ARCHITECTURE.md` — arquitetura de módulos, cadastro dinâmico de empresas e pendências (TODO).
- `README.md` — visão geral e endpoints.
- `src/app/api/clientes/cadastro/README.md` — fluxo de cadastro via link.
- `.github/copilot-instructions.md` — instruções antigas para Copilot.
