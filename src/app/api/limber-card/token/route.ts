// API Route - GET /api/limber-card/token
// Retorna token válido da plataforma de vendas

import { NextRequest } from 'next/server';
import { limberCardController } from '@/modules/limber-card';

export async function GET(request: NextRequest) {
  return limberCardController.obterToken(request);
}
