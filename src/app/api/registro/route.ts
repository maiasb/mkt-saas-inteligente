import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, telefone, cpf, linkId, clienteId } = body;

    // Validar dados obrigatórios
    if (!nome || !email || !linkId) {
      return NextResponse.json(
        { error: 'Nome, email e link são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o link existe e está ativo
    const [links] = await db.query(
      'SELECT * FROM links WHERE id = ? AND ativo = 1',
      [linkId]
    );

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Link inválido ou inativo' },
        { status: 404 }
      );
    }

    const link: any = links[0];
    const id = randomUUID();

    // Criar usuário indicado
    await db.query(
      `INSERT INTO usuarios_indicados (id, nome, email, telefone, cpf, link_id, cliente_id, empresa_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nome, email, telefone || null, cpf || null, linkId, clienteId || null, link.empresa_id]
    );

    // Buscar empresa
    const [empresas] = await db.query(
      'SELECT nome FROM empresas WHERE id = ?',
      [link.empresa_id]
    );
    const empresa: any = Array.isArray(empresas) ? empresas[0] : null;

    return NextResponse.json({
      success: true,
      usuario: {
        id,
        nome,
        empresa: empresa?.nome || '',
      },
    });
  } catch (error) {
    console.error('Erro ao criar usuário indicado:', error);
    return NextResponse.json(
      { error: 'Erro ao processar cadastro' },
      { status: 500 }
    );
  }
}
