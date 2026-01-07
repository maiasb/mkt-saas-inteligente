import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomBytes } from 'crypto';

// GET - Listar todos os links
export async function GET() {
  try {
    const [links] = await db.query(`
      SELECT 
        l.*,
        e.nome as empresa_nome,
        c.nome as cliente_nome,
        COUNT(u.id) as usuarios_indicados_count
      FROM links l
      INNER JOIN empresas e ON e.id = l.empresa_id
      LEFT JOIN clientes c ON c.id = l.cliente_id
      LEFT JOIN usuarios_indicados u ON u.link_id = l.id
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);

    return NextResponse.json(links);
  } catch (error) {
    console.error('Erro ao listar links:', error);
    return NextResponse.json(
      { error: 'Erro ao listar links' },
      { status: 500 }
    );
  }
}

// POST - Criar novo link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteId } = body;

    if (!clienteId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se cliente existe e pegar empresa_id
    const [clientes] = await db.query('SELECT * FROM clientes WHERE id = ?', [clienteId]);
    if (!Array.isArray(clientes) || clientes.length === 0) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const cliente = clientes[0] as any;
    const empresaId = cliente.empresa_id;

    const id = randomBytes(16).toString('hex');
    const codigo = randomBytes(8).toString('hex');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/ref/${codigo}`;

    await db.query(
      `INSERT INTO links (id, url, codigo, empresa_id, cliente_id, ativo) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, url, codigo, empresaId, clienteId, true]
    );

    const [rows] = await db.query(`
      SELECT l.*, e.nome as empresa_nome, c.nome as cliente_nome
      FROM links l
      INNER JOIN empresas e ON e.id = l.empresa_id
      LEFT JOIN clientes c ON c.id = l.cliente_id
      WHERE l.id = ?
    `, [id]);
    
    const link = Array.isArray(rows) ? rows[0] : null;

    return NextResponse.json(link);
  } catch (error) {
    console.error('Erro ao criar link:', error);
    return NextResponse.json(
      { error: 'Erro ao criar link' },
      { status: 500 }
    );
  }
}

// DELETE - Remover link
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

    await db.query('DELETE FROM links WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar link:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar link' },
      { status: 500 }
    );
  }
}
