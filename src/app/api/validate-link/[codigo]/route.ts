import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { empresasService } from '@/modules/empresas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    const [links] = await db.query(`
      SELECT l.*
      FROM links l
      WHERE l.codigo = ? AND l.ativo = 1
    `, [codigo]);

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Link inválido ou inativo' },
        { status: 404 }
      );
    }

    const link: any = links[0];
    
    const empresa = await empresasService.buscarPorId(link.empresa_id);
    
    if (!empresa || !empresa.ativo) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      linkId: link.id,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
      },
    });
  } catch (error) {
    console.error('Erro ao validar link:', error);
    return NextResponse.json(
      { error: 'Erro ao validar link' },
      { status: 500 }
    );
  }
}
