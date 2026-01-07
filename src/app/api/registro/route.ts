import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, telefone, cpf, linkId } = body;

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

    // Verificar se já existe cliente com este email na empresa
    const [clienteExistente] = await db.query(
      'SELECT id FROM clientes WHERE email = ? AND empresa_id = ?',
      [email, link.empresa_id]
    );

    if (Array.isArray(clienteExistente) && clienteExistente.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um cadastro com este email' },
        { status: 400 }
      );
    }

    // Buscar informações do cliente indicador para determinar o nível
    let nivelIndicacao = 1;
    let indicadorClienteId = link.cliente_id || null;

    if (link.cliente_id) {
      // Verificar o nível do cliente indicador
      const [clienteIndicador] = await db.query(
        'SELECT nivel_indicacao FROM clientes WHERE id = ?',
        [link.cliente_id]
      );

      if (Array.isArray(clienteIndicador) && clienteIndicador.length > 0) {
        const clienteData: any = clienteIndicador[0];
        nivelIndicacao = (clienteData.nivel_indicacao || 1) + 1;
      }
    }

    // Criar cliente
    const novoClienteId = randomUUID();
    await db.query(
      `INSERT INTO clientes (id, nome, email, telefone, cpf, empresa_id, indicador_cliente_id, link_id, nivel_indicacao) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [novoClienteId, nome, email, telefone || null, cpf || null, link.empresa_id, indicadorClienteId, linkId, nivelIndicacao]
    );

    // Buscar empresa
    const [empresas] = await db.query(
      'SELECT nome FROM empresas WHERE id = ?',
      [link.empresa_id]
    );
    const empresa: any = Array.isArray(empresas) ? empresas[0] : null;

    return NextResponse.json({
      success: true,
      cliente: {
        id: novoClienteId,
        nome,
        empresa: empresa?.nome || '',
      },
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar cadastro' },
      { status: 500 }
    );
  }
}
