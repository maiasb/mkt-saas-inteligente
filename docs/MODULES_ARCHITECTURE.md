# Arquitetura de Módulos por Empresa

Sistema organizado com separação completa de requisições e dados por empresa.

## 📁 Estrutura

```
src/
├── config/
│   └── empresas.config.ts           # Registro hard coded de empresas
│
├── modules/                          # Módulos por empresa
│   ├── guara-acqua-park/
│   │   ├── guara.repository.ts      # Acesso ao banco de dados
│   │   ├── guara.service.ts         # Lógica de negócio
│   │   ├── guara.controller.ts      # Controle de requisições
│   │   └── index.ts                 # Exportações
│   │
│   └── dreams-agency/
│       ├── dreams.repository.ts
│       ├── dreams.service.ts
│       ├── dreams.controller.ts
│       └── index.ts
│
└── app/api/                          # APIs separadas por empresa
    ├── guara-acqua-park/
    │   ├── clientes/
    │   │   ├── route.ts             # GET /api/guara-acqua-park/clientes
    │   │   └── [id]/route.ts        # GET /api/guara-acqua-park/clientes/:id
    │   ├── indicacoes/route.ts      # POST /api/guara-acqua-park/indicacoes
    │   └── stats/route.ts           # GET /api/guara-acqua-park/stats
    │
    ├── dreams-agency/
    │   ├── clientes/
    │   │   ├── route.ts
    │   │   └── [id]/route.ts
    │   └── stats/route.ts
    │
    └── empresas/
        └── lista/route.ts           # GET /api/empresas/lista (agregador)
```

## 🏢 Empresas Cadastradas (Hard Coded)

Empresas são definidas em [`src/config/empresas.config.ts`](../src/config/empresas.config.ts):

```typescript
export const EMPRESAS = {
  'guara-acqua-park': {
    id: 'guara-acqua-park-001',
    slug: 'guara-acqua-park',
    nome: 'Guará Acqua Park',
    email: 'contato@guaraacquapark.com.br',
    telefone: '(61) 3999-0000',
    cnpj: '12.345.678/0001-90',
    ativo: true,
    cor: '#0EA5E9', // Tema visual
  },
  
  'dreams-agency': {
    id: 'dreams-agency-001',
    slug: 'dreams-agency',
    nome: 'Dreams Agency',
    // ...
  },
};
```

## 📊 Camadas da Arquitetura

### 1. Repository (Acesso a Dados)

Responsável por todas as queries ao banco de dados.

```typescript
// modules/guara-acqua-park/guara.repository.ts
export class GuaraRepository {
  private readonly empresaId = 'guara-acqua-park-001';

  async listarClientes() {
    const [rows] = await db.query(
      'SELECT * FROM clientes WHERE empresa_id = ?',
      [this.empresaId]
    );
    return rows;
  }
  
  async registrarIndicacao(clienteId, nome, email) {
    // INSERT na tabela usuarios_indicados
  }
}
```

**Responsabilidades:**
- Queries SQL
- CRUD de entidades
- Filtros por empresa_id

### 2. Service (Lógica de Negócio)

Orquestra operações e aplica regras de negócio.

```typescript
// modules/guara-acqua-park/guara.service.ts
export class GuaraService {
  async criarIndicacao(clienteId, nome, email) {
    // Validações
    const cliente = await guaraRepository.buscarClientePorId(clienteId);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    // Verifica se já indicou este email
    const jaIndicado = // ... verificação
    if (jaIndicado) throw new Error('Email já indicado');
    
    // Verifica limite mensal (10 indicações)
    const stats = await guaraRepository.buscarEstatisticas(clienteId);
    if (stats.total_indicacoes >= 10) {
      throw new Error('Limite atingido');
    }
    
    // Registra
    return await guaraRepository.registrarIndicacao(clienteId, nome, email);
  }
}
```

**Responsabilidades:**
- Validações de negócio
- Orquestração de múltiplas operações
- Cálculos (recompensas, estatísticas)
- Tratamento de erros

### 3. Controller (API Handling)

Recebe requisições HTTP e retorna respostas.

```typescript
// modules/guara-acqua-park/guara.controller.ts
export class GuaraController {
  async criarIndicacao(request: NextRequest) {
    try {
      const body = await request.json();
      const { clienteId, nome, email, telefone } = body;
      
      if (!clienteId || !nome || !email) {
        return NextResponse.json(
          { error: 'Campos obrigatórios faltando' },
          { status: 400 }
        );
      }
      
      const result = await guaraService.criarIndicacao(
        clienteId, nome, email, telefone
      );
      
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  }
}
```

**Responsabilidades:**
- Parse de requests
- Validação de input
- Formatação de responses
- Status codes HTTP

### 4. API Routes (Endpoints)

Mapeia URLs para controllers.

```typescript
// app/api/guara-acqua-park/indicacoes/route.ts
import { guaraController } from '@/modules/guara-acqua-park';

export async function POST(request: NextRequest) {
  return guaraController.criarIndicacao(request);
}
```

## 🔄 Fluxo de Uma Requisição

```
Cliente Web
    ↓
POST /api/guara-acqua-park/indicacoes
    ↓
API Route (app/api/guara-acqua-park/indicacoes/route.ts)
    ↓
GuaraController.criarIndicacao()
    ↓
GuaraService.criarIndicacao()
    ├─→ Validações de negócio
    ├─→ Verificações (limite, duplicatas)
    └─→ GuaraRepository.registrarIndicacao()
            ↓
        MySQL Database
```

