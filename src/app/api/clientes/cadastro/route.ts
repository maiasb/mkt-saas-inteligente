import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { empresasService } from '@/modules/empresas';
import { programaService } from '@/modules/programa-indicacao';

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
    
    console.log('🔍 Link encontrado:', { id: link.id, indicador_id: link.indicador_id, empresa_id: link.empresa_id });

    // Verificar se empresa_id corresponde
    if (link.empresa_id !== empresa_id) {
      return NextResponse.json(
        { error: 'Link não pertence a esta empresa' },
        { status: 400 }
      );
    }

    // Regras de negócio da empresa (pontos e limite de indicações)
    const empresa = await empresasService.buscarPorId(empresa_id);
    if (!empresa || !empresa.ativo) {
      return NextResponse.json(
        { error: 'Empresa não encontrada ou inativa' },
        { status: 404 }
      );
    }

    if (!(await programaService.indicadorPodeIndicar(empresa, link.indicador_id))) {
      return NextResponse.json(
        { error: 'Limite de indicações do indicador atingido' },
        { status: 400 }
      );
    }

    // 2. SIMULAÇÃO: cadastro do cliente no sistema externo da empresa
    // TODO: substituir por chamada real quando o endpoint estiver disponível
    console.log('🔄 [SIMULADO] Cadastrando cliente no sistema externo:', {
      nome,
      email,
      telefone,
      cpf,
      empresa_id
    });

    const clienteExternoId = `MOCK_${uuidv4().substring(0, 8)}`;
    
    // Simulação de delay da API
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('✅ [SIMULADO] Cliente cadastrado com ID:', clienteExternoId);

    // 3. Verificar se indicação já existe (evitar duplicatas)
    const [existingIndicacao] = await db.query(`
      SELECT id FROM indicacoes
      WHERE cliente_id = ?
    `, [clienteExternoId]);

    if (Array.isArray(existingIndicacao) && existingIndicacao.length > 0) {
      return NextResponse.json(
        { error: 'Cliente já foi indicado anteriormente' },
        { status: 409 }
      );
    }

    // 4. Registrar indicado na tabela indicacoes (com dados completos + indicador_id)
    const indicacaoId = uuidv4();
    
    console.log('💾 Salvando indicação:', { 
      indicacaoId, 
      empresa_id, 
      clienteExternoId, 
      indicador_id: link.indicador_id,
      link_id: link.id,
      nome, 
      email 
    });
    
    await db.query(`
      INSERT INTO indicacoes (id, empresa_id, cliente_id, indicador_id, link_id, nome, email, telefone, cpf, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [indicacaoId, empresa_id, clienteExternoId, link.indicador_id, link.id, nome, email, telefone || null, cpf || null]);

    console.log('✅ Indicado registrado na tabela indicacoes:', indicacaoId);

    // 5. Registrar pontuações
    // Pontos para o INDICADOR (dono do link - quem indicou)
    // link.indicador_id é o cliente_id do dono do link
    const pontuacaoIndicadorId = uuidv4();
    await db.query(`
      INSERT INTO pontuacoes (id, empresa_id, cliente_id, pontos, link_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [pontuacaoIndicadorId, empresa_id, link.indicador_id, empresa.regras.pontos_indicador, link.id]);

    // Pontos para o INDICADO (quem se cadastrou pelo link)
    const pontuacaoIndicadoId = uuidv4();
    await db.query(`
      INSERT INTO pontuacoes (id, empresa_id, cliente_id, pontos, link_id, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [pontuacaoIndicadoId, empresa_id, clienteExternoId, empresa.regras.pontos_indicado, link.id]);

    console.log('✅ Pontuações registradas - Indicador:', link.indicador_id, `(${empresa.regras.pontos_indicador}pts) | Indicado:`, clienteExternoId, `(${empresa.regras.pontos_indicado}pts)`);

    return NextResponse.json({
      success: true,
      message: 'Cliente cadastrado e indicação registrada com sucesso',
      data: {
        cliente_id: clienteExternoId,
        indicacao_id: indicacaoId,
        indicador_id: link.indicador_id,
        pontos: {
          indicador: empresa.regras.pontos_indicador,
          indicado: empresa.regras.pontos_indicado
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
