// API Routes para Chat IA

import { NextRequest } from 'next/server';
import { chatController } from '@/modules/chat-ia';

// POST - Envia mensagem para o chat
export async function POST(request: NextRequest) {
  return chatController.sendMessage(request);
}
