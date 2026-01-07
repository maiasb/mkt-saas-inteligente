import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM empresas) as totalEmpresas,
        (SELECT COUNT(*) FROM clientes) as totalClientes,
        (SELECT COUNT(*) FROM links WHERE ativo = 1) as totalLinks,
        (SELECT COUNT(*) FROM usuarios_indicados) as totalUsuariosIndicados
    `);

    const stats = Array.isArray(result) ? result[0] : {};

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
