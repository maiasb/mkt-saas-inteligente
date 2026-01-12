// API Routes para cliente específico do Guará Acqua Park

import { NextRequest } from 'next/server';
import { guaraController } from '@/modules/guara-acqua-park';

// GET - Busca cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return guaraController.buscarCliente(request, id);
}
