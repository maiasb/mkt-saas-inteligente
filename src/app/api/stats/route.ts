import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEmpresasAtivas } from '@/config/empresas.config';

export async function GET() {
  try {
    // Busca estatísticas do banco de dados
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM links WHERE ativo = 1) as totalLinks,
        (SELECT COUNT(DISTINCT cliente_id) FROM pontuacoes) as totalClientes,
        (SELECT COUNT(DISTINCT cliente_id) FROM indicacoes WHERE indicador_id IS NOT NULL) as totalUsuariosIndicados,
        (SELECT COALESCE(SUM(pontos), 0) FROM pontuacoes) as totalPontos
    `);

    const dbStats: any = Array.isArray(result) && result.length > 0 ? result[0] : {
      totalLinks: 0,
      totalClientes: 0,
      totalUsuariosIndicados: 0,
      totalPontos: 0
    };

    // Conta empresas do arquivo de configuração
    const empresasAtivas = getEmpresasAtivas();

    return NextResponse.json({
      totalEmpresas: empresasAtivas.length,
      totalClientes: dbStats.totalClientes || 0,
      totalLinks: dbStats.totalLinks || 0,
      totalUsuariosIndicados: dbStats.totalUsuariosIndicados || 0,
      totalPontos: dbStats.totalPontos || 0,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
