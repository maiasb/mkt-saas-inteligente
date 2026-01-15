// Controller para Limber Card API

import { NextRequest, NextResponse } from 'next/server';
import { LimberCardService } from './limber.service';

export class LimberCardController {
  private service: LimberCardService;

  constructor() {
    this.service = new LimberCardService();
  }

  /**
   * POST /api/limber-card/auth
   * Autentica na plataforma de vendas e retorna o token
   */
  async autenticar(request: NextRequest) {
    try {
      const authData = await this.service.autenticar();
      
      return NextResponse.json({
        token: authData.token,
        usuario: {
          codigo: authData.codigo,
          nome: authData.nome,
          usuario: authData.usuario,
          email: authData.email,
          nivel: authData.nivel,
        },
        parceiros: authData.parceiros,
        message: authData.message,
      });
    } catch (error) {
      console.error('Erro ao autenticar no Limber Card:', error);
      return NextResponse.json(
        { error: 'Erro ao autenticar na plataforma de vendas' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/limber-card/token
   * Retorna apenas o token válido (obtém novo se necessário)
   */
  async obterToken(request: NextRequest) {
    try {
      const token = await this.service.obterToken();
      
      return NextResponse.json({ token });
    } catch (error) {
      console.error('Erro ao obter token do Limber Card:', error);
      return NextResponse.json(
        { error: 'Erro ao obter token' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/limber-card/vendas
   * Lista vendas da plataforma Limber Card
   */
  async listarVendas(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      
      const params = {
        estabelecOrig: searchParams.get('estabelecOrig') 
          ? parseInt(searchParams.get('estabelecOrig')!) 
          : undefined,
        limit: searchParams.get('limit') 
          ? parseInt(searchParams.get('limit')!) 
          : undefined,
        dataVendaInit: searchParams.get('dataVendaInit') || undefined,
        dataVendaFim: searchParams.get('dataVendaFim') || undefined,
      };

      const vendas = await this.service.listarVendas(params);
      
      return NextResponse.json(vendas);
    } catch (error) {
      console.error('Erro ao listar vendas do Limber Card:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao listar vendas' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/limber-card/vendas/[codigo]
   * Obtém detalhes completos de uma venda
   */
  async obterDetalhesVenda(codigoVenda: number) {
    try {
      const detalhes = await this.service.obterDetalhesVenda(codigoVenda);
      return NextResponse.json(detalhes);
    } catch (error) {
      console.error('Erro ao obter detalhes da venda:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao obter detalhes da venda' },
        { status: 500 }
      );
    }
  }
}

export const limberCardController = new LimberCardController();
