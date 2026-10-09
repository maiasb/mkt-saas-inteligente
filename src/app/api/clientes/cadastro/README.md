# API de Cadastro de Clientes com Indicação

## Endpoint
```
POST /api/clientes/cadastro
```

## Descrição
Cadastra um novo cliente via sistema externo da empresa e registra o mapeamento de indicação.

## Status Atual
⚠️ **MODO SIMULAÇÃO** - A chamada à sistema externo está sendo simulada até o endpoint estar disponível.

## Request Body
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "61999999999",
  "cpf": "12345678900",
  "link_codigo": "ABC123XYZ",
  "empresa_id": "empresa-exemplo-001"
}
```

## Campos Obrigatórios
- `nome`: Nome completo do cliente
- `email`: Email do cliente
- `link_codigo`: Código do link de indicação usado
- `empresa_id`: ID da empresa (ex: "empresa-exemplo-001")

## Campos Opcionais
- `telefone`: Telefone do cliente
- `cpf`: CPF do cliente

## Fluxo de Execução

1. **Validação dos dados de entrada**
2. **Busca do link de indicação** na tabela `links`
3. **Validação do link** (ativo e pertence à empresa)
4. **🔄 SIMULAÇÃO: Cadastro na sistema externo**
   - Gera ID mock no formato `MOCK_xxxxxxxx`
   - Simula delay de 500ms
5. **Registro na tabela `indicacoes`**
   - Mapeia indicador → indicado
   - Evita duplicatas com verificação prévia
6. **Registro de pontuações na tabela `pontuacoes`**
   - Indicador: +10 pontos
   - Indicado: +5 pontos

## Response de Sucesso (201)
```json
{
  "success": true,
  "message": "Cliente cadastrado e indicação registrada com sucesso",
  "data": {
    "cliente_id": "MOCK_a1b2c3d4",
    "indicacao_id": "uuid-da-indicacao",
    "indicador_id": "id-do-cliente-indicador",
    "pontos": {
      "indicador": 10,
      "indicado": 5
    },
    "simulado": true
  }
}
```

## Responses de Erro

### 400 - Campos Obrigatórios Faltando
```json
{
  "error": "Campos obrigatórios: nome, email, link_codigo, empresa_id"
}
```

### 400 - Link Não Pertence à Empresa
```json
{
  "error": "Link não pertence a esta empresa"
}
```

### 404 - Link Inválido
```json
{
  "error": "Link inválido ou inativo"
}
```

### 409 - Cliente Já Indicado
```json
{
  "error": "Cliente já foi indicado anteriormente"
}
```

### 500 - Erro Interno
```json
{
  "error": "Erro ao processar cadastro"
}
```

## Configuração de Pontos
Atualmente hardcoded:
- **Indicador**: 10 pontos
- **Indicado**: 5 pontos

Pode ser configurado futuramente por empresa ou tipo de indicação.

## Migração para API Real

Quando o endpoint do sistema externo estiver pronto, descomentar o bloco de código real:

```typescript
const respostaExterna = await fetch('https://api.exemplo.com/clientes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.EMPRESA_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nome,
    email,
    telefone,
    cpf,
  })
});

const dadosExternos = await respostaExterna.json();
const clienteExternoId = dadosExternos.cliente_id;
```

E remover:
- Geração de ID mock
- Campo `simulado: true` na response
- Delay artificial
- Logs de simulação

## Exemplo de Uso

### cURL
```bash
curl -X POST http://localhost:3000/api/clientes/cadastro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "telefone": "61988887777",
    "cpf": "98765432100",
    "link_codigo": "XYZ789ABC",
    "empresa_id": "empresa-exemplo-001"
  }'
```

### JavaScript/Fetch
```javascript
const response = await fetch('/api/clientes/cadastro', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nome: 'Maria Santos',
    email: 'maria@email.com',
    telefone: '61988887777',
    cpf: '98765432100',
    link_codigo: 'XYZ789ABC',
    empresa_id: 'empresa-exemplo-001'
  })
});

const data = await response.json();
```

## Tabelas Afetadas

- **`indicacoes`**: Registro da relação indicador → indicado
- **`pontuacoes`**: Pontos para indicador e indicado

## Logs do Console

Durante execução, você verá:
```
🔄 [SIMULADO] Cadastrando cliente na sistema externo: { ... }
✅ [SIMULADO] Cliente cadastrado no sistema externo com ID: MOCK_xxxxxxxx
✅ Indicação registrada: uuid-da-indicacao
✅ Pontuações registradas
```
