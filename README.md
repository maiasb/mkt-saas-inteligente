# Agência de Marketing - Painel Administrativo

Sistema de recomendações e premiações da Agência de Marketing para as empresas agenciadas.

## 🚀 Funcionalidades

- **Autenticação**: Sistema de login para acesso ao painel
- **Dashboard**: Visão geral com estatísticas
- **Gestão de Empresas**: Cadastro hard-coded com módulos isolados
- **Gestão de Clientes**: Gerenciamento de clientes por empresa
- **Sistema de Indicações**: Criação e gerenciamento de indicações com validações customizadas
- **Estatísticas**: Dashboards com métricas de conversão e recompensas

## 🛠️ Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **MySQL** - Banco de dados relacional
- **Arquitetura Modular** - Repository-Service-Controller por empresa

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar banco de dados MySQL
# Execute os scripts de migração em database/migrations/

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## 🏗️ Arquitetura

Empresas são cadastradas dinamicamente (tabela `empresas`), cada uma com suas regras de negócio. Os módulos são genéricos e recebem a empresa como parâmetro:

```
src/modules/empresas/            # CRUD de empresas e regras
src/modules/programa-indicacao/  # clientes, indicações e dashboard por empresa
```

Consulte [docs/MODULES_ARCHITECTURE.md](docs/MODULES_ARCHITECTURE.md) para detalhes completos.

## 🔑 Credenciais de Teste

- **Email**: admin@agencia.com
- **Senha**: admin123

## 🎯 API Endpoints

- `GET /api/empresas` - Lista empresas ativas com estatísticas (`?todas=1` inclui inativas)
- `POST /api/empresas` - Cadastra empresa (dados + regras)
- `GET /api/empresas/[slug]` - Busca empresa
- `PUT /api/empresas/[slug]` - Atualiza dados e regras
- `GET /api/empresas/[slug]/clientes` - Lista clientes
- `POST /api/empresas/[slug]/clientes` - Cadastra cliente
- `GET /api/empresas/[slug]/clientes/[id]` - Busca cliente
- `GET /api/empresas/[slug]/indicacoes` - Lista indicações
- `GET /api/empresas/[slug]/dashboard` - Dados do dashboard
- `GET /api/empresas/[slug]/stats` - Estatísticas (aceita slug ou id)

## 🎨 Features Implementadas

### Gestão de Empresas
- Cadastro dinâmico pela tela *Gerenciar empresas*
- Regras de negócio por empresa (pontos, recompensa, limite)
- Estatísticas agregadas
- Interface com cores temáticas

### Sistema de Indicações
- Criação via link único
- Validações customizadas por empresa
- Tracking de conversões
- Cálculo automático de recompensas

### Dashboard por Empresa
- Listagem de clientes
- Gerenciamento de links de indicação
- Visualização de métricas
- Interface responsiva

## 📝 Como Adicionar Nova Empresa

Acesse **Gerenciar empresas** (`/dashboard/configuracoes/empresas`) ou use `POST /api/empresas`. Não é preciso alterar código.

## 🎯 Próximos Passos

- [ ] Implementar autenticação JWT
- [ ] Sistema de notificações
- [ ] Criar mais empresas no sistema
- [ ] Adicionar analytics avançados
- [ ] Dashboard executivo com métricas consolidadas

## 📄 Licença

Projeto privado
