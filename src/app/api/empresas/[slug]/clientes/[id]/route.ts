import { NextRequest } from 'next/server';
import { programaController } from '@/modules/programa-indicacao';

// GET - Busca cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  return programaController.buscarCliente(slug, id);
}
