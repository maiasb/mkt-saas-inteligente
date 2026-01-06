# Dreams - Painel Administrativo

Sistema de recomendações e premiações da agência Dreams para empresas parceiras.

## 🚀 Funcionalidades

- **Autenticação**: Sistema de login para acesso ao painel
- **Dashboard**: Visão geral com estatísticas
- **Gestão de Empresas**: Cadastro e gerenciamento de empresas agenciadas
- **Gestão de Clientes**: Gerenciamento de clientes por empresa
- **Geração de Links**: Sistema de links de indicação para rastreamento

## 🛠️ Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **LocalStorage** - Armazenamento temporário de dados

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## 🔑 Credenciais de Teste

- **Email**: admin@dreams.com
- **Senha**: admin123

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── dashboard/
│   │   ├── empresas/
│   │   │   ├── [id]/
│   │   │   │   └── clientes/
│   │   │   │       └── page.tsx
│   │   │   └── page.tsx
│   │   ├── links/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
```

## 🎯 Próximos Passos

- [ ] Implementar backend com API REST
- [ ] Adicionar autenticação JWT
- [ ] Criar banco de dados
- [ ] Implementar sistema de recompensas
- [ ] Adicionar analytics e relatórios
- [ ] Criar sistema de notificações

## 📝 Notas de Desenvolvimento

Atualmente, o projeto usa `localStorage` para armazenamento de dados. Esta é uma solução temporária para demonstração. Em produção, deve ser substituído por um backend adequado com banco de dados.

## 🎨 Features Implementadas

### Página de Login
- Interface moderna com gradiente
- Validação de credenciais
- Redirecionamento após login

### Dashboard
- Cards de navegação
- Estatísticas básicas
- Menu de logout

### Gestão de Empresas
- Listagem de empresas
- Cadastro de novas empresas
- Exclusão de empresas
- Acesso aos clientes

### Gestão de Clientes
- Listagem de clientes por empresa
- Cadastro de novos clientes
- Exclusão de clientes
- Visualização em tabela

### Geração de Links
- Criação de links únicos por empresa
- Cópia de links para área de transferência
- Listagem de todos os links gerados
- Exclusão de links

## 📄 Licença

Projeto privado - Dreams Agency
# dreams-indicacoes
