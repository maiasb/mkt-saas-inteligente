import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const empresaId = 'guara-acqua-park-001';

    // Total de clientes no programa (todos na tabela indicacoes)
    const [totalClientesResult]: any = await db.query(
      `SELECT COUNT(DISTINCT cliente_id) as total FROM indicacoes WHERE empresa_id = ?`,
      [empresaId]
    );

    // Total de indicadores (clientes com links)
    const [totalIndicadoresResult]: any = await db.query(
      `SELECT COUNT(DISTINCT l.cliente_id) as total 
       FROM links l
       WHERE l.empresa_id = ? AND l.ativo = 1`,
      [empresaId]
    );

    // Total de indicados (clientes com indicador_id)
    const [totalIndicadosResult]: any = await db.query(
      `SELECT COUNT(DISTINCT cliente_id) as total 
       FROM indicacoes 
       WHERE empresa_id = ? AND indicador_id IS NOT NULL`,
      [empresaId]
    );

    // Total de links ativos
    const [totalLinksResult]: any = await db.query(
      `SELECT COUNT(*) as total FROM links WHERE empresa_id = ? AND ativo = 1`,
      [empresaId]
    );

    // Total de pontos distribuídos
    const [totalPontosResult]: any = await db.query(
      `SELECT COALESCE(SUM(pontos), 0) as total FROM pontuacoes WHERE empresa_id = ?`,
      [empresaId]
    );

    // Indicações recentes (últimas 5)
    const [indicacoesRecentes] = await db.query(
      `SELECT 
        i.cliente_id,
        i.nome,
        i.email,
        i.created_at,
        ind.nome as indicador_nome
       FROM indicacoes i
       LEFT JOIN indicacoes ind ON i.indicador_id = ind.cliente_id
       WHERE i.empresa_id = ? AND i.indicador_id IS NOT NULL
       ORDER BY i.created_at DESC
       LIMIT 5`,
      [empresaId]
    );

    // Top indicadores (clientes que mais indicaram)
    const [topIndicadores] = await db.query(
      `SELECT 
        i.cliente_id,
        i.nome,
        i.email,
        COUNT(*) as total_indicacoes
       FROM indicacoes i
       INNER JOIN indicacoes ind ON ind.indicador_id = i.cliente_id
       WHERE i.empresa_id = ?
       GROUP BY i.cliente_id, i.nome, i.email
       ORDER BY total_indicacoes DESC
       LIMIT 5`,
      [empresaId]
    );

    return NextResponse.json({
      resumo: {
        totalClientes: totalClientesResult[0]?.total || 0,
        totalIndicadores: totalIndicadoresResult[0]?.total || 0,
        totalIndicados: totalIndicadosResult[0]?.total || 0,
        totalLinks: totalLinksResult[0]?.total || 0,
        totalPontos: totalPontosResult[0]?.total || 0,
      },
      indicacoesRecentes: indicacoesRecentes || [],
      topIndicadores: topIndicadores || [],
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}
