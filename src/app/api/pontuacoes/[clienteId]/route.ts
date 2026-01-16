import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  try {
    const { clienteId } = await params;

    // Busca pontuação total do cliente
    const [pontuacaoResult] = await db.query(`
      SELECT 
        SUM(pontos) as total_pontos
      FROM pontuacoes
      WHERE cliente_id = ?
    `, [clienteId]);

    const pontuacaoRow: any = Array.isArray(pontuacaoResult) && pontuacaoResult.length > 0
      ? pontuacaoResult[0]
      : { total_pontos: 0 };

    // Busca histórico de pontuações com tipo
    const [historico] = await db.query(`
      SELECT 
        p.id,
        p.empresa_id,
        p.pontos,
        p.link_id,
        p.created_at,
        CASE
          WHEN p.pontos = 10 THEN 'INDICADOR'
          WHEN p.pontos = 5 THEN 'INDICADO'
          ELSE 'INDICADOR'
        END as tipo
      FROM pontuacoes p
      WHERE p.cliente_id = ?
      ORDER BY p.created_at DESC
    `, [clienteId]);

    // Busca clientes indicados por este cliente
    const [indicados] = await db.query(`
      SELECT 
        cliente_id,
        nome,
        email,
        link_id,
        created_at
      FROM indicacoes
      WHERE indicador_id = ?
      ORDER BY created_at DESC
    `, [clienteId]);

    return NextResponse.json({
      total_pontos: pontuacaoRow.total_pontos || 0,
      historico: historico || [],
      indicados: indicados || [],
    });
  } catch (error) {
    console.error('Erro ao buscar pontuações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pontuações' },
      { status: 500 }
    );
  }
}
