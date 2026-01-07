import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    const [links] = await db.query(`
      SELECT l.*, e.id as empresa_id, e.nome as empresa_nome
      FROM links l
      INNER JOIN empresas e ON e.id = l.empresa_id
      WHERE l.codigo = ? AND l.ativo = 1
    `, [codigo]);

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Link inválido ou inativo' },
        { status: 404 }
      );
    }

    const link: any = links[0];

    return NextResponse.json({
      linkId: link.id,
      empresa: {
        id: link.empresa_id,
        nome: link.empresa_nome,
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
