import { NextRequest } from 'next/server';
import { programaController } from '@/modules/programa-indicacao';

// GET - Lista indicações (indicadores e indicados)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return programaController.listarIndicacoes(request, slug);
}
