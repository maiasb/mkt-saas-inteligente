// Service do programa de indicação: regras de negócio vêm da empresa (campo `regras`)

import { EmpresaConfig } from '@/config/empresas.config';
import { programaRepository, NovoCliente } from './programa.repository';

export class ProgramaValidacaoError extends Error {}

export class ProgramaService {
  /**
   * Lista os clientes da empresa com paginação
   */
  async listarClientes(empresa: EmpresaConfig, page: number = 1, limit: number = 10) {
    return await programaRepository.listarClientes(empresa.id, page, limit);
  }

  /**
   * Cadastra um cliente na empresa
   */
  async criarCliente(empresa: EmpresaConfig, dados: NovoCliente) {
    const nome = dados.nome?.trim();
    const email = dados.email?.trim();
    if (!nome || !email) {
      throw new ProgramaValidacaoError('nome e email são obrigatórios');
    }

    const clienteId = await programaRepository.criarCliente(empresa.id, {
      nome,
      email,
      telefone: dados.telefone?.trim(),
      cpf: dados.cpf?.trim(),
    });

    return { clienteId };
  }

  /**
   * Busca informações completas de um cliente
   */
  async buscarClienteCompleto(empresa: EmpresaConfig, clienteId: string) {
    const cliente = await programaRepository.buscarClientePorId(empresa.id, clienteId);
    if (!cliente) {
      return null;
    }

    const [indicacoes, estatisticas, links] = await Promise.all([
      programaRepository.listarIndicacoesPorCliente(empresa.id, clienteId),
      programaRepository.buscarEstatisticas(empresa.id, clienteId),
      programaRepository.buscarLinks(empresa.id, clienteId),
    ]);

    return {
      cliente,
      indicacoes,
      estatisticas: {
        totalIndicacoes: estatisticas.total_indicacoes,
        totalConvertidos: estatisticas.total_convertidos,
        totalPendentes: estatisticas.total_pendentes,
      },
      recompensas: estatisticas.total_convertidos * empresa.regras.valor_conversao,
      links,
    };
  }

  /**
   * Indica se o indicador ainda pode receber indicações (limite_indicacoes = 0: sem limite)
   */
  async indicadorPodeIndicar(empresa: EmpresaConfig, indicadorId: string): Promise<boolean> {
    const limite = empresa.regras.limite_indicacoes;
    if (!limite) {
      return true;
    }
    return (await programaRepository.contarIndicacoes(empresa.id, indicadorId)) < limite;
  }

  /**
   * Busca estatísticas gerais da empresa
   */
  async buscarEstatisticasGerais(empresa: EmpresaConfig) {
    const { resumo } = await programaRepository.buscarDashboard(empresa.id);

    return {
      totalClientes: resumo.totalClientes,
      totalIndicacoes: resumo.totalIndicados,
      totalConvertidos: resumo.totalIndicados,
      totalRecompensas: resumo.totalIndicados * empresa.regras.valor_conversao,
    };
  }

  async buscarDashboard(empresa: EmpresaConfig) {
    return await programaRepository.buscarDashboard(empresa.id);
  }

  /**
   * Lista indicações (indicadores e indicados)
   */
  async listarIndicacoes(empresa: EmpresaConfig, page: number = 1, limit: number = 10, tipo: string = '', busca: string = '') {
    return await programaRepository.listarIndicacoes(empresa.id, page, limit, tipo, busca);
  }
}

export const programaService = new ProgramaService();
