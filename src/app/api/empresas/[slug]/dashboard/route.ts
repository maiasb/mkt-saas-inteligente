import { NextRequest } from 'next/server';
import { programaController } from '@/modules/programa-indicacao';

// GET - Dados do dashboard da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return programaController.buscarDashboard(slug);
}
