// API Routes para Guará Acqua Park

import { NextRequest } from 'next/server';
import { guaraController } from '@/modules/guara-acqua-park';

// GET - Lista clientes
export async function GET(request: NextRequest) {
  return guaraController.listarClientes(request);
}
