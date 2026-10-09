import { NextRequest } from 'next/server';
import { empresasController } from '@/modules/empresas';

// GET - Busca empresa por slug (ou id)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return empresasController.buscar(slug);
}

// PUT - Atualiza dados e regras da empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return empresasController.atualizar(request, slug);
}
