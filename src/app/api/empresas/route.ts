import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - Listar todas as empresas
export async function GET() {
  try {
    const [empresas] = await db.query(`
      SELECT 
        e.*,
        COUNT(DISTINCT CASE WHEN c.indicador_cliente_id IS NULL THEN c.id END) as clientes_count,
        COUNT(DISTINCT l.id) as links_count,
        COUNT(DISTINCT CASE WHEN c.indicador_cliente_id IS NOT NULL THEN c.id END) as usuarios_indicados_count
      FROM empresas e
      LEFT JOIN clientes c ON c.empresa_id = e.id
      LEFT JOIN links l ON l.empresa_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar empresas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova empresa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, telefone, cnpj } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    
    await db.query(
      `INSERT INTO empresas (id, nome, email, telefone, cnpj) VALUES (?, ?, ?, ?, ?)`,
      [id, nome, email, telefone || null, cnpj || null]
    );

    const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
    const empresa = Array.isArray(rows) ? rows[0] : null;

    return NextResponse.json(empresa);
  } catch (error: any) {
    console.error('Erro ao criar empresa:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao criar empresa' },
      { status: 500 }
    );
  }
}

// DELETE - Remover empresa
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }

    await db.query('DELETE FROM empresas WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar empresa' },
      { status: 500 }
    );
  }
}
