import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEmpresasAtivas } from '@/config/empresas.config';

export async function GET() {
  try {
    const empresasAtivas = getEmpresasAtivas();

    // Estatísticas gerais
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

    // Estatísticas por empresa
    const estatisticasPorEmpresa = await Promise.all(
      empresasAtivas.map(async (empresa) => {
        const [empresaStats]: any = await db.query(`
          SELECT 
            (SELECT COUNT(DISTINCT cliente_id) FROM indicacoes WHERE empresa_id = ?) as totalClientes,
            (SELECT COUNT(DISTINCT l.cliente_id) FROM links l WHERE l.empresa_id = ? AND l.ativo = 1) as totalIndicadores,
            (SELECT COUNT(DISTINCT cliente_id) FROM indicacoes WHERE empresa_id = ? AND indicador_id IS NOT NULL) as totalIndicados,
            (SELECT COUNT(*) FROM links WHERE empresa_id = ? AND ativo = 1) as totalLinks,
            (SELECT COALESCE(SUM(pontos), 0) FROM pontuacoes WHERE empresa_id = ?) as totalPontos
        `, [empresa.id, empresa.id, empresa.id, empresa.id, empresa.id]);

        return {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
          cor: empresa.cor,
          stats: empresaStats[0] || {
            totalClientes: 0,
            totalIndicadores: 0,
            totalIndicados: 0,
            totalLinks: 0,
            totalPontos: 0
          }
        };
      })
    );

    // Top indicadores global
    const [topIndicadores] = await db.query(`
      SELECT 
        i.cliente_id,
        i.nome,
        i.email,
        i.empresa_id,
        COUNT(*) as total_indicacoes
      FROM indicacoes i
      INNER JOIN indicacoes ind ON ind.indicador_id = i.cliente_id
      GROUP BY i.cliente_id, i.nome, i.email, i.empresa_id
      ORDER BY total_indicacoes DESC
      LIMIT 10
    `);

    // Indicações recentes
    const [indicacoesRecentes] = await db.query(`
      SELECT 
        i.cliente_id,
        i.nome,
        i.email,
        i.empresa_id,
        i.created_at,
        ind.nome as indicador_nome
      FROM indicacoes i
      LEFT JOIN indicacoes ind ON i.indicador_id = ind.cliente_id
      WHERE i.indicador_id IS NOT NULL
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      totalEmpresas: empresasAtivas.length,
      totalClientes: dbStats.totalClientes || 0,
      totalLinks: dbStats.totalLinks || 0,
      totalUsuariosIndicados: dbStats.totalUsuariosIndicados || 0,
      totalPontos: dbStats.totalPontos || 0,
      empresas: estatisticasPorEmpresa,
      topIndicadores: topIndicadores || [],
      indicacoesRecentes: indicacoesRecentes || []
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar estatísticas',
        totalEmpresas: 0,
        totalClientes: 0,
        totalLinks: 0,
        totalUsuariosIndicados: 0,
        totalPontos: 0,
        empresas: [],
        topIndicadores: [],
        indicacoesRecentes: []
      },
      { status: 200 }
    );
  }
}
