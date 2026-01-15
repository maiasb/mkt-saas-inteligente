// API Route - GET /api/limber-card/vendas/[codigo]
// Obtém detalhes completos de uma venda específica

import { NextRequest } from 'next/server';
import { limberCardController } from '@/modules/limber-card';

export async function GET(
  request: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const codigoVenda = parseInt(params.codigo);
  return limberCardController.obterDetalhesVenda(codigoVenda);
}
