# 🤖 Function Calling - Análise de Vendas Limber

## ✅ Implementado com Sucesso!

O Chat IA agora tem acesso em **tempo real** aos dados de vendas da plataforma Limber Card através de **Function Calling** da OpenAI.

## 🎯 O que o Agente Pode Fazer

### 1. **Listar Vendas**
Consulta vendas com filtros personalizados.

**Exemplos de perguntas:**
- "Quais foram as vendas de hoje?"
- "Mostre as vendas da última semana"
- "Liste as vendas de dezembro de 2025"

### 2. **Detalhes de Venda Específica**
Obtém informações completas de uma venda pelo código.

**Exemplos:**
- "Me dê detalhes da venda #1234"
- "Qual foi o evento da venda código 5678?"

### 3. **Análises Estatísticas**
Gera análises automáticas com totais, médias e tendências.

**Exemplos:**
- "Faça uma análise das vendas desta semana"
- "Qual foi o faturamento do mês?"
- "Quantas vendas tivemos hoje?"
- "Qual o ticket médio das vendas?"

## 🔧 Como Funciona

### Fluxo Automático:

1. **Usuário pergunta:** "Quantas vendas tivemos hoje?"

2. **IA analisa** e decide chamar a função `analisar_vendas`

3. **Sistema executa:** Busca dados reais da API Limber

4. **IA recebe dados:**
```json
{
  "total_vendas": 47,
  "valor_total": 12500.00,
  "ticket_medio": 265.96
}
```

5. **IA gera resposta:** 
> "Hoje tivemos 47 vendas, totalizando R$ 12.500,00 com um ticket médio de R$ 265,96."

## 📊 Ferramentas Disponíveis

| Função | Descrição | Parâmetros |
|--------|-----------|------------|
| `listar_vendas_limber` | Lista vendas com filtros | limit, dataVendaInit, dataVendaFim |
| `obter_detalhes_venda` | Detalhes de venda específica | codigoVenda |
| `analisar_vendas` | Análise estatística | periodo (hoje/semana/mes/ano) |

## 💡 Exemplos de Uso

### Análise Rápida
```
Você: "Como foram as vendas esta semana?"

IA: 🔍 Consultando dados em tempo real...

IA: "Esta semana registramos 143 vendas, totalizando R$ 38.750,00. 
     O ticket médio foi de R$ 270,98, com uma média de 20 vendas por dia."
```

### Comparação de Períodos
```
Você: "Compare as vendas deste mês com o mês passado"

IA: [Busca dados dos dois períodos e compara]

IA: "Este mês tivemos 420 vendas (R$ 115.000), um crescimento de 15% 
     em relação ao mês passado (365 vendas, R$ 100.000)."
```

### Detalhes Específicos
```
Você: "Me dê mais informações sobre a venda #1234"

IA: [Busca detalhes da venda]

IA: "A venda #1234 foi realizada em 15/01/2026:
     - Evento: Show de Rock
     - Valor: R$ 450,00
     - Cliente: João Silva
     - Status: Confirmado"
```

## 🚀 Recursos Implementados

- ✅ **Function Calling** automático
- ✅ **3 ferramentas** integradas
- ✅ **Loop de execução** (até 5 iterações)
- ✅ **Indicador visual** "🔍 Consultando dados..."
- ✅ **Tratamento de erros** robusto
- ✅ **Cache inteligente** de conversas

## 🎨 Interface Atualizada

- **Mensagem azul**: Indica quando está consultando dados
- **Resposta contextual**: IA usa dados reais para responder
- **Histórico mantido**: Conversas anteriores são consideradas

## 🔒 Segurança

- ✅ Funções executam apenas no servidor
- ✅ Dados não expostos ao frontend
- ✅ Validação de parâmetros
- ✅ Limitação de iterações (previne loops)

## 📝 Adicionar Novas Ferramentas

Para adicionar novas capacidades, edite [`chat.service.ts`](./chat.service.ts):

### 1. Defina a ferramenta em `getTools()`:

```typescript
{
  type: 'function' as const,
  function: {
    name: 'buscar_clientes_guara',
    description: 'Busca clientes do Guará Acqua Park',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        limit: { type: 'number' }
      }
    }
  }
}
```

### 2. Implemente em `executeFunction()`:

```typescript
case 'buscar_clientes_guara': {
  const response = await fetch(`/api/guara-acqua-park/clientes?...`);
  return await response.json();
}
```

## 💰 Custos

Function calling usa mais tokens, mas permite análises precisas:

| Operação | Tokens Aprox. | Custo (GPT-4o-mini) |
|----------|---------------|---------------------|
| Pergunta simples | 500 | $0.0001 |
| Com 1 function call | 1500 | $0.0003 |
| Análise complexa | 3000 | $0.0006 |

**Dica:** Use `gpt-4o-mini` (já configurado) para custos baixos.

## 🐛 Troubleshooting

### IA não chama funções
- Verifique se a pergunta é clara
- Certifique-se de que a API Limber está configurada
- Veja logs no console do servidor

### Erro ao executar função
- Verifique variável `NEXT_PUBLIC_BASE_URL`
- Confirme que a API Limber retorna dados válidos
- Veja logs de erro no servidor

## 🎯 Próximos Passos

**Sugestões de novas ferramentas:**

- [ ] Buscar clientes do Guará
- [ ] Consultar indicações por período
- [ ] Analisar conversão de links
- [ ] Gerar relatórios em PDF
- [ ] Enviar notificações
- [ ] Buscar na API externa do Guará

## 📚 Referências

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Chat Completions API](https://platform.openai.com/docs/api-reference/chat)
- [Tools Parameter](https://platform.openai.com/docs/guides/tools)

---

**Pronto para usar!** Acesse `/dashboard/chat-ia` e pergunte sobre vendas! 🚀
