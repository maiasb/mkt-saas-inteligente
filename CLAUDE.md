# CLAUDE.md

## Visão geral
Painel admin da agência Dreams para programas de indicação de empresas parceiras. Cada indicador recebe um link (`/ref/[codigo]`); quem se cadastra por ele vira "indicado" e gera pontos/recompensas. Dados de clientes/vendas vêm de APIs externas (Guará Acqua Park, Limber Card); indicações, links e pontos ficam no MySQL local.

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
src/app/api/<empresa-slug>/…   rotas finas por empresa → delegam ao controller
src/app/api/<recurso>/…        rotas genéricas (links, stats, cadastro, validate-link…)
src/app/dashboard/…            painel (client components)
src/app/ref/[codigo]/          landing pública do link de indicação
src/modules/<empresa-slug>/    <x>.repository.ts → <x>.service.ts → <x>.controller.ts + index.ts
src/config/empresas.config.ts  registro hard-coded de empresas (fonte de verdade)
src/lib/db.ts                  pool mysql2 (singleton em global.db)
src/components/                componentes compartilhados (hoje só Sidebar)
database/migrations/NNN_*.js   migrations numeradas
docs/                          arquitetura
```

## Convenções
- **Alias** `@/` = `src/`. TypeScript strict.
- **Módulo por empresa**: Repository (SQL e chamadas à API externa) → Service (regras) → Controller (HTTP, `NextResponse`). Classes com instância singleton exportada. Siga `src/modules/guara-acqua-park/`. A rota em `src/app/api/<slug>/…/route.ts` só chama o controller (ex.: `src/app/api/guara-acqua-park/indicacoes/route.ts`).
- **Rotas genéricas** (`src/app/api/links/route.ts`, `clientes/cadastro/route.ts`) fazem SQL direto com `db`. É o legado; para lógica nova de empresa, use o módulo.
- **Empresas** são hard-coded em `empresas.config.ts`. Para uma nova, siga "Como Adicionar Nova Empresa" em `docs/MODULES_ARCHITECTURE.md`. O `empresaId` (ex.: `guara-acqua-park-001`) é o `id` do config, não o slug.
- **SQL**: sempre parametrizado (`db.query('… WHERE x = ?', [x])`). Nunca interpole input em SQL.
- **Validação**: manual (`if (!nome || !email) return 400`), sem lib. Mantenha assim; não adicione zod sem perguntar.
- **Erros**: `try/catch` no controller/rota, `console.error('[NomeDaClasse] …')`, resposta `{ error: 'mensagem em pt-BR' }` com status 400/404/500.
- **Rotas dinâmicas (Next 15)**: `params` é `Promise` → `{ params }: { params: Promise<{ id: string }> }` e `await params` (ver `src/app/api/validate-link/[codigo]/route.ts`).
- **Páginas**: `'use client'` + `useState/useEffect` + `fetch('/api/…')`; sem SWR/React Query nem server actions. Siga `src/app/dashboard/empresas/[slug]/indicacoes/page.tsx`. Resposta paginada: `{ <itens>, paginacao: { total_paginas, total_itens } }`.
- **Estilo**: Tailwind inline; cor tema da empresa vem de `EMPRESAS[slug].cor`. Gráficos com Recharts (`src/app/dashboard/page.tsx`).
- **Nomes**: pastas/rotas em kebab-case pt-BR; arquivos de módulo `<empresa>.<camada>.ts`; classes `PascalCase`; métodos em pt-BR (`listarClientes`); colunas SQL em snake_case.

## Modelo de dados (resumo)
Tabelas atuais: `indicacoes`, `links`, `pontuacoes`, `users`, `migrations`. `empresas`, `clientes` e `usuarios_indicados` foram removidas (empresas vivem em `empresas.config.ts`); **o cliente real vive na API do Guará** e é copiado em `indicacoes`.
- `indicacoes` guarda **todos** os participantes (nome, email, cpf…). `indicador_id IS NULL` = só indicador; preenchido = foi indicado por esse cliente. `cliente_id` = id do cliente na API externa.
- `links.cliente_id` aponta para o indicador; `links.codigo` é o código público.
- Não há FKs (removidas na migration 008): a integridade é responsabilidade do código.

## Banco / migrations
- Crie `database/migrations/NNN_descricao_snake_case.js` com o próximo número (hoje 018). O runner ordena por nome e registra em `migrations`.
- Formato: `exports { up(connection), down(connection) }`. Prefira CommonJS (`module.exports = { up, down }`, como 001–015). 016–017 usam `export async function` e só rodam por causa do `require(esm)` do Node ≥ 22.
- **Nunca edite migration já aplicada** (o banco de produção já a executou): crie uma nova.
- Migrations não são transacionais (DDL no MySQL faz commit implícito): escreva-as idempotentes quando possível (`CREATE TABLE IF NOT EXISTS`, checar `SHOW COLUMNS`, como a 010).
- `dev.db` na raiz é resíduo (SQLite, ignorado); o banco é MySQL.

## Armadilhas
- **Sem autenticação real.** Login é fixo no cliente (`localStorage.isAuthenticated`, em `src/app/login/page.tsx`) e as rotas `/api/*` são abertas. Não trate nada como protegido; não exponha dado sensível novo sem avisar.
- `src/lib/db.ts` e `database/migrate.js` têm credenciais *default* hard-coded. Nunca copie esse padrão; use sempre env.
- `src/app/api/clientes/cadastro/route.ts` **simula** o cadastro no Guará (`MOCK_…` id + delay). É deliberado até a API existir; não "conserte" sem pedido. Detalhes em `src/app/api/clientes/cadastro/README.md`.
- `GuaraRepository.listarClientes` devolve **dados mockados** quando `GUARA_API_URL`/`GUARA_API_TOKEN` estão vazios. Sem env, a tela parece funcionar com dados falsos.
- `GuaraService.buscarEstatisticasGerais` retorna indicações/convertidos sempre 0 (placeholder); estatísticas reais vêm de `api/guara-acqua-park/dashboard`.
- Regras de negócio hard-coded: R$ 50 por conversão e limite de 10 indicações (`guara.service.ts`); a mensagem diz "mensal" mas a checagem não filtra por mês.
- `empresaId` `'guara-acqua-park-001'` repetido em vários arquivos em vez de vir de `EMPRESAS`.
- `NEXT_PUBLIC_BASE_URL` é embutida no bundle no **build**: mudar exige rebuild da imagem.
- `LimberCardRepository` guarda token em memória (cache por instância); não funciona entre múltiplas instâncias do servidor.
- Ainda há SQL em tabelas removidas: `api/usuarios-indicados/[id]/tornar-cliente/route.ts` e `GuaraRepository` (`INSERT INTO clientes`). Não copie esse SQL.
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
Histórico: mensagens em português, uma linha, verbo no indicativo/imperativo (`Adiciona setup Docker…`, `Ajustes na api da limber`). Branch única `main`; branches remotas de feature como `feature/<nome>`. Sem padrão formal — **proposta**: seguir Conventional Commits em português (`feat: …`, `fix: …`) a partir de agora. Commit só quando pedido; nunca `--force` em `main`.

## Referências
- `docs/SETUP.md` — env, Docker e dev local.
- `docs/DATABASE.md` — schema atual, tabelas removidas, como criar migration.
- `docs/INTEGRACOES.md` — APIs do Guará e Limber Card.
- `docs/MODULES_ARCHITECTURE.md` — arquitetura de módulos por empresa e como adicionar empresa (cuidado: cita `dreams-agency`, que não existe mais no código).
- `README.md` — visão geral e endpoints (parcialmente desatualizado: diz Next 14).
- `src/app/api/clientes/cadastro/README.md` — fluxo de cadastro via link.
- `.github/copilot-instructions.md` — instruções antigas para Copilot.
