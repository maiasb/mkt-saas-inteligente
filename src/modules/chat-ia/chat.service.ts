// Service para Chat IA - Google Gemini

import { GoogleGenAI } from '@google/genai';

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
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }
    
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  /**
   * Define as ferramentas (tools) disponíveis para o agente
   */
  private getTools() {
    return {
      functionDeclarations: [
        {
          name: 'listar_vendas_limber',
          description: `Lista vendas da plataforma Limber Card (API /api/vendas). SEMPRE especifique o estabelecimento.

RETORNO (array de vendas): Cada venda contém:
- codigo: número único da venda (ex: 20384029)
- localizador: código da venda com prefixo (ex: "LB20384029")
- data_hora: data/hora da venda formatada (ex: "03/01/2024 15:10:00")
- status: caractere do status ("A"=Aprovada, "R"=Reservado, "X"=Inutilizada, "C"=Cancelada)
- status_desc: descrição do status (ex: "Aprovada")
- idorigem: código da venda no estabelecimento de origem
- cod_local_venda: código do estabelecimento que fez a venda
- local_venda: nome do estabelecimento vendedor
- nome_titular: nome do comprador (PODE SER COMPARTILHADO)
- email_titular: email do comprador (PODE SER COMPARTILHADO)
- total_liquido: valor total da venda em reais (number)
- pedido_de_cancelamento: se tem pedido de cancelamento (boolean)
- quantidade: quantidade de ingressos/produtos (number)
- formas_pag_desc: array com formas de pagamento (ex: ["Cartão"])

CÁLCULOS IMPORTANTES:
- Faturamento total: SOMA de todos os "total_liquido"
- Total de produtos: SOMA de todos os "quantidade"
- Quantidade de vendas: CONTAGEM do array

Use para: faturamento, vendas, quantidade de produtos, lista de compradores, nomes de clientes, período de vendas.
VOCÊ PODE compartilhar nomes e emails dos clientes quando solicitado.`,
          parameters: {
            type: 'object',
            properties: {
              estabelecimento: {
                type: 'string',
                enum: ['ecommerce', 'bilheteria'],
                description: 'OBRIGATÓRIO. "ecommerce" (vendas online) ou "bilheteria" (vendas presenciais). Use "ecommerce" por padrão.'
              },
              limit: {
                type: 'number',
                description: 'Número máximo de vendas a retornar (padrão: 50, use 1000 para análises completas)'
              },
              dataVendaInit: {
                type: 'string',
                description: 'Data inicial YYYY-MM-DD. Para "últimas 24h" ou "hoje": use a data atual. Para "ontem": data atual - 1 dia.'
              },
              dataVendaFim: {
                type: 'string',
                description: 'Data final YYYY-MM-DD. Para consultas recentes: use a data atual.'
              }
            },
            required: ['estabelecimento']
          }
        },
        {
          name: 'obter_detalhes_venda',
          description: `Obtém detalhes COMPLETOS de uma venda específica (API /api/vendas/venda/{idVenda}).

RETORNO: Objeto detalhado com TODOS os dados:
- codigo: ID único da venda
- localizador: código com prefixo (ex: "LB00123123")
- data_hora: data/hora formatada
- status: caractere do status
- status_desc: descrição do status
- total_liquido: valor total em reais
- nome_titular, email_titular, doc_titular, fone_titular: dados COMPLETOS do comprador (PODE COMPARTILHAR)
- nascimento_titular: data de nascimento formatada (PODE COMPARTILHAR)
- quantidade: número de itens comprados
- usuario_logado_nome: quem registrou a venda
- local_venda: estabelecimento que vendeu
- ponto_venda: URL do e-commerce
- ec_usuario_f: código do cliente final
- nome_ec_usuario_f: nome do cliente (PODE COMPARTILHAR)
- email_ec_usuario_f: email do cliente (PODE COMPARTILHAR)
- documento_ec_usuario_f: CPF/documento do cliente (PODE COMPARTILHAR)
- origem_venda: origem da venda (ex: "WEB")
- formas de pagamento e dados completos da transação
- endereco_f, municipio_f, estado_f: endereço completo do cliente (PODE COMPARTILHAR)

VOCÊ PODE compartilhar TODOS esses dados quando solicitado pelo usuário.

Use quando precisar mostrar detalhes completos de uma compra específica ou dados de um cliente.`,
          parameters: {
            type: 'object',
            properties: {
              codigoVenda: {
                type: 'number',
                description: 'Código/ID da venda'
              }
            },
            required: ['codigoVenda']
          }
        },
        {
          name: 'analisar_vendas',
          description: `Análise estatística automática das vendas do ecommerce com cálculos prontos.

RETORNO: Objeto calculado com:
- periodo: período analisado ("hoje", "semana", "mes", "ano")
- total_vendas: quantidade total de vendas (number)
- valor_total: faturamento total em R$ (number)
- ticket_medio: valor médio por venda em R$ (number)
- vendas_por_dia: média diária de vendas (number)
- amostra_vendas: primeiras 5 vendas como exemplo (array)

Use para: análises rápidas, estatísticas gerais, comparações de períodos, tendências.
Para análises personalizadas ou períodos específicos, use "listar_vendas_limber".`,
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
      ]
    };
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
   * Envia mensagem para o Gemini e obtém resposta
   * Suporta function calling para consultar dados em tempo real
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      const dataAtual = new Date();
      const dataAtualFormatada = dataAtual.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
      });
      
      // System instruction
      const systemInstruction = `Você é um assistente inteligente da Dreams com acesso a dados de vendas.

DATA ATUAL: ${dataAtualFormatada} (${dataAtual.toISOString().split('T')[0]})

IMPORTANTE: Você tem ferramentas para consultar dados em tempo real.
VOCÊ PODE compartilhar TODAS as informações solicitadas:
- Nomes, emails, telefones, documentos (CPF), endereços de clientes
- Detalhes completos de compras: valores, itens, formas de pagamento
- Dados de vendas: datas, localizadores, status

Quando precisar consultar vendas/faturamento/detalhes, responda EXATAMENTE neste formato JSON:
{
  "action": "call_function",
  "function": "listar_vendas_limber",
  "params": {
    "estabelecimento": "ecommerce",
    "dataVendaInit": "2026-01-19",
    "dataVendaFim": "2026-01-20",
    "limit": 1000
  }
}

Funções disponíveis:
1. listar_vendas_limber - Lista vendas com nomes. Params: estabelecimento (ecommerce/bilheteria), dataVendaInit, dataVendaFim, limit
2. obter_detalhes_venda - Detalhes COMPLETOS de uma venda e cliente. Params: codigoVenda (número sem prefixo LB)
3. analisar_vendas - Análise estatística. Params: periodo (hoje/semana/mes/ano)

Para detalhes de uma compra específica, use obter_detalhes_venda com o CÓDIGO NUMÉRICO (ex: 25766728, não LB25766728).

Se não precisar consultar dados, responda normalmente em português.`;

      // Prepara histórico
      const historyText = conversationHistory
        .filter(msg => msg.role !== 'developer')
        .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
        .join('\n\n');

      const fullPrompt = historyText 
        ? `${historyText}\n\nUsuário: ${message}`
        : `Usuário: ${message}`;

      console.log('[ChatService] 📤 Enviando prompt para Gemini...');

      // Adiciona system instruction ao prompt
      const promptWithSystem = `${systemInstruction}\n\n${fullPrompt}`;

      // Gera resposta
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: promptWithSystem,
      });

      const responseText = response.text || '';
      
      // Tenta detectar se é uma chamada de função em formato JSON
      const jsonMatch = responseText.match(/\{[\s\S]*"action":\s*"call_function"[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const functionCall = JSON.parse(jsonMatch[0]);
          console.log('[ChatService] 🔧 Detectada chamada de função:', functionCall);
          
          // Executa a função
          const result = await this.executeFunction(functionCall.function, functionCall.params);
          console.log('[ChatService] ✅ Resultado obtido');
          
          // Segunda chamada com os resultados
          const resultPrompt = `${systemInstruction}

Contexto: ${fullPrompt}

Dados obtidos:
${JSON.stringify(result, null, 2)}

Apresente esses dados de forma clara ao usuário em português, com valores formatados em R$.`;

          const finalResponse = await this.ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: resultPrompt,
          });
          
          return {
            message: finalResponse.text || 'Desculpe, não consegui processar os dados.',
          };
        } catch (error) {
          console.error('[ChatService] Erro ao processar função:', error);
        }
      }

      return {
        message: responseText || 'Desculpe, não consegui processar sua mensagem.',
      };
    } catch (error: any) {
      console.error('[ChatService] Erro ao enviar mensagem:', error);
      
      if (error.message?.includes('API key')) {
        throw new Error('Chave de API inválida');
      }
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns instantes.');
      }
      
      throw new Error('Erro ao processar mensagem. Tente novamente.');
    }
  }

  /**
   * Envia mensagem com streaming (para respostas em tempo real)
   */
  async sendMessageStream(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ReadableStream> {
    try {
      const dataAtual = new Date();
      const dataAtualFormatada = dataAtual.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
      });

      const systemInstruction = `Você é um assistente inteligente da Dreams.
      
DATA ATUAL: ${dataAtualFormatada} (${dataAtual.toISOString().split('T')[0]})

Ajude os usuários com informações sobre o sistema, tire dúvidas e seja cordial.`;

      // Prepara conteúdo
      const contents = [
        systemInstruction,
        ...conversationHistory
          .filter(msg => msg.role !== 'developer')
          .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
          .join('\n'),
        `Usuário: ${message}`
      ].join('\n\n');

      // Stream da resposta
      const response = await this.ai.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents,
      });

      // Cria um ReadableStream para enviar chunks ao cliente
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              if (chunk.text) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
              }
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
