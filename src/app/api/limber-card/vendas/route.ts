// API Route - GET /api/limber-card/vendas
// Lista vendas da plataforma Limber Card

import { NextRequest } from 'next/server';
import { limberCardController } from '@/modules/limber-card';

export async function GET(request: NextRequest) {
  return limberCardController.listarVendas(request);
}
