# Banco de dados

MySQL 8, utf8mb4. Schema gerenciado por `database/migrations/` (ver [SETUP.md](SETUP.md) para aplicar). Estado descrito abaixo = após a migration 018.

Não há chaves estrangeiras (removidas na migration 008). A integridade é garantida pelo código.

## Tabelas

### `indicacoes`
Todos os participantes do programa, indicadores e indicados.
| Coluna | Observação |
|---|---|
| `id` (PK, uuid) | |
| `empresa_id` | `id` da tabela `empresas` (ex.: `empresa-exemplo-001`) |
| `cliente_id` | id do cliente (uuid se cadastrado no painel; `MOCK_…` enquanto o cadastro por link é simulado) |
| `indicador_id` | `NULL` = participante é só indicador; preenchido = foi indicado por esse `cliente_id` |
| `link_id` | link usado (`NULL` para cliente cadastrado manualmente, sem link) |
| `nome`, `email`, `telefone`, `cpf` | cópia local dos dados do cliente |

Único: `(indicador_id, link_id)`. Atenção: com `indicador_id NULL` o MySQL permite várias linhas, então a unicidade só vale para indicados.

### `empresas`
Empresas agenciadas (migration 018): `id`, `slug` (único), `nome`, `email`, `telefone`, `cnpj`, `cor`, `ativo` e `regras` (JSON: `pontos_indicador`, `pontos_indicado`, `valor_conversao`, `limite_indicacoes`). Ver [MODULES_ARCHITECTURE.md](MODULES_ARCHITECTURE.md).

### `links`
Link de indicação de um indicador. `codigo` (único) é o que aparece em `/ref/[codigo]`; `url` (única) é a URL completa; `cliente_id` = indicador; `ativo` 0/1.

### `pontuacoes`
Lançamentos de pontos: `empresa_id`, `cliente_id` (API externa), `pontos`, `link_id`. O cadastro por link (`src/app/api/clientes/cadastro/route.ts`) lança os pontos definidos nas `regras` da empresa (padrão: 10 ao indicador, 5 ao indicado). O total de um cliente é a soma, não há saldo materializado.

### `users`
Criada na migration 001 (com campos de Google/verificação de e-mail), **sem uso no código**: o login é fixo no cliente.

### `migrations`
Controle do runner: `name` (arquivo) e `executed_at`.

## Tabelas removidas (não referenciar)
`clientes` (009) e `usuarios_indicados`. A tabela `empresas` foi removida na 008 e recriada, com outro formato, na 018.

Código que ainda cita tabelas removidas (a corrigir antes de usar): `src/app/api/usuarios-indicados/[id]/tornar-cliente/route.ts` (`INSERT INTO clientes`).

## Criar migration
1. Arquivo `database/migrations/NNN_descricao_snake_case.js` com o próximo número (hoje `019`).
2. CommonJS: `async function up(connection) {…}`, `async function down(connection) {…}`, `module.exports = { up, down }`. Use `connection.execute`/`query`.
3. Idempotente quando possível (`CREATE TABLE IF NOT EXISTS`, checar `SHOW COLUMNS` antes de `ALTER`): DDL no MySQL não é transacional, uma falha no meio deixa o schema pela metade e a migration não é registrada.
4. Nunca edite uma migration já aplicada; crie outra.
5. Aplique com `npm run migrate` e confira o resultado nesta doc.
