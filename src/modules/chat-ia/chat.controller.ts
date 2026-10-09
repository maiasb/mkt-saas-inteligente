// Controller para Chat IA

import { NextRequest, NextResponse } from 'next/server';
import { chatService, ChatMessage } from './chat.service';

export class ChatController {
  /**
   * POST - Envia mensagem para o chat
   */
  async sendMessage(request: NextRequest) {
    try {
      const body = await request.json();
      const { message, conversationHistory } = body;

      if (!message || typeof message !== 'string') {
        return NextResponse.json(
          { error: 'Mensagem é obrigatória' },
          { status: 400 }
        );
      }

      // Valida histórico da conversa
      const history: ChatMessage[] = Array.isArray(conversationHistory)
        ? conversationHistory
        : [];

      const response = await chatService.sendMessage(message, history);
      
      return NextResponse.json(response);
    } catch (error: any) {
      console.error('[ChatController] Erro ao processar mensagem:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao processar mensagem' },
        { status: 500 }
      );
    }
  }

  /**
   * POST - Envia mensagem com streaming
   */
  async sendMessageStream(request: NextRequest) {
    try {
      const body = await request.json();
      const { message, conversationHistory } = body;

      if (!message || typeof message !== 'string') {
        return NextResponse.json(
          { error: 'Mensagem é obrigatória' },
          { status: 400 }
        );
      }

      const history: ChatMessage[] = Array.isArray(conversationHistory)
        ? conversationHistory
        : [];

      const stream = await chatService.sendMessageStream(message, history);
      
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error: any) {
      console.error('[ChatController] Erro ao processar mensagem com stream:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao processar mensagem' },
        { status: 500 }
      );
    }
  }
}

export const chatController = new ChatController();
