import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Buscar usuário indicado por ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const [rows] = await db.query(
      'SELECT * FROM usuarios_indicados WHERE id = ?',
      [id]
    );

    const usuarios = rows as any[];
    
    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { error: 'Usuário indicado não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuarios[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário indicado:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário indicado' },
      { status: 500 }
    );
  }
}
