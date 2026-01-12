// Service para Guará Acqua Park

import { guaraRepository } from './guara.repository';

export class GuaraService {
  /**
   * Lista todos os clientes com paginação
   */
  async listarClientes(page: number = 1, limit: number = 10) {
    return await guaraRepository.listarClientes(page, limit);
  }

  /**
   * Busca informações completas de um cliente
   */
  async buscarClienteCompleto(clienteId: string) {
    const [cliente, indicacoes, estatisticas, links] = await Promise.all([
      guaraRepository.buscarClientePorId(clienteId),
      guaraRepository.listarIndicacoesPorCliente(clienteId),
      guaraRepository.buscarEstatisticas(clienteId),
      guaraRepository.buscarLinks(clienteId),
    ]);

    if (!cliente) {
      return null;
    }

    // Calcula recompensas (R$ 50 por indicação convertida)
    const recompensas = estatisticas.total_convertidos * 50;

    return {
      cliente,
      indicacoes,
      estatisticas: {
        totalIndicacoes: estatisticas.total_indicacoes,
        totalConvertidos: estatisticas.total_convertidos,
        totalPendentes: estatisticas.total_pendentes,
      },
      recompensas,
      links,
    };
  }

  /**
   * Cria nova indicação
   */
  async criarIndicacao(
    clienteId: string,
    nome: string,
    email: string,
    telefone?: string
  ) {
    // Validações
    const cliente = await guaraRepository.buscarClientePorId(clienteId);
    if (!cliente) {
      throw new Error('Cliente não encontrado');
    }

    // Verifica se email já foi indicado por este cliente
    const indicacoes = await guaraRepository.listarIndicacoesPorCliente(clienteId);
    const jaIndicado = indicacoes.some(
      ind => ind.email.toLowerCase() === email.toLowerCase()
    );

    if (jaIndicado) {
      throw new Error('Este email já foi indicado anteriormente');
    }

    // Verifica limite mensal (10 indicações)
    const estatisticas = await guaraRepository.buscarEstatisticas(clienteId);
    if (estatisticas.total_indicacoes >= 10) {
      throw new Error('Limite mensal de indicações atingido');
    }

    // Registra indicação
    const indicacaoId = await guaraRepository.registrarIndicacao(
      clienteId,
      nome,
      email,
      telefone
    );

    return {
      indicacaoId,
      message: 'Indicação registrada com sucesso',
    };
  }

  /**
   * Busca estatísticas gerais
   */
  async buscarEstatisticasGerais() {
    const resultado = await guaraRepository.listarClientes(1, 1); // Apenas para pegar totais
    
    let totalIndicacoes = 0;
    let totalConvertidos = 0;

    return {
      totalClientes: resultado.paginacao.total_itens,
      totalIndicacoes,
      totalConvertidos,
      totalRecompensas: totalConvertidos * 50,
    };
  }
}

// Exporta instância singleton
export const guaraService = new GuaraService();
