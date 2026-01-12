import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  try {
    const { clienteId } = await params;

    // Busca quem indicou este cliente
    const [indicador] = await db.query(`
      SELECT 
        indicador_id,
        link_id,
        created_at
      FROM indicacoes
      WHERE indicado_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [clienteId]);

    const indicadorData = Array.isArray(indicador) && indicador.length > 0 
      ? indicador[0] 
      : null;

    return NextResponse.json({
      indicador: indicadorData,
    });
  } catch (error) {
    console.error('Erro ao buscar indicador:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar indicador' },
      { status: 500 }
    );
  }
}
