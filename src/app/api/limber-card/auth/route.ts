// API Route - POST /api/limber-card/auth
// Autentica na plataforma de vendas Limber Card

import { NextRequest } from 'next/server';
import { limberCardController } from '@/modules/limber-card';

export async function POST(request: NextRequest) {
  return limberCardController.autenticar(request);
}
