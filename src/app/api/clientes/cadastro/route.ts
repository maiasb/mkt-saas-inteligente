import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, telefone, cpf, link_codigo, empresa_id } = body;

    // Validações básicas
    if (!nome || !email || !link_codigo || !empresa_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, link_codigo, empresa_id' },
        { status: 400 }
      );
    }

    // 1. Buscar link e indicador
    const [linkResult] = await db.query(`
      SELECT id, cliente_id as indicador_id, empresa_id
      FROM links
      WHERE codigo = ? AND ativo = 1
    `, [link_codigo]);

    if (!Array.isArray(linkResult) || linkResult.length === 0) {
      return NextResponse.json(
        { error: 'Link inválido ou inativo' },
        { status: 404 }
      );
    }

    const link: any = linkResult[0];

    // Verificar se empresa_id corresponde
    if (link.empresa_id !== empresa_id) {
      return NextResponse.json(
        { error: 'Link não pertence a esta empresa' },
        { status: 400 }
      );
    }

    // 2. SIMULAÇÃO: Cadastrar cliente na API do Guará
    // TODO: Substituir por chamada real quando endpoint estiver pronto
    console.log('🔄 [SIMULADO] Cadastrando cliente na API Guará:', {
      nome,
      email,
      telefone,
      cpf,
      empresa_id
    });

    // Simulando resposta da API Guará
    const clienteGuaraId = `MOCK_${uuidv4().substring(0, 8)}`;
    
    // Simulação de delay da API
    await new Promise(resolve => setTimeout(resolve, 500));

    /* 
    // CÓDIGO REAL (descomentar quando API Guará estiver pronta):
    const guaraResponse = await fetch('https://api.guarapark.app/v3/thirdy-party/clientes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GUARA_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome,
        email,
        telefone,
        cpf,
        // outros campos necessários
      })
    });

    if (!guaraResponse.ok) {
      throw new Error('Erro ao cadastrar cliente na API Guará');
    }

    const guaraData = await guaraResponse.json();
    const clienteGuaraId = guaraData.cliente_id;
    */

    console.log('✅ [SIMULADO] Cliente cadastrado no Guará com ID:', clienteGuaraId);

    // 3. Verificar se indicação já existe (evitar duplicatas)
    const [existingIndicacao] = await db.query(`
      SELECT id FROM indicacoes
      WHERE indicador_id = ? AND indicado_id = ?
    `, [link.indicador_id, clienteGuaraId]);

    if (Array.isArray(existingIndicacao) && existingIndicacao.length > 0) {
      return NextResponse.json(
        { error: 'Cliente já foi indicado anteriormente' },
        { status: 409 }
      );
    }

    // 4. Registrar indicação
    const indicacaoId = uuidv4();
    await db.query(`
      INSERT INTO indicacoes (id, empresa_id, indicador_id, indicado_id, link_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [indicacaoId, empresa_id, link.indicador_id, clienteGuaraId, link.id]);

    console.log('✅ Indicação registrada:', indicacaoId);

    // 5. Registrar pontuações
    // Pontos para o INDICADOR (quem indicou)
    const pontuacaoIndicadorId = uuidv4();
    await db.query(`
      INSERT INTO pontuacoes (id, empresa_id, cliente_id, pontos, link_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [pontuacaoIndicadorId, empresa_id, link.indicador_id, 10, link.id]);

    // Pontos para o INDICADO (novo cliente)
    const pontuacaoIndicadoId = uuidv4();
    await db.query(`
      INSERT INTO pontuacoes (id, empresa_id, cliente_id, pontos, link_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [pontuacaoIndicadoId, empresa_id, clienteGuaraId, 5, link.id]);

    console.log('✅ Pontuações registradas');

    return NextResponse.json({
      success: true,
      message: 'Cliente cadastrado e indicação registrada com sucesso',
      data: {
        cliente_id: clienteGuaraId,
        indicacao_id: indicacaoId,
        indicador_id: link.indicador_id,
        pontos: {
          indicador: 10,
          indicado: 5
        },
        simulado: true // Remove quando API real estiver em uso
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erro ao cadastrar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar cadastro' },
      { status: 500 }
    );
  }
}
