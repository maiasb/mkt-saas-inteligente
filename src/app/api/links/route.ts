import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomBytes } from 'crypto';

// GET - Listar todos os links
export async function GET() {
  try {
    // Busca links com dados do cliente da tabela indicacoes
    const [links] = await db.query(`
      SELECT 
        l.*,
        e.nome as empresa_nome,
        i.nome as cliente_nome,
        i.email as cliente_email,
        (SELECT COUNT(*) FROM indicacoes WHERE indicador_id = l.cliente_id AND empresa_id = l.empresa_id) as usuarios_indicados_count
      FROM links l
      INNER JOIN empresas e ON e.id = l.empresa_id
      LEFT JOIN indicacoes i ON l.cliente_id = i.cliente_id 
        AND l.empresa_id = i.empresa_id
        AND i.indicador_id IS NULL
      GROUP BY l.id, e.nome, i.nome, i.email
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
    const { clienteId, clienteCpf, empresaId, empresaSlug } = body;

    if (!clienteId || !empresaId) {
      return NextResponse.json(
        { error: 'ID do cliente e empresa são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados completos do cliente na API externa do Guará usando CPF
    let clienteNome = null;
    let clienteEmail = null;
    let clienteTelefone = null;
    let clienteCpfFinal = clienteCpf || null;
    let clienteStatus = null;
    let clienteAssociadoStatus = null;
    let clienteDadosCompletos = false;

    try {
      const guaraApiUrl = process.env.GUARA_API_URL;
      const guaraApiToken = process.env.GUARA_API_TOKEN;

      if (guaraApiUrl && guaraApiToken) {
        let apiUrl = '';
        
        if (clienteCpf) {
          // Busca usando o parâmetro busca com CPF (mais confiável)
          apiUrl = `${guaraApiUrl}/clientes/?busca=${clienteCpf}`;
        } else {
          // Fallback: tenta buscar pelo ID se CPF não estiver disponível
          apiUrl = `${guaraApiUrl}/clientes/${clienteId}`;
        }
        
        console.log('🔍 Buscando cliente na API do Guará:', apiUrl);
        
        const clienteResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': guaraApiToken,
            'User-Agent': 'Dreams-Indicacoes/1.0',
          },
        });

        if (clienteResponse.ok) {
          const responseData = await clienteResponse.json();
          let clienteData = null;
          
          // A API pode retornar uma lista ou um objeto único
          if (responseData.lista && responseData.lista.length > 0) {
            clienteData = responseData.lista[0];
          } else if (responseData._id || responseData.id) {
            clienteData = responseData;
          }
          
          if (clienteData) {
            clienteNome = clienteData.nome || null;
            clienteEmail = clienteData.email || null;
            clienteTelefone = clienteData.telefones?.[0] || null;
            clienteCpfFinal = clienteData.cpf_cnpj || clienteCpf;
            clienteStatus = clienteData.status || null;
            clienteAssociadoStatus = clienteData.associado_status || null;
            clienteDadosCompletos = true;
            console.log('✅ Dados completos do cliente obtidos:', { nome: clienteNome, email: clienteEmail, cpf: clienteCpfFinal });
          } else {
            console.warn('⚠️ Cliente não encontrado na resposta da API do Guará');
          }
        } else {
          console.warn('⚠️ Erro na resposta da API do Guará:', clienteResponse.status);
        }
      } else {
        console.warn('⚠️ Configuração da API do Guará ausente');
      }
    } catch (apiError) {
      console.warn('⚠️ Erro ao buscar dados do cliente:', apiError);
      // Continua mesmo se não conseguir buscar os dados
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

    console.log('✅ Link criado:', { id, codigo, clienteId });

    // Salva/atualiza dados do indicador na tabela indicacoes
    const { v4: uuidv4 } = require('uuid');
    
    // Verifica se cliente já existe na tabela indicacoes
    const [existingCliente]: any = await db.query(
      `SELECT id FROM indicacoes WHERE cliente_id = ? AND empresa_id = ?`,
      [clienteId, empresaId]
    );

    if (existingCliente && existingCliente.length > 0) {
      // Atualiza dados do indicador se houver dados completos
      if (clienteDadosCompletos) {
        await db.query(
          `UPDATE indicacoes 
           SET nome = ?, email = ?, telefone = ?, cpf = ?
           WHERE cliente_id = ? AND empresa_id = ?`,
          [clienteNome, clienteEmail, clienteTelefone, clienteCpfFinal, clienteId, empresaId]
        );
        console.log('✅ Dados do indicador atualizados na tabela indicacoes');
      }
    } else {
      // Cria registro do indicador (indicador_id = NULL)
      const indicacaoId = uuidv4();
      await db.query(
        `INSERT INTO indicacoes 
         (id, empresa_id, cliente_id, indicador_id, link_id, nome, email, telefone, cpf, created_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, NOW())`,
        [indicacaoId, empresaId, clienteId, id, 
         clienteNome || `Cliente ${clienteId}`, clienteEmail, clienteTelefone, clienteCpfFinal]
      );
      console.log('✅ Indicador registrado na tabela indicacoes');
    }

    const [rows] = await db.query(
      `SELECT l.* FROM links l WHERE l.id = ?`,
      [id]
    );
    
    const link = Array.isArray(rows) ? rows[0] : null;

    return NextResponse.json({
      ...link,
      dados_completos: clienteDadosCompletos,
      warning: !clienteDadosCompletos ? 'Alguns dados do cliente podem estar incompletos' : null
    });
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
