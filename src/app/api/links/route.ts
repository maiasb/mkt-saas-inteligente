import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomBytes } from 'crypto';
import { empresasService } from '@/modules/empresas';

// GET - Listar todos os links
export async function GET() {
  try {
    // Busca links com dados do cliente da tabela indicacoes
    const [links] = await db.query(`
      SELECT 
        l.*,
        i.nome as cliente_nome,
        i.email as cliente_email,
        (SELECT COUNT(*) FROM indicacoes WHERE indicador_id = l.cliente_id AND empresa_id = l.empresa_id) as usuarios_indicados_count
      FROM links l
      LEFT JOIN indicacoes i ON l.cliente_id = i.cliente_id 
        AND l.empresa_id = i.empresa_id
        AND i.indicador_id IS NULL
      GROUP BY l.id, i.nome, i.email
      ORDER BY l.created_at DESC
    `);

    const empresas = await empresasService.listar();
    const linksComEmpresa = (links as any[]).map(link => ({
      ...link,
      empresa_nome: empresas.find(e => e.id === link.empresa_id)?.nome ?? null,
    }));

    return NextResponse.json(linksComEmpresa);
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
    const { clienteId, empresaId } = body;

    if (!clienteId || !empresaId) {
      return NextResponse.json(
        { error: 'ID do cliente e empresa são obrigatórios' },
        { status: 400 }
      );
    }

    const empresa = await empresasService.buscarPorId(empresaId);
    if (!empresa || !empresa.ativo) {
      return NextResponse.json(
        { error: 'Empresa não encontrada ou inativa' },
        { status: 404 }
      );
    }

    const id = randomBytes(16).toString('hex');
    const codigo = randomBytes(8).toString('hex');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/ref/${codigo}`;

    // Insere link (apenas referência do indicador)
    await db.query(
      `INSERT INTO links 
       (id, url, codigo, empresa_id, cliente_id, ativo, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, url, codigo, empresaId, clienteId, true]
    );

    // Garante o registro do indicador na tabela indicacoes (indicador_id = NULL)
    const [existingCliente]: any = await db.query(
      `SELECT id FROM indicacoes WHERE cliente_id = ? AND empresa_id = ?`,
      [clienteId, empresaId]
    );

    if (!existingCliente || existingCliente.length === 0) {
      await db.query(
        `INSERT INTO indicacoes 
         (id, empresa_id, cliente_id, indicador_id, link_id, nome, created_at)
         VALUES (?, ?, ?, NULL, ?, ?, NOW())`,
        [randomBytes(16).toString('hex'), empresaId, clienteId, id, `Cliente ${clienteId}`]
      );
    }

    const [rows] = await db.query(
      `SELECT l.* FROM links l WHERE l.id = ?`,
      [id]
    );
    
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
