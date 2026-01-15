// API Route - GET /api/limber-card/vendas/[codigo]
// Obtém detalhes completos de uma venda específica

import { NextRequest } from 'next/server';
import { limberCardController } from '@/modules/limber-card';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params;
  const codigoVenda = parseInt(codigo);
  return limberCardController.obterDetalhesVenda(codigoVenda);
}
