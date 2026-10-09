import { NextRequest } from 'next/server';
import { programaController } from '@/modules/programa-indicacao';

// GET - Lista clientes da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return programaController.listarClientes(request, slug);
}

// POST - Cadastra cliente na empresa
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return programaController.criarCliente(request, slug);
}
