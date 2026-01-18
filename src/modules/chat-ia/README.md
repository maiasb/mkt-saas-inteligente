# Módulo Chat IA - OpenAI Integration

Este módulo implementa um chat com inteligência artificial usando a API da OpenAI.

## 📋 Estrutura

```
src/
├── modules/chat-ia/
│   ├── chat.service.ts      # Lógica de integração com OpenAI
│   ├── chat.controller.ts   # Controle das requisições HTTP
│   └── index.ts            # Exports do módulo
├── app/
│   ├── api/chat-ia/
│   │   ├── route.ts         # Endpoint para mensagens simples
│   │   └── stream/
│   │       └── route.ts     # Endpoint para mensagens com streaming
│   └── dashboard/chat-ia/
│       └── page.tsx         # Interface do usuário
```

## 🚀 Funcionalidades

- ✅ Chat em tempo real com GPT-4o-mini
- ✅ Histórico de conversação (últimas 10 mensagens)
- ✅ Interface moderna e responsiva
- ✅ Suporte a streaming (preparado para implementação futura)
- ✅ Tratamento de erros
- ✅ Loading states e feedback visual

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione a chave da API OpenAI no arquivo `.env`:

```bash
OPENAI_API_KEY="sk-proj-your-openai-api-key-here"
```

### 2. Obter API Key

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Faça login ou crie uma conta
3. Navegue até [API Keys](https://platform.openai.com/api-keys)
4. Clique em "Create new secret key"
5. Copie a chave e adicione ao `.env`

### 3. Instalar Dependências

A dependência já foi instalada:

```bash
npm install openai
```

## 📡 API Endpoints

### POST `/api/chat-ia`

Envia mensagem e recebe resposta completa.

**Request:**
```json
{
  "message": "Olá, como funciona o sistema?",
  "conversationHistory": [
    { "role": "user", "content": "Mensagem anterior" },
    { "role": "assistant", "content": "Resposta anterior" }
  ]
}
```

**Response:**
```json
{
  "message": "Resposta do assistente..."
}
```

### POST `/api/chat-ia/stream` (Preparado)

Envia mensagem com streaming (implementação futura).

## 🎨 Interface do Usuário

Acesse: `/dashboard/chat-ia`

### Recursos da UI:

- 💬 Mensagens em bolhas (usuário à direita, assistente à esquerda)
- ⏰ Timestamp em cada mensagem
- ⌨️ Textarea expansível (até 150px)
- 📱 Totalmente responsivo
- 🎯 Auto-scroll para última mensagem
- ⌛ Loading indicator com animação
- ⌨️ Atalhos: Enter (enviar) / Shift+Enter (nova linha)

## 💡 Exemplos de Uso

### Modificar o Prompt do Sistema

Edite em [`chat.service.ts`](../../modules/chat-ia/chat.service.ts):

```typescript
{
  role: 'developer' as const,
  content: 'Seu novo prompt personalizado aqui...',
}
```

### Alterar o Modelo

Troque em [`chat.service.ts`](../../modules/chat-ia/chat.service.ts):

```typescript
const response = await this.client.responses.create({
  model: 'gpt-4o',  // ou 'gpt-5', 'gpt-5-mini', etc.
  input: messages,
});
```

### Adicionar Contexto Adicional

```typescript
const messages = [
  {
    role: 'developer',
    content: 'Você é um assistente da Dreams...',
  },
  {
    role: 'developer',
    content: `Informações do cliente: ${JSON.stringify(clientData)}`,
  },
  ...conversationHistory,
  { role: 'user', content: message },
];
```

## 📊 Custos

O modelo `gpt-4o-mini` é econômico:

- **Input**: ~$0.15 por 1M tokens
- **Output**: ~$0.60 por 1M tokens

Para reduzir custos:
- Limite o histórico (já implementado: 10 mensagens)
- Use mensagens concisas
- Implemente cache quando possível

## 🔒 Segurança

- ✅ API Key em variável de ambiente
- ✅ Validação de inputs
- ✅ Tratamento de erros
- ✅ Rate limiting (via OpenAI)

## 🐛 Troubleshooting

### Erro: "Chave de API inválida"

Verifique se a `OPENAI_API_KEY` está correta no `.env`.

### Erro: "Limite de requisições atingido"

Você atingiu o rate limit da OpenAI. Aguarde alguns instantes.

### Módulo não carrega

Certifique-se de que:
1. O pacote `openai` está instalado
2. O servidor foi reiniciado após adicionar a API key

## 📚 Referências

- [OpenAI Documentation](https://platform.openai.com/docs/overview)
- [Responses API](https://platform.openai.com/docs/guides/text)
- [Models](https://platform.openai.com/docs/models)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

## 🚧 Próximas Melhorias

- [ ] Implementar streaming completo na UI
- [ ] Adicionar suporte a imagens (vision)
- [ ] Persistir conversas no banco de dados
- [ ] Adicionar função calling para integrar com sistema
- [ ] Implementar análise de sentimento
- [ ] Adicionar botões de ação rápida
