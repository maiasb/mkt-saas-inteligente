// Service para Chat IA - OpenAI

import OpenAI from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'developer';
  content: string;
}

export interface ChatResponse {
  message: string;
  conversationId?: string;
  toolCalls?: any[];
}

export class ChatService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Define as ferramentas (tools) disponíveis para o agente
   */
  private getTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'listar_vendas_limber',
          description: 'Lista vendas da plataforma Limber Card. Use para consultar vendas de eventos. SEMPRE especifique o estabelecimento (ecommerce ou bilheteria).',
          parameters: {
            type: 'object',
            properties: {
              estabelecimento: {
                type: 'string',
                enum: ['ecommerce', 'bilheteria'],
                description: 'OBRIGATÓRIO. Estabelecimento: "ecommerce" (vendas online, ID 2360) ou "bilheteria" (vendas presenciais, ID 2361). Use ecommerce por padrão se não especificado.'
              },
              limit: {
                type: 'number',
                description: 'Número máximo de vendas a retornar (padrão: 50)'
              },
              dataVendaInit: {
                type: 'string',
                description: 'Data inicial no formato YYYY-MM-DD. Use a data atual como referência. Para "últimas 24h", use a data de hoje. Para "ontem", use a data de ontem. Calcule sempre a partir da data atual fornecida no contexto.'
              },
              dataVendaFim: {
                type: 'string',
                description: 'Data final no formato YYYY-MM-DD. Para consultas recentes, use a data atual. Calcule sempre a partir da data atual fornecida no contexto.'
              }
            },
            required: ['estabelecimento']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'obter_detalhes_venda',
          description: 'Obtém detalhes completos de uma venda específica pelo código',
          parameters: {
            type: 'object',
            properties: {
              codigoVenda: {
                type: 'number',
                description: 'Código da venda'
              }
            },
            required: ['codigoVenda']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'analisar_vendas',
          description: 'Gera análise estatística das vendas do ecommerce (totais, médias, tendências)',
          parameters: {
            type: 'object',
            properties: {
              periodo: {
                type: 'string',
                enum: ['hoje', 'semana', 'mes', 'ano'],
                description: 'Período para análise'
              }
            }
          }
        }
      }
    ];
  }

  /**
   * Executa uma função de ferramenta chamada pelo modelo
   */
  private async executeFunction(functionName: string, args: any): Promise<any> {
    try {
      switch (functionName) {
        case 'listar_vendas_limber': {
          // Valida estabelecimento obrigatório
          if (!args.estabelecimento) {
            return { error: 'Estabelecimento é obrigatório. Use "ecommerce" ou "bilheteria".' };
          }

          // Mapeia estabelecimento para ID
          const estabelecimentoIds: { [key: string]: number } = {
            'ecommerce': 2360,
            'bilheteria': 2361
          };

          const estabelecOrig = estabelecimentoIds[args.estabelecimento];
          
          if (!estabelecOrig) {
            return { error: 'Estabelecimento inválido. Use "ecommerce" ou "bilheteria".' };
          }

          // Formata datas para o padrão esperado pela API (YYYY-MM-DD)
          const params: any = {
            estabelecOrig: estabelecOrig.toString()
          };
          
          if (args.limit) {
            params.limit = args.limit.toString();
          }
          
          if (args.dataVendaInit) {
            // Remove timestamp se houver, mantém apenas YYYY-MM-DD
            params.dataVendaInit = args.dataVendaInit.split('T')[0];
          }
          
          if (args.dataVendaFim) {
            // Remove timestamp se houver, mantém apenas YYYY-MM-DD
            params.dataVendaFim = args.dataVendaFim.split('T')[0];
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/limber-card/vendas?${new URLSearchParams(params)}`);
          
          if (!response.ok) {
            const errorData = await response.text();
            console.error('[ChatService] Erro ao buscar vendas:', errorData);
            throw new Error(`Erro ao buscar vendas: ${errorData}`);
          }
          
          return await response.json();
        }

        case 'obter_detalhes_venda': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/limber-card/vendas/${args.codigoVenda}`);
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar detalhes da venda: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'analisar_vendas': {
          // Busca vendas do período
          const hoje = new Date();
          let dataInicio = new Date();
          
          switch (args.periodo) {
            case 'hoje':
              dataInicio = hoje;
              break;
            case 'semana':
              dataInicio.setDate(hoje.getDate() - 7);
              break;
            case 'mes':
              dataInicio.setMonth(hoje.getMonth() - 1);
              break;
            case 'ano':
              dataInicio.setFullYear(hoje.getFullYear() - 1);
              break;
          }

          // Por padrão, busca vendas do ecommerce (ID 2360)
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/limber-card/vendas?${new URLSearchParams({
            estabelecOrig: '2360',
            dataVendaInit: dataInicio.toISOString().split('T')[0],
            dataVendaFim: hoje.toISOString().split('T')[0],
            limit: '1000'
          })}`);

          if (!response.ok) {
            const errorData = await response.text();
            console.error('[ChatService] Erro ao analisar vendas:', errorData);
            throw new Error(`Erro ao buscar vendas: ${errorData}`);
          }

          const data = await response.json();
          const vendas = data.vendas || [];

          // Análise estatística
          const total = vendas.length;
          const totalValor = vendas.reduce((sum: number, v: any) => sum + (parseFloat(v.valor_total) || 0), 0);
          const media = total > 0 ? totalValor / total : 0;

          return {
            periodo: args.periodo,
            total_vendas: total,
            valor_total: totalValor,
            ticket_medio: media,
            vendas_por_dia: total / 7,
            amostra_vendas: vendas.slice(0, 5)
          };
        }

        default:
          return { error: 'Função não encontrada' };
      }
    } catch (error: any) {
      console.error(`[ChatService] Erro ao executar função ${functionName}:`, error);
      return { error: error.message || 'Erro ao executar função' };
    }
  }

  /**
   * Envia mensagem para o ChatGPT e obtém resposta
   * Suporta function calling para consultar dados em tempo real
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      // Prepara o histórico da conversa
      const dataAtual = new Date();
      const dataAtualFormatada = dataAtual.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
      });
      
      let messages: any[] = [
        {
          role: 'developer' as const,
          content: `Você é um assistente inteligente da Dreams, uma agência de indicações e recompensas para empresas parceiras.

DATA ATUAL: ${dataAtualFormatada} (${dataAtual.toISOString().split('T')[0]})
SEMPRE use a data atual como referência para calcular períodos (hoje, ontem, última semana, etc).

IMPORTANTE: Você tem acesso a ferramentas para consultar dados em tempo real da plataforma Limber Card (vendas de eventos).

ESTABELECIMENTOS LIMBER (OBRIGATÓRIO EM TODA CONSULTA):
- "ecommerce" (ID 2360): Vendas online realizadas no site
- "bilheteria" (ID 2361): Vendas presenciais na bilheteria física

Quando consultar vendas, SEMPRE especifique o estabelecimento:
- Use "ecommerce" por padrão para vendas online
- Use "bilheteria" apenas se o usuário mencionar vendas presenciais/bilheteria

Suas capacidades:
- Consultar vendas recentes e histórico (SEMPRE com estabelecimento)
- Analisar estatísticas de vendas do ecommerce
- Fornecer insights sobre desempenho de eventos
- Responder perguntas sobre indicações e clientes

Quando o usuário perguntar sobre vendas, use as ferramentas disponíveis para buscar informações atualizadas.

Seja proativo: se achar que uma consulta aos dados ajudaria a responder melhor, faça-a.`,
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'developer',
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: message,
        },
      ];

      const tools = this.getTools();
      let continueLoop = true;
      let iterationCount = 0;
      const maxIterations = 5; // Previne loops infinitos

      // Loop de execução de ferramentas
      while (continueLoop && iterationCount < maxIterations) {
        iterationCount++;

        // Chama a API da OpenAI
        const response = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          tools: tools as any,
          tool_choice: 'auto', // Deixa o modelo decidir
        });

        const assistantMessage = response.choices[0].message;

        // Adiciona a resposta do assistente ao histórico
        messages.push(assistantMessage);

        // Verifica se há chamadas de ferramentas
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          // Executa cada ferramenta solicitada
          for (const toolCall of assistantMessage.tool_calls) {
            const toolCallData = toolCall as any;
            const functionName = toolCallData.function.name;
            const functionArgs = JSON.parse(toolCallData.function.arguments);

            console.log(`[ChatService] Executando função: ${functionName}`, functionArgs);

            // Executa a função
            const functionResult = await this.executeFunction(functionName, functionArgs);

            // Adiciona o resultado ao histórico
            messages.push({
              role: 'tool',
              tool_call_id: toolCallData.id,
              content: JSON.stringify(functionResult),
            });
          }
        } else {
          // Sem mais chamadas de ferramentas, terminamos
          continueLoop = false;
        }
      }

      // Extrai a mensagem final
      const finalMessage = messages[messages.length - 1];
      const assistantText = finalMessage.content || 'Desculpe, não consegui processar sua mensagem.';

      return {
        message: assistantText,
      };
    } catch (error: any) {
      console.error('[ChatService] Erro ao enviar mensagem:', error);
      
      // Tratamento de erros específicos
      if (error.status === 401) {
        throw new Error('Chave de API inválida');
      }
      if (error.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns instantes.');
      }
      
      throw new Error('Erro ao processar mensagem. Tente novamente.');
    }
  }

  /**
   * Envia mensagem com streaming (para respostas em tempo real)
   * Nota: Implementação simplificada - a OpenAI mudou a estrutura de eventos
   */
  async sendMessageStream(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ReadableStream> {
    try {
      const messages = [
        {
          role: 'developer' as const,
          content: 'Você é um assistente inteligente da Dreams, uma agência de indicações e recompensas. Ajude os usuários com informações sobre o sistema, tire dúvidas e seja cordial.',
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'developer',
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: message,
        },
      ];

      // Stream da resposta
      const stream = await this.client.responses.create({
        model: 'gpt-4o-mini',
        input: messages,
        stream: true,
      });

      // Cria um ReadableStream para enviar chunks ao cliente
      return new ReadableStream({
        async start(controller) {
          try {
            let fullText = '';
            for await (const chunk of stream) {
              // A estrutura de eventos do stream mudou na nova API
              // Por ora, acumulamos o texto e enviamos no final
              const chunkData = chunk as any;
              
              // Tenta extrair texto de diferentes estruturas
              if (chunkData.output_text) {
                fullText = chunkData.output_text;
              }
            }
            
            if (fullText) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: fullText })}\n\n`));
            }
            
            controller.close();
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          }
        },
      });
    } catch (error: any) {
      console.error('[ChatService] Erro ao enviar mensagem com stream:', error);
      throw new Error('Erro ao processar mensagem com streaming.');
    }
  }
}

export const chatService = new ChatService();
