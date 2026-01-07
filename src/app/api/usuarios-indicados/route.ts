import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Listar usuários indicados por link IDs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkIds = searchParams.get('linkIds');

    if (!linkIds) {
      return NextResponse.json([]);
    }

    const linkIdsArray = linkIds.split(',');
    const placeholders = linkIdsArray.map(() => '?').join(',');

    const [usuarios] = await db.query(
      `SELECT * FROM usuarios_indicados WHERE link_id IN (${placeholders}) ORDER BY created_at DESC`,
      linkIdsArray
    );

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários indicados:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários indicados' },
      { status: 500 }
    );
  }
}
