// API Routes para indicações do Guará Acqua Park

import { NextRequest } from 'next/server';
import { guaraController } from '@/modules/guara-acqua-park';

// GET - Lista indicações (indicadores e indicados)
export async function GET(request: NextRequest) {
  return guaraController.listarIndicacoes(request);
}

// POST - Cria indicação
export async function POST(request: NextRequest) {
  return guaraController.criarIndicacao(request);
}
