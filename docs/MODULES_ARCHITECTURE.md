# Arquitetura de Módulos

O painel atende uma agência de marketing e as empresas agenciadas por ela. As empresas são **cadastradas dinamicamente** (tabela `empresas`) e cada uma tem suas próprias regras de negócio. Não há código por empresa: os módulos são genéricos e recebem a empresa (com suas regras) como parâmetro.

## Estrutura

```
src/
├── config/empresas.config.ts          # Tipos (EmpresaConfig, RegrasEmpresa) e REGRAS_PADRAO
├── hooks/useEmpresa.ts                # Carrega a empresa pelo slug (páginas client)
├── modules/
│   ├── empresas/                      # CRUD de empresas e validação das regras
│   │   ├── empresas.repository.ts
│   │   ├── empresas.service.ts
│   │   ├── empresas.controller.ts
│   │   └── index.ts
│   ├── programa-indicacao/            # Clientes, indicações e dashboard de uma empresa
│   │   ├── programa.repository.ts
│   │   ├── programa.service.ts
│   │   ├── programa.controller.ts
│   │   └── index.ts
│   └── chat-ia/                       # Agente de IA (Gemini)
└── app/
    ├── api/empresas/route.ts                       # GET lista (com stats) · POST cadastra
    ├── api/empresas/[slug]/route.ts                # GET · PUT (dados e regras)
    ├── api/empresas/[slug]/clientes[/ [id] ]       # GET lista · POST cadastra · GET detalhe
    ├── api/empresas/[slug]/indicacoes              # GET
    ├── api/empresas/[slug]/dashboard               # GET
    ├── api/empresas/[slug]/stats                   # GET (aceita slug ou id)
    └── dashboard/
        ├── empresas/[slug]/{dashboard,indicacoes,clientes}
        └── configuracoes/empresas                  # Tela de cadastro/edição de empresas
```

Fluxo: `route.ts` → Controller (HTTP) → Service (regras) → Repository (SQL). Classes com instância singleton exportada.

## Cadastro dinâmico de empresas

Tabela `empresas` (migration 018): `id`, `slug` (único, compõe as URLs), `nome`, `email`, `telefone`, `cnpj`, `cor`, `ativo` e `regras` (JSON). A migration já cadastra a **Empresa Exemplo** (`empresa-exemplo`).

Regras por empresa (`RegrasEmpresa`):

| Regra | Efeito |
|---|---|
| `pontos_indicador` | pontos lançados ao dono do link a cada cadastro (`api/clientes/cadastro`) |
| `pontos_indicado` | pontos lançados a quem se cadastrou pelo link |
| `valor_conversao` | recompensa (R$) por indicação convertida (`buscarClienteCompleto`) |
| `limite_indicacoes` | máximo de indicações por indicador; `0` = sem limite. Excedido: cadastro retorna 400 |

Para cadastrar uma empresa nova, use a tela **Gerenciar empresas** (`/dashboard/configuracoes/empresas`) ou `POST /api/empresas`. Não é preciso alterar código. Novas regras entram em `RegrasEmpresa`/`REGRAS_PADRAO` e em `EmpresasService.validarRegras`.

## Clientes

Os clientes de uma empresa são os participantes da tabela `indicacoes` (`GET/POST /api/empresas/[slug]/clientes`). Não há integração com sistema externo de clientes: o cadastro por link (`api/clientes/cadastro`) ainda **simula** o cadastro externo (id `MOCK_…`), de forma deliberada.

## Exemplos de APIs

```bash
GET  /api/empresas                          # empresas ativas com estatísticas (?todas=1 inclui inativas)
POST /api/empresas                          # { slug, nome, email, cor?, telefone?, cnpj?, ativo?, regras? }
PUT  /api/empresas/empresa-exemplo          # atualiza dados e regras (o slug não muda)
GET  /api/empresas/empresa-exemplo/clientes?page=1&limit=10
POST /api/empresas/empresa-exemplo/clientes # { nome, email, telefone?, cpf? }
GET  /api/empresas/empresa-exemplo/dashboard
```

## Pendências (TODO)

- **Migrations com nome da empresa antiga**: `011_add_guara_cliente_columns.js` (nome do arquivo e textos) e o comentário de `017_add_cliente_data_to_indicacoes.js` ainda citam o Guará. Migration já aplicada não pode ser editada nem renomeada (o runner registra pelo nome do arquivo). Verificar como resolver, por exemplo consolidando o histórico em um baseline novo para ambientes novos.
- **Integração externa por empresa**: cada empresa poderá ter seu próprio sistema de clientes/vendas. Falta definir um campo de configuração (ex.: `api_config`) e uma interface de conector; hoje o cadastro externo é simulado.
- **Dados antigos**: registros de `indicacoes`, `links` e `pontuacoes` com `empresa_id` da empresa removida (`guara-acqua-park-001`) ficam órfãos: `validate-link` e o cadastro retornam "Empresa não encontrada" para esses links.
- Rotas `api/usuarios-indicados/[id]/tornar-cliente` ainda usam SQL de tabela removida (`clientes`).
