// API Routes para estatísticas do Guará Acqua Park

import { NextRequest } from 'next/server';
import { guaraController } from '@/modules/guara-acqua-park';

// GET - Estatísticas gerais
export async function GET(request: NextRequest) {
  return guaraController.buscarEstatisticas(request);
}
