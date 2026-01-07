import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - Listar clientes de uma empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [clientes] = await db.query(
      `SELECT * FROM clientes WHERE empresa_id = ? ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar clientes' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: empresaId } = await params;
    const body = await request.json();
    const { nome, email, telefone } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    const id = randomUUID();

    await db.query(
      `INSERT INTO clientes (id, nome, email, telefone, empresa_id) VALUES (?, ?, ?, ?, ?)`,
      [id, nome, email, telefone || null, empresaId]
    );

    const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
    const cliente = Array.isArray(rows) ? rows[0] : null;

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}

// DELETE - Remover cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');

    if (!clienteId) {
      return NextResponse.json(
        { error: 'ID do cliente não fornecido' },
        { status: 400 }
      );
    }

    await db.query('DELETE FROM clientes WHERE id = ?', [clienteId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar cliente' },
      { status: 500 }
    );
  }
}
