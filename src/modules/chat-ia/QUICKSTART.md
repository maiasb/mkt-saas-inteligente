# 🤖 Guia Rápido - Chat IA

## ⚡ Início Rápido

### 1. Configure a API Key da OpenAI

Edite o arquivo `.env` na raiz do projeto:

```bash
OPENAI_API_KEY="sk-proj-sua-chave-aqui"
```

### 2. Obtenha sua API Key

1. Acesse: https://platform.openai.com/api-keys
2. Clique em "Create new secret key"
3. Copie a chave gerada
4. Cole no arquivo `.env`

### 3. Reinicie o servidor

```bash
npm run dev
```

### 4. Acesse o Chat

Navegue até: http://localhost:3000/dashboard/chat-ia

## 🎯 Como Usar

1. **Digite sua mensagem** no campo de texto
2. **Pressione Enter** ou clique em "Enviar"
3. **Aguarde a resposta** do assistente IA
4. **Continue a conversa** - o histórico é mantido automaticamente

## ⌨️ Atalhos

- `Enter` - Envia a mensagem
- `Shift + Enter` - Nova linha no texto

## 🎨 Recursos

- ✅ Conversas naturais com GPT-4o-mini
- ✅ Histórico mantido durante a sessão
- ✅ Interface responsiva (funciona em mobile)
- ✅ Indicador visual de carregamento
- ✅ Timestamp em cada mensagem

## 💬 Exemplos de Perguntas

- "Como funciona o sistema de indicações?"
- "Quais empresas parceiras vocês têm?"
- "Como posso gerar um link de indicação?"
- "Explique o sistema de recompensas"

## 🔧 Personalização

### Alterar o Prompt do Sistema

Edite o arquivo: `src/modules/chat-ia/chat.service.ts`

Procure por:
```typescript
content: 'Você é um assistente inteligente da Dreams...'
```

### Trocar o Modelo

No mesmo arquivo, altere:
```typescript
model: 'gpt-4o-mini'  // ou 'gpt-4o', 'gpt-5', etc.
```

## ⚠️ Importante

- A API Key **não deve** ser commitada no Git
- Mantenha a chave em `.env` (já está no `.gitignore`)
- Monitore o uso no [OpenAI Dashboard](https://platform.openai.com/usage)

## 💰 Custos Aproximados

Com GPT-4o-mini:
- Conversa típica (20 mensagens): ~$0.001
- 1000 conversas: ~$1.00

## ❓ Problemas Comuns

### "Chave de API inválida"
- Verifique se copiou a chave completa
- Certifique-se de que está no arquivo `.env`
- Reinicie o servidor

### "Limite atingido"
- Aguarde alguns minutos
- Verifique seu plano na OpenAI

### Chat não aparece no menu
- Limpe o cache do navegador
- Verifique se está logado no painel

## 📚 Mais Informações

Veja o README completo: [`src/modules/chat-ia/README.md`](./README.md)
