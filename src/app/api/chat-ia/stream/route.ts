// API Routes para Chat IA com Streaming

import { NextRequest } from 'next/server';
import { chatController } from '@/modules/chat-ia';

// POST - Envia mensagem para o chat com streaming
export async function POST(request: NextRequest) {
  return chatController.sendMessageStream(request);
}
