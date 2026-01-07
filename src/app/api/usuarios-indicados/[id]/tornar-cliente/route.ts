import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomBytes } from 'crypto';

// POST - Converter usuário indicado em cliente
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { empresaId } = body;

    if (!empresaId) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário indicado
    const [usuarioRows] = await db.query(
      'SELECT * FROM usuarios_indicados WHERE id = ?',
      [id]
    );

    const usuarios = usuarioRows as any[];
    
    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { error: 'Usuário indicado não encontrado' },
        { status: 404 }
      );
    }

    const usuario = usuarios[0];

    // Verificar se já existe um cliente com este email na empresa
    const [clienteExistente] = await db.query(
      'SELECT * FROM clientes WHERE email = ? AND empresa_id = ?',
      [usuario.email, empresaId]
    );

    if (Array.isArray(clienteExistente) && clienteExistente.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um cliente com este email nesta empresa' },
        { status: 400 }
      );
    }

    // Buscar informações do link para determinar o nível
    const [linkRows] = await db.query(
      'SELECT cliente_id FROM links WHERE id = ?',
      [usuario.link_id]
    );

    const links = linkRows as any[];
    const indicadorOrigemId = links && links.length > 0 ? links[0].cliente_id : null;

    // Criar novo cliente a partir do usuário indicado
    const clienteId = randomBytes(16).toString('hex');
    
    await db.query(
      `INSERT INTO clientes (id, nome, email, telefone, empresa_id, usuario_indicado_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clienteId, usuario.nome, usuario.email, usuario.telefone, empresaId, id]
    );

    // Atualizar usuário indicado com o nível e indicador origem
    const nivel = usuario.nivel_indicacao || 1;
    await db.query(
      `UPDATE usuarios_indicados 
       SET nivel_indicacao = ?, indicador_origem_id = ? 
       WHERE id = ?`,
      [nivel, indicadorOrigemId, id]
    );

    // Buscar o cliente recém-criado
    const [novoClienteRows] = await db.query(
      'SELECT * FROM clientes WHERE id = ?',
      [clienteId]
    );

    return NextResponse.json({
      success: true,
      cliente: Array.isArray(novoClienteRows) ? novoClienteRows[0] : null
    });
  } catch (error) {
    console.error('Erro ao converter usuário em cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao converter usuário em cliente' },
      { status: 500 }
    );
  }
}
