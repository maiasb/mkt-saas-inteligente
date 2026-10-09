// Controller do programa de indicação (rotas em /api/empresas/[slug]/…)

import { NextRequest, NextResponse } from 'next/server';
import { empresasService } from '@/modules/empresas/empresas.service';
import { ProgramaValidacaoError, programaService } from './programa.service';

export class ProgramaController {
  private async resolverEmpresa(slug: string) {
    return await empresasService.buscarPorSlugOuId(slug);
  }

  private empresaNaoEncontrada() {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
  }

  /**
   * GET - Lista clientes da empresa com paginação
   */
  async listarClientes(request: NextRequest, slug: string) {
    try {
      const empresa = await this.resolverEmpresa(slug);
      if (!empresa) return this.empresaNaoEncontrada();

      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      return NextResponse.json(await programaService.listarClientes(empresa, page, limit));
    } catch (error) {
      console.error('[ProgramaController] Erro ao listar clientes:', error);
      return NextResponse.json({ error: 'Erro ao listar clientes' }, { status: 500 });
    }
  }

  /**
   * POST - Cadastra cliente na empresa
   */
  async criarCliente(request: NextRequest, slug: string) {
    try {
      const empresa = await this.resolverEmpresa(slug);
      if (!empresa) return this.empresaNaoEncontrada();

      const body = await request.json();
      const resultado = await programaService.criarCliente(empresa, body);
      return NextResponse.json(resultado, { status: 201 });
    } catch (error) {
      if (error instanceof ProgramaValidacaoError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error('[ProgramaController] Erro ao criar cliente:', error);
      return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
    }
  }

  /**
   * GET - Busca cliente por ID
   */
  async buscarCliente(slug: string, clienteId: string) {
    try {
      const empresa = await this.resolverEmpresa(slug);
      if (!empresa) return this.empresaNaoEncontrada();

      const clienteCompleto = await programaService.buscarClienteCompleto(empresa, clienteId);
      if (!clienteCompleto) {
        return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
      }

      return NextResponse.json(clienteCompleto);
    } catch (error) {
      console.error('[ProgramaController] Erro ao buscar cliente:', error);
      return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
    }
  }

  /**
   * GET - Lista indicações (indicadores e indicados)
   */
  async listarIndicacoes(request: NextRequest, slug: string) {
    try {
      const empresa = await this.resolverEmpresa(slug);
      if (!empresa) return this.empresaNaoEncontrada();

      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const tipo = searchParams.get('tipo') || '';
      const busca = searchParams.get('busca') || '';

      return NextResponse.json(await programaService.listarIndicacoes(empresa, page, limit, tipo, busca));
    } catch (error) {
      console.error('[ProgramaController] Erro ao listar indicações:', error);
      return NextResponse.json({ error: 'Erro ao listar indicações' }, { status: 500 });
    }
  }

  /**
   * GET - Dados do dashboard da empresa
   */
  async buscarDashboard(slug: string) {
    try {
      const empresa = await this.resolverEmpresa(slug);
      if (!empresa) return this.empresaNaoEncontrada();

      return NextResponse.json(await programaService.buscarDashboard(empresa));
    } catch (error) {
      console.error('[ProgramaController] Erro ao buscar dashboard:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
    }
  }
}

export const programaController = new ProgramaController();
