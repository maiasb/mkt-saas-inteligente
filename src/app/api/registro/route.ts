import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * @deprecated Use /api/clientes/cadastro em vez desta rota
 * Esta rota está mantida para compatibilidade mas redireciona para o novo endpoint
 */
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

    // Buscar código do link pelo ID
    const [linkResult] = await db.query(
      'SELECT codigo, empresa_id FROM links WHERE id = ? AND ativo = 1',
      [linkId]
    );

    if (!Array.isArray(linkResult) || linkResult.length === 0) {
      return NextResponse.json(
        { error: 'Link inválido ou inativo' },
        { status: 404 }
      );
    }

    const link: any = linkResult[0];

    // Redirecionar para o novo endpoint /api/clientes/cadastro
    const cadastroBody = {
      nome,
      email,
      telefone,
      cpf,
      link_codigo: link.codigo,
      empresa_id: link.empresa_id
    };

    // Chamar o novo endpoint internamente
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/clientes/cadastro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cadastroBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Retornar resposta compatível com formato antigo
    return NextResponse.json({
      success: true,
      cliente: {
        id: data.data.cliente_id,
        nome,
        empresa: link.empresa_id,
      },
      // Incluir dados completos da nova resposta
      _novoCadastro: data.data
    });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar cadastro' },
      { status: 500 }
    );
  }
}
