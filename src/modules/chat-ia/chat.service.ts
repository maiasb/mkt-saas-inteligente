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

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export class ChatService {
  private client?: GoogleGenAI;

  // Cliente criado sob demanda: o build não tem GEMINI_API_KEY e importa este módulo
  private get ai(): GoogleGenAI {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    this.client ??= new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    return this.client;
  }

  /**
   * Define as ferramentas (tools) disponíveis para o agente
   */
  private getTools() {
    return {
      functionDeclarations: [
        // ===== SISTEMA DE RECOMENDAÇÕES/INDICAÇÕES =====
        {
          name: 'obter_estatisticas_gerais',
          description: `Obtém estatísticas gerais do sistema de indicações (API /api/stats).

RETORNO: Objeto com estatísticas completas:
- totalEmpresas: número de empresas ativas (number)
- totalClientes: total de clientes cadastrados (number)
- totalLinks: total de links de indicação ativos (number)
- totalUsuariosIndicados: total de usuários que foram indicados (number)
- totalPontos: soma total de pontos distribuídos (number)
- empresas: array com estatísticas por empresa:
  - id: ID da empresa
  - nome: nome da empresa
  - slug: identificador único da empresa
  - cor: cor tema da empresa
  - stats: objeto com estatísticas:
    - totalClientes: clientes da empresa
    - totalIndicadores: clientes que são indicadores
    - totalIndicados: clientes que foram indicados
    - totalLinks: links ativos da empresa
    - totalPontos: pontos distribuídos pela empresa
- topIndicadores: array com top 10 maiores indicadores:
  - cliente_id: ID do cliente
  - nome: nome do indicador (PODE COMPARTILHAR)
  - email: email do indicador (PODE COMPARTILHAR)
  - empresa_id: ID da empresa
  - total_indicacoes: número de indicações feitas
- indicacoesRecentes: array com 10 indicações mais recentes:
  - cliente_id: ID do cliente indicado
  - nome: nome do indicado (PODE COMPARTILHAR)
  - email: email do indicado (PODE COMPARTILHAR)
  - empresa_id: ID da empresa
  - created_at: data da indicação
  - indicador_nome: nome de quem indicou (PODE COMPARTILHAR)

Use para: visão geral do sistema, ranking de indicadores, indicações recentes, totalizadores.`,
          parameters: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'obter_estatisticas_empresa',
          description: `Obtém estatísticas de uma empresa específica (API /api/empresas/{id}/stats).

RETORNO: Objeto com estatísticas da empresa:
- totalClientes: total de clientes da empresa (number)
- totalPontos: total de pontos distribuídos pela empresa (number)
- totalLinks: total de links de indicação ativos da empresa (number)

Use quando precisar de dados específicos de uma empresa (use o id ou o slug da empresa).`,
          parameters: {
            type: 'object',
            properties: {
              empresaId: {
                type: 'string',
                description: 'ID ou slug da empresa (ex: "empresa-exemplo")'
              }
            },
            required: ['empresaId']
          }
        },
        {
          name: 'listar_links_indicacao',
          description: `Lista todos os links de indicação cadastrados (API /api/links GET).

RETORNO: Array de links com:
- id: ID único do link
- codigo: código único do link (usado na URL)
- url: URL completa do link de indicação
- empresa_id: ID da empresa
- empresa_nome: nome da empresa (PODE COMPARTILHAR)
- cliente_id: ID do cliente indicador
- cliente_nome: nome do cliente indicador (PODE COMPARTILHAR)
- cliente_email: email do cliente indicador (PODE COMPARTILHAR)
- ativo: se o link está ativo (boolean)
- usuarios_indicados_count: quantidade de pessoas que usaram este link (number)
- created_at: data de criação
- updated_at: data de atualização

Use para: listar todos os links, ver quem tem links ativos, quantas pessoas cada link trouxe.`,
          parameters: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'criar_link_indicacao',
          description: `Cria um novo link de indicação para um cliente (API /api/links POST).

RETORNO: Objeto do link criado com:
- id: ID único do link gerado
- codigo: código único do link
- url: URL completa do link de indicação
- empresa_id: ID da empresa
- cliente_id: ID do cliente indicador
- ativo: status ativo (true)
- created_at: data de criação

Use quando o usuário pedir para criar/gerar um link de indicação para um cliente.`,
          parameters: {
            type: 'object',
            properties: {
              clienteId: {
                type: 'string',
                description: 'ID do cliente que será o indicador'
              },
              empresaId: {
                type: 'string',
                description: 'ID da empresa'
              }
            },
            required: ['clienteId', 'empresaId']
          }
        },
        {
          name: 'deletar_link_indicacao',
          description: `Remove/deleta um link de indicação (API /api/links DELETE).

RETORNO: { success: true } em caso de sucesso.

Use quando precisar remover/deletar/desativar um link de indicação.`,
          parameters: {
            type: 'object',
            properties: {
              linkId: {
                type: 'string',
                description: 'ID do link a ser deletado'
              }
            },
            required: ['linkId']
          }
        },
        {
          name: 'validar_link_indicacao',
          description: `Valida se um código de link de indicação é válido e ativo (API /api/validate-link/{codigo}).

RETORNO: Objeto com informações do link:
- linkId: ID do link
- empresa: objeto com dados da empresa:
  - id: ID da empresa
  - nome: nome da empresa

ERRO: Status 404 se link inválido ou inativo.

Use para: verificar se um código de indicação é válido antes de usar.`,
          parameters: {
            type: 'object',
            properties: {
              codigo: {
                type: 'string',
                description: 'Código do link de indicação (da URL)'
              }
            },
            required: ['codigo']
          }
        },
        {
          name: 'obter_pontuacoes_cliente',
          description: `Obtém pontuações e indicados de um cliente específico (API /api/pontuacoes/{clienteId}).

RETORNO: Objeto completo com:
- total_pontos: pontuação total do cliente (number)
- historico: array com histórico de pontuações:
  - id: ID da pontuação
  - empresa_id: ID da empresa
  - pontos: quantidade de pontos (10 para indicador, 5 para indicado)
  - link_id: ID do link relacionado
  - created_at: data da pontuação
  - tipo: "INDICADOR" (10 pts por indicar) ou "INDICADO" (5 pts por ser indicado)
- indicados: array com clientes indicados por este cliente:
  - cliente_id: ID do cliente indicado
  - nome: nome do indicado (PODE COMPARTILHAR)
  - email: email do indicado (PODE COMPARTILHAR)
  - link_id: ID do link usado
  - created_at: data da indicação

Use para: ver pontos de um cliente, histórico de pontuações, quem ele indicou.`,
          parameters: {
            type: 'object',
            properties: {
              clienteId: {
                type: 'string',
                description: 'ID do cliente'
              }
            },
            required: ['clienteId']
          }
        },
        {
          name: 'obter_indicador_cliente',
          description: `Verifica quem indicou um cliente específico (API /api/indicacoes/{clienteId}/indicador).

RETORNO: Objeto com:
- indicador: null se ninguém indicou, ou objeto com:
  - indicador_id: ID do cliente que fez a indicação
  - link_id: ID do link usado
  - created_at: data da indicação

Use para: descobrir se alguém indicou um cliente, quem foi o indicador.`,
          parameters: {
            type: 'object',
            properties: {
              clienteId: {
                type: 'string',
                description: 'ID do cliente'
              }
            },
            required: ['clienteId']
          }
        },
        {
          name: 'listar_usuarios_indicados',
          description: `Lista usuários que foram indicados através de links específicos (API /api/usuarios-indicados GET).

RETORNO: Array de usuários indicados, cada um com:
- id: ID do registro
- link_id: ID do link que foi usado
- nome: nome do usuário (PODE COMPARTILHAR)
- email: email do usuário (PODE COMPARTILHAR)
- telefone: telefone do usuário (PODE COMPARTILHAR)
- created_at: data que usou o link
- outros dados do formulário de indicação

Use para: listar pessoas que clicaram em links de indicação específicos.`,
          parameters: {
            type: 'object',
            properties: {
              linkIds: {
                type: 'string',
                description: 'IDs dos links separados por vírgula (ex: "abc123,def456")'
              }
            },
            required: ['linkIds']
          }
        },
        {
          name: 'obter_usuario_indicado',
          description: `Obtém detalhes de um usuário indicado específico (API /api/usuarios-indicados/{id}).

RETORNO: Objeto com dados completos do usuário indicado:
- id: ID do registro
- link_id: ID do link usado
- nome: nome do usuário (PODE COMPARTILHAR)
- email: email do usuário (PODE COMPARTILHAR)
- telefone: telefone do usuário (PODE COMPARTILHAR)
- created_at: data da indicação
- outros campos do formulário

Use quando precisar de detalhes completos de um usuário indicado específico.`,
          parameters: {
            type: 'object',
            properties: {
              usuarioId: {
                type: 'string',
                description: 'ID do usuário indicado'
              }
            },
            required: ['usuarioId']
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
        // ===== SISTEMA DE RECOMENDAÇÕES/INDICAÇÕES =====
        case 'obter_estatisticas_gerais': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats`);
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar estatísticas gerais: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'obter_estatisticas_empresa': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/empresas/${args.empresaId}/stats`);
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar estatísticas da empresa: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'listar_links_indicacao': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/links`);
          
          if (!response.ok) {
            throw new Error(`Erro ao listar links: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'criar_link_indicacao': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao criar link: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'deletar_link_indicacao': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/links?id=${args.linkId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao deletar link: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'validar_link_indicacao': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/validate-link/${args.codigo}`);
          
          if (!response.ok) {
            throw new Error(`Link inválido ou inativo`);
          }
          
          return await response.json();
        }

        case 'obter_pontuacoes_cliente': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pontuacoes/${args.clienteId}`);
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar pontuações: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'obter_indicador_cliente': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/indicacoes/${args.clienteId}/indicador`);
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar indicador: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'listar_usuarios_indicados': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/usuarios-indicados?linkIds=${args.linkIds}`);
          
          if (!response.ok) {
            throw new Error(`Erro ao listar usuários indicados: ${response.statusText}`);
          }
          
          return await response.json();
        }

        case 'obter_usuario_indicado': {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/usuarios-indicados/${args.usuarioId}`);
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar usuário indicado: ${response.statusText}`);
          }
          
          return await response.json();
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
      const systemInstruction = `Você é um assistente inteligente da Agência de Marketing com acesso aos dados do sistema de indicações das empresas agenciadas.

DATA ATUAL: ${dataAtualFormatada} (${dataAtual.toISOString().split('T')[0]})

IMPORTANTE: Você tem ferramentas para consultar dados em tempo real.
VOCÊ PODE compartilhar TODAS as informações solicitadas:
- Nomes, emails, telefones, documentos (CPF), endereços de clientes
- Informações do sistema de indicações: links, pontos, indicadores, indicados

Quando precisar consultar dados, responda EXATAMENTE neste formato JSON:
{
  "action": "call_function",
  "function": "nome_da_funcao",
  "params": { "parametro": "valor" }
}

FUNÇÕES DISPONÍVEIS:

===== SISTEMA DE INDICAÇÕES =====
1. obter_estatisticas_gerais - Estatísticas gerais do sistema (totais, ranking, recentes)
   Params: nenhum
   
2. obter_estatisticas_empresa - Estatísticas de uma empresa específica
   Params: empresaId (string, id ou slug da empresa)
   
3. listar_links_indicacao - Lista todos os links de indicação
   Params: nenhum
   
4. criar_link_indicacao - Cria novo link de indicação
   Params: clienteId (string), empresaId (string)
   
5. deletar_link_indicacao - Remove um link de indicação
   Params: linkId (string)
   
6. validar_link_indicacao - Valida se um código de link é válido
   Params: codigo (string)
   
7. obter_pontuacoes_cliente - Pontuações e indicados de um cliente
    Params: clienteId (string)
    
8. obter_indicador_cliente - Verifica quem indicou um cliente
    Params: clienteId (string)
    
9. listar_usuarios_indicados - Lista usuários que usaram links específicos
    Params: linkIds (string com IDs separados por vírgula)
    
10. obter_usuario_indicado - Detalhes de um usuário indicado específico
    Params: usuarioId (string)

EXEMPLOS DE USO:

Para "quantos links de indicação temos?":
{"action": "call_function", "function": "listar_links_indicacao", "params": {}}

Para "quantos pontos o cliente X tem?":
{"action": "call_function", "function": "obter_pontuacoes_cliente", "params": {"clienteId": "X"}}

Para "estatísticas do sistema de indicações":
{"action": "call_function", "function": "obter_estatisticas_gerais", "params": {}}

IMPORTANTE SOBRE DUPLICATAS:
- Um mesmo cliente pode ter MÚLTIPLOS links de indicação
- Ao listar NOMES de clientes, DEDUPLICAR por cliente_nome/cliente_email
- Exemplo: Se MARCELO aparece 2x (2 links), mostrar apenas 1x na lista de nomes
- Ao listar LINKS (com suas URLs/códigos), mostrar todos normalmente
- Sempre mencione quantos links cada cliente tem se relevante

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
        model: GEMINI_MODEL,
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
            model: GEMINI_MODEL,
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

      const systemInstruction = `Você é um assistente inteligente da Agência de Marketing.
      
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
        model: GEMINI_MODEL,
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
