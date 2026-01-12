# Dreams - Painel Administrativo

Sistema de recomendações e premiações da agência Dreams para empresas parceiras.

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

O sistema utiliza uma arquitetura modular onde cada empresa possui sua própria estrutura isolada:

### Estrutura de Módulos

```
src/modules/{empresa-slug}/
├── {empresa}.repository.ts  # Acesso aos dados
├── {empresa}.service.ts     # Lógica de negócio
├── {empresa}.controller.ts  # Camada HTTP
└── index.ts                 # Exportações
```

### Empresas Configuradas

- **Guará Acqua Park** (`guara-acqua-park`)
  - Limite: 10 indicações por mês por cliente
  - Recompensa: R$ 50,00 por conversão
  
- **Dreams Agency** (`dreams-agency`)
  - Sistema básico de indicações
  - Em desenvolvimento

Consulte [docs/MODULES_ARCHITECTURE.md](docs/MODULES_ARCHITECTURE.md) para detalhes completos sobre a arquitetura.

## 🔑 Credenciais de Teste

- **Email**: admin@dreams.com
- **Senha**: admin123

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── empresas/
│   │   │   └── lista/          # Agregador de empresas
│   │   ├── guara-acqua-park/   # APIs Guará
│   │   │   ├── clientes/
│   │   │   ├── indicacoes/
│   │   │   └── stats/
│   │   └── dreams-agency/      # APIs Dreams
│   │       ├── clientes/
│   │       └── stats/
│   ├── dashboard/
│   │   ├── empresas/
│   │   │   └── [slug]/
│   │   │       └── clientes/
│   │   ├── links/
│   │   └── page.tsx
│   ├── login/
│   └── ref/[codigo]/           # Landing page de indicação
├── components/
│   └── Sidebar.tsx
├── config/
│   └── empresas.config.ts      # Registro hard-coded de empresas
├── lib/
│   └── db.ts                   # Cliente MySQL
└── modules/
    ├── guara-acqua-park/       # Módulo Guará
    │   ├── guara.repository.ts
    │   ├── guara.service.ts
    │   ├── guara.controller.ts
    │   └── index.ts
    └── dreams-agency/          # Módulo Dreams
        ├── dreams.repository.ts
        ├── dreams.service.ts
        ├── dreams.controller.ts
        └── index.ts
```

## 🎯 API Endpoints

### Empresas
- `GET /api/empresas/lista` - Lista todas empresas com estatísticas

### Guará Acqua Park
- `GET /api/guara-acqua-park/clientes` - Lista clientes
- `GET /api/guara-acqua-park/clientes/[id]` - Busca cliente específico
- `POST /api/guara-acqua-park/indicacoes` - Cria indicação
- `GET /api/guara-acqua-park/stats` - Estatísticas

### Dreams Agency
- `GET /api/dreams-agency/clientes` - Lista clientes
- `GET /api/dreams-agency/clientes/[id]` - Busca cliente específico
- `GET /api/dreams-agency/stats` - Estatísticas

## 🎨 Features Implementadas

### Gestão de Empresas
- Cadastro hard-coded no código
- Cada empresa com módulo isolado
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

1. **Configuração**: Adicione em `src/config/empresas.config.ts`
2. **Módulo**: Crie pasta `src/modules/{empresa-slug}/` com Repository, Service e Controller
3. **APIs**: Crie rotas em `src/app/api/{empresa-slug}/`
4. **Banco**: Insira registro na tabela `empresas`

Consulte a [documentação de arquitetura](docs/MODULES_ARCHITECTURE.md) para guia detalhado.

## 🎯 Próximos Passos

- [ ] Popular banco de dados com empresas
- [ ] Implementar autenticação JWT
- [ ] Sistema de notificações
- [ ] Criar mais empresas no sistema
- [ ] Adicionar analytics avançados
- [ ] Dashboard executivo com métricas consolidadas

## 📄 Licença

Projeto privado - Dreams Agency
