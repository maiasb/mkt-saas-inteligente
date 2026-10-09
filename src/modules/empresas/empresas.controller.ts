// Controller de empresas agenciadas

import { NextRequest, NextResponse } from 'next/server';
import { EmpresaValidacaoError, empresasService } from './empresas.service';
import { programaService } from '@/modules/programa-indicacao';

export class EmpresasController {
  /**
   * GET - Lista empresas com estatísticas (?todas=1 inclui inativas)
   */
  async listar(request: NextRequest) {
    try {
      const todas = request.nextUrl.searchParams.get('todas') === '1';
      const empresas = await empresasService.listar(!todas);

      const empresasComStats = await Promise.all(
        empresas.map(async (empresa) => ({
          ...empresa,
          stats: await programaService.buscarEstatisticasGerais(empresa),
        }))
      );

      return NextResponse.json(empresasComStats);
    } catch (error) {
      console.error('[EmpresasController] Erro ao listar empresas:', error);
      return NextResponse.json({ error: 'Erro ao listar empresas' }, { status: 500 });
    }
  }

  /**
   * GET - Busca empresa por slug (ou id)
   */
  async buscar(slug: string) {
    try {
      const empresa = await empresasService.buscarPorSlugOuId(slug);
      if (!empresa) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
      }
      return NextResponse.json(empresa);
    } catch (error) {
      console.error('[EmpresasController] Erro ao buscar empresa:', error);
      return NextResponse.json({ error: 'Erro ao buscar empresa' }, { status: 500 });
    }
  }

  /**
   * POST - Cadastra empresa
   */
  async criar(request: NextRequest) {
    try {
      const body = await request.json();
      const empresa = await empresasService.criar(body);
      return NextResponse.json(empresa, { status: 201 });
    } catch (error) {
      if (error instanceof EmpresaValidacaoError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error('[EmpresasController] Erro ao criar empresa:', error);
      return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 });
    }
  }

  /**
   * PUT - Atualiza dados e regras da empresa
   */
  async atualizar(request: NextRequest, slug: string) {
    try {
      const body = await request.json();
      const empresa = await empresasService.atualizar(slug, body);
      if (!empresa) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
      }
      return NextResponse.json(empresa);
    } catch (error) {
      if (error instanceof EmpresaValidacaoError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error('[EmpresasController] Erro ao atualizar empresa:', error);
      return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 });
    }
  }
}

export const empresasController = new EmpresasController();