## 🆕 Como Adicionar Nova Empresa

### 1. Registrar em empresas.config.ts

```typescript
export const EMPRESAS = {
  // ... empresas existentes
  
  'nova-empresa': {
    id: 'nova-empresa-001',
    slug: 'nova-empresa',
    nome: 'Nova Empresa Ltda',
    email: 'contato@novaempresa.com',
    ativo: true,
    cor: '#10B981', // Verde
  },
};
```

### 2. Criar módulo

```bash
mkdir src/modules/nova-empresa
```

**Repository:**
```typescript
// src/modules/nova-empresa/nova-empresa.repository.ts
export class NovaEmpresaRepository {
  private readonly empresaId = 'nova-empresa-001';
  
  async listarClientes() {
    // Implementação
  }
}

export const novaEmpresaRepository = new NovaEmpresaRepository();
```

**Service:**
```typescript
// src/modules/nova-empresa/nova-empresa.service.ts
export class NovaEmpresaService {
  async listarClientes() {
    return await novaEmpresaRepository.listarClientes();
  }
}

export const novaEmpresaService = new NovaEmpresaService();
```

**Controller:**
```typescript
// src/modules/nova-empresa/nova-empresa.controller.ts
export class NovaEmpresaController {
  async listarClientes(request: NextRequest) {
    try {
      const clientes = await novaEmpresaService.listarClientes();
      return NextResponse.json(clientes);
    } catch (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
  }
}

export const novaEmpresaController = new NovaEmpresaController();
```

**Index:**
```typescript
// src/modules/nova-empresa/index.ts
export * from './nova-empresa.repository';
export * from './nova-empresa.service';
export * from './nova-empresa.controller';
```

### 3. Criar API Routes

```bash
mkdir -p src/app/api/nova-empresa/clientes
```

```typescript
// src/app/api/nova-empresa/clientes/route.ts
import { NextRequest } from 'next/server';
import { novaEmpresaController } from '@/modules/nova-empresa';

export async function GET(request: NextRequest) {
  return novaEmpresaController.listarClientes(request);
}
```

### 4. Adicionar ao agregador

Edite [`src/app/api/empresas/lista/route.ts`](../src/app/api/empresas/lista/route.ts):

```typescript
import { novaEmpresaService } from '@/modules/nova-empresa';

// ...no map de empresas:
if (empresa.slug === 'nova-empresa') {
  stats = await novaEmpresaService.buscarEstatisticasGerais();
}
```

## 🎯 Benefícios da Arquitetura

### ✅ Separação de Responsabilidades
- Cada camada tem papel bem definido
- Repository: dados
- Service: lógica
- Controller: HTTP

### ✅ Isolamento por Empresa
- Cada empresa tem seu módulo independente
- Mudanças em uma empresa não afetam outras
- Fácil debug e manutenção

### ✅ Escalabilidade
- Adicionar nova empresa é simples e rápido
- Padrão consistente entre empresas
- Código reutilizável

### ✅ Organização de Dados
- Requisições completamente separadas
- Queries filtradas por empresa_id
- Logs específicos por empresa

### ✅ Testabilidade
- Cada camada pode ser testada isoladamente
- Mocks fáceis de implementar
- Testes unitários por empresa

### ✅ Type Safety
- TypeScript em todas as camadas
- Interfaces específicas por empresa
- Autocomplete e validação em tempo de desenvolvimento

## 📝 Convenções de Nomenclatura

- **Repository:** `NomeEmpresaRepository`
- **Service:** `NomeEmpresaService`
- **Controller:** `NomeEmpresaController`
- **Instância singleton:** `nomeEmpresaRepository`, `nomeEmpresaService`, etc.
- **API Route:** `/api/nome-empresa/recurso`
- **Empresa ID:** `nome-empresa-001`
- **Empresa Slug:** `nome-empresa` (kebab-case)

## 🔍 Exemplos de APIs

### Guará Acqua Park

```bash
# Listar clientes
GET /api/guara-acqua-park/clientes

# Buscar cliente específico
GET /api/guara-acqua-park/clientes/:id

# Criar indicação
POST /api/guara-acqua-park/indicacoes
{
  "clienteId": "uuid",
  "nome": "João",
  "email": "joao@email.com"
}

# Estatísticas
GET /api/guara-acqua-park/stats
```

### Dreams Agency

```bash
# Listar clientes
GET /api/dreams-agency/clientes

# Buscar cliente
GET /api/dreams-agency/clientes/:id

# Estatísticas
GET /api/dreams-agency/stats
```

### Agregador

```bash
# Lista todas as empresas com estatísticas
GET /api/empresas/lista
```

## 🚀 Próximos Passos

1. **Testes Automatizados**
   - Jest para testes unitários
   - Testes de integração por módulo

2. **Documentação API**
   - OpenAPI/Swagger specs
   - Postman collections

3. **Monitoramento**
   - Logs estruturados por empresa
   - Métricas de performance
   - Error tracking

4. **Cache**
   - Redis para queries frequentes
   - Cache por empresa

5. **Webhooks**
   - Notificações de eventos
   - Integrações externas
