// API Routes para indicações do Guará Acqua Park

import { NextRequest } from 'next/server';
import { guaraController } from '@/modules/guara-acqua-park';

// POST - Cria indicação
export async function POST(request: NextRequest) {
  return guaraController.criarIndicacao(request);
}
