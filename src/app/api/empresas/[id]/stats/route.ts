import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Busca estatísticas da empresa
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(DISTINCT cliente_id) FROM pontuacoes WHERE empresa_id = ?) as totalClientes,
        (SELECT COALESCE(SUM(pontos), 0) FROM pontuacoes WHERE empresa_id = ?) as totalPontos,
        (SELECT COUNT(*) FROM links WHERE empresa_id = ? AND ativo = 1) as totalLinks
    `, [id, id, id]);

    const stats: any = Array.isArray(result) && result.length > 0 ? result[0] : {
      totalClientes: 0,
      totalPontos: 0,
      totalLinks: 0
    };

    return NextResponse.json({
      totalClientes: stats.totalClientes || 0,
      totalPontos: stats.totalPontos || 0,
      totalLinks: stats.totalLinks || 0,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas da empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
