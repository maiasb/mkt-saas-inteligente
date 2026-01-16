// Controller para Guará Acqua Park

import { NextRequest, NextResponse } from 'next/server';
import { guaraService } from './guara.service';

export class GuaraController {
  private service = guaraService;

  /**
   * GET - Lista todos os clientes com paginação
   */
  async listarClientes(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      const resultado = await this.service.listarClientes(page, limit);
      return NextResponse.json(resultado);
    } catch (error) {
      console.error('[GuaraController] Erro ao listar clientes:', error);
      return NextResponse.json(
        { error: 'Erro ao listar clientes' },
        { status: 500 }
      );
    }
  }

  /**
   * GET - Busca cliente por ID
   */
  async buscarCliente(request: NextRequest, clienteId: string) {
    try {
      const clienteCompleto = await guaraService.buscarClienteCompleto(clienteId);
      
      if (!clienteCompleto) {
        // Cliente não encontrado - log warning ao invés de erro
        console.warn(`[GuaraController] Cliente ${clienteId} não encontrado`);
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(clienteCompleto);
    } catch (error) {
      console.error('[GuaraController] Erro ao buscar cliente:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar cliente' },
        { status: 500 }
      );
    }
  }

  /**
   * POST - Cria indicação
   */
  async criarIndicacao(request: NextRequest) {
    try {
      const body = await request.json();
      const { clienteId, nome, email, telefone } = body;

      if (!clienteId || !nome || !email) {
        return NextResponse.json(
          { error: 'clienteId, nome e email são obrigatórios' },
          { status: 400 }
        );
      }

      const result = await guaraService.criarIndicacao(
        clienteId,
        nome,
        email,
        telefone
      );

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('[GuaraController] Erro ao criar indicação:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao criar indicação' },
        { status: 400 }
      );
    }
  }

  /**
   * GET - Lista indicações (indicadores e indicados)
   */
  async listarIndicacoes(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const tipo = searchParams.get('tipo') || '';
      const busca = searchParams.get('busca') || '';

      const resultado = await this.service.listarIndicacoes(page, limit, tipo, busca);
      return NextResponse.json(resultado);
    } catch (error) {
      console.error('[GuaraController] Erro ao listar indicações:', error);
      return NextResponse.json(
        { error: 'Erro ao listar indicações' },
        { status: 500 }
      );
    }
  }

  /**
   * GET - Estatísticas gerais
   */
  async buscarEstatisticas(request: NextRequest) {
    try {
      const stats = await guaraService.buscarEstatisticasGerais();
      return NextResponse.json(stats);
    } catch (error) {
      console.error('[GuaraController] Erro ao buscar estatísticas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      );
    }
  }
}

// Exporta instância singleton
export const guaraController = new GuaraController();
