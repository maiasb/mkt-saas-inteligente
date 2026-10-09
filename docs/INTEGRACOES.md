# Integrações externas

## Guará Acqua Park
Código: `src/modules/guara-acqua-park/guara.repository.ts`, `src/app/api/links/route.ts`.
- Env: `GUARA_API_URL`, `GUARA_API_TOKEN`. Header `Authorization: <token>` (sem `Bearer`) e `User-Agent: Dreams-Indicacoes/1.0`.
- Endpoints usados (GET): `/clientes/?page=&limit=` (listagem), `/clientes/?busca=<cpf>` (busca por CPF, resposta em `lista[]`), `/clientes/<id>` (fallback em `api/links`).
- Campos relevantes do cliente: `_id`, `cpf_cnpj`, `nome`, `email`, `telefones[]`, `status`, `associado_status`, `all_titulos[]`.
- **Sem env configurada**, `listarClientes` devolve dados mockados.
- **Cadastro de cliente é simulado**: `src/app/api/clientes/cadastro/route.ts` gera um id `MOCK_…` e não chama a API (o `POST` real está comentado no arquivo). Ver `src/app/api/clientes/cadastro/README.md`.
- Regras locais: R$ 50 por conversão, limite de 10 indicações por cliente (`guara.service.ts`).

## Limber Card (plataforma de vendas)
Código: `src/modules/limber-card/`, rotas `src/app/api/limber-card/`, tela `src/app/dashboard/vendas/page.tsx`.
- Env: `LIMBER_CARD_API_URL`, `LIMBER_CARD_USER`, `LIMBER_CARD_PASSWORD`.
- Autenticação: `POST {API_URL}/auth` com `{ usuario, senha }`; resposta com `status: 'ok'` e `token`. O token é guardado em memória na instância do repository por 1 hora (`getToken`); não é compartilhado entre instâncias do servidor.
- Rotas expostas: `POST /api/limber-card/auth`, `GET /api/limber-card/token`, `GET /api/limber-card/vendas` (filtros `estabelecOrig`, `limit`, `dataVendaInit`, `dataVendaFim`), `GET /api/limber-card/vendas/[codigo]`.
- Atenção: `auth` e `token` devolvem o token JWT ao navegador e as rotas não exigem login. Ver pendência de autenticação.
