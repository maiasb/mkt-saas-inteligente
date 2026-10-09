// API de empresas agenciadas

import { NextRequest } from 'next/server';
import { empresasController } from '@/modules/empresas';

// GET - Lista empresas com estatísticas
export async function GET(request: NextRequest) {
  return empresasController.listar(request);
}

// POST - Cadastra empresa
export async function POST(request: NextRequest) {
  return empresasController.criar(request);
}
