import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { empresasService } from '@/modules/empresas';

// GET - Estatísticas da empresa (aceita slug ou id)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const empresa = await empresasService.buscarPorSlugOuId(slug);
    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const [result]: any = await db.query(`
      SELECT 
        (SELECT COUNT(DISTINCT cliente_id) FROM pontuacoes WHERE empresa_id = ?) as totalClientes,
        (SELECT COALESCE(SUM(pontos), 0) FROM pontuacoes WHERE empresa_id = ?) as totalPontos,
        (SELECT COUNT(*) FROM links WHERE empresa_id = ? AND ativo = 1) as totalLinks
    `, [empresa.id, empresa.id, empresa.id]);

    const stats = result[0] || {};

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
