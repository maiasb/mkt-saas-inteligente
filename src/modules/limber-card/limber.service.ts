// Service para Limber Card API (Plataforma de Vendas)

import { LimberCardRepository } from './limber.repository';

export class LimberCardService {
  private repository: LimberCardRepository;

  constructor() {
    this.repository = new LimberCardRepository();
  }

  /**
   * Autentica e retorna os dados completos da autenticação
   */
  async autenticar() {
    return await this.repository.authenticate();
  }

  /**
   * Obtém um token válido para uso em outras requisições
   */
  async obterToken() {
    return await this.repository.getToken();
  }

  /**
   * Limpa o cache do token (útil quando recebe erro 401)
   */
  limparCacheToken() {
    this.repository.clearTokenCache();
  }

  /**
   * Lista vendas da plataforma
   */
  async listarVendas(params?: {
    estabelecOrig?: number;
    limit?: number;
    dataVendaInit?: string;
    dataVendaFim?: string;
  }) {
    return await this.repository.listarVendas(params);
  }

  /**
   * Obtém detalhes completos de uma venda
   */
  async obterDetalhesVenda(codigoVenda: number) {
    return await this.repository.obterDetalhesVenda(codigoVenda);
  }
}
