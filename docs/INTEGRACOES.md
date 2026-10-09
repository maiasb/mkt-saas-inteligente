# Integrações externas

Não há integrações externas ativas. As integrações com sistemas de clientes/vendas de empresas específicas foram removidas; o cadastro de clientes é local (tabela `indicacoes`).

- **Cadastro por link é simulado**: `src/app/api/clientes/cadastro/route.ts` gera um id `MOCK_…` e não chama nenhum sistema externo. Ver `src/app/api/clientes/cadastro/README.md`.
- **Gemini** (agente de IA): `GEMINI_API_KEY`, `GEMINI_MODEL`. Código em `src/modules/chat-ia/`.
- Conectores por empresa: ver pendência em [MODULES_ARCHITECTURE.md](MODULES_ARCHITECTURE.md).
