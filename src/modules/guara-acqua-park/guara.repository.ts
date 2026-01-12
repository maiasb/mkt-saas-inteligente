// Repository para Guará Acqua Park

import db from '@/lib/db';

export interface GuaraCliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GuaraIndicacao {
  id: string;
  indicador_cliente_id: string;
  nome: string;
  email: string;
  telefone?: string;
  convertido_cliente_id?: string;
  created_at: Date;
}

// Interface da API do Guará
interface GuaraAPICliente {
  _id: string;
  cpf_cnpj: string;
  nome: string;
  email: string;
  telefones: string[];
  created_at: string;
  updated_at: string;
  status: string;
  associado_status: string;
  all_titulos: Array<{
    titulo_serie_hash: string;
    nome_serie: string;
    situacao: string;
    vencimento: string;
  }>;
}

export class GuaraRepository {
  private readonly empresaId = 'guara-acqua-park-001';
  private readonly apiUrl = process.env.GUARA_API_URL;
  private readonly apiToken = process.env.GUARA_API_TOKEN;

  /**
   * Busca cliente específico do Guará por CPF/CNPJ
   */
  async buscarClientePorCpf(cpfCnpj: string) {
    try {
      const response = await fetch(
        `${this.apiUrl}/clientes/?busca=${cpfCnpj}`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.apiToken || '',
            'User-Agent': 'Dreams-Indicacoes/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.lista || data.lista.length === 0) {
        return null;
      }

      const cliente = data.lista[0];
      
      return {
        id: cliente._id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefones?.[0] || null,
        cpf: cliente.cpf_cnpj,
        created_at: new Date(cliente.created_at),
        updated_at: new Date(cliente.updated_at),
        status: cliente.status,
        associado_status: cliente.associado_status,
        titulos: cliente.all_titulos || [],
      };
    } catch (error) {
      console.error('[GuaraRepository] Erro ao buscar cliente por CPF:', error);
      throw error;
    }
  }

  /**
   * Lista todos os clientes do Guará Acqua Park da API externa com paginação
   */
  async listarClientes(page: number = 1, limit: number = 10) {
    try {
      const response = await fetch(
        `${this.apiUrl}/clientes/?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.apiToken || '',
            'User-Agent': 'Dreams-Indicacoes/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transforma dados da API para formato interno
      const clientes = data.lista.map((cliente: GuaraAPICliente) => ({
        id: cliente._id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefones?.[0] || null,
        cpf: cliente.cpf_cnpj,
        created_at: new Date(cliente.created_at),
        updated_at: new Date(cliente.updated_at),
        status: cliente.status,
        associado_status: cliente.associado_status,
        titulos: cliente.all_titulos || [],
      })) as GuaraCliente[];

      return {
        clientes,
        paginacao: {
          pagina_atual: page,
          itens_por_pagina: limit,
          total_itens: data.total,
          total_paginas: data.total_paginas,
        },
      };
    } catch (error) {
      console.error('[GuaraRepository] Erro ao listar clientes da API:', error);
      throw error;
    }
  }

  /**
   * Busca cliente por ID na API do Guará
   */
  async buscarClientePorId(clienteId: string): Promise<GuaraCliente | null> {
    try {
      // Busca na API (assumindo que existe endpoint específico ou busca na lista)
      const resultado = await this.listarClientes(1, 100);
      return resultado.clientes.find((c: GuaraCliente) => c.id === clienteId) || null;
    } catch (error) {
      console.error('[GuaraRepository] Erro ao buscar cliente:', error);
      throw error;
    }
  }

  /**
   * Busca cliente por email na API do Guará
   */
  async buscarClientePorEmail(email: string): Promise<GuaraCliente | null> {
    try {
      const resultado = await this.listarClientes(1, 100);
      return resultado.clientes.find((c: GuaraCliente) => c.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('[GuaraRepository] Erro ao buscar cliente por email:', error);
      throw error;
    }
  }

  /**
   * Busca cliente por CPF na API do Guará
   */
  async buscarClientePorCPF(cpf: string): Promise<GuaraCliente | null> {
    try {
      const resultado = await this.listarClientes(1, 100);
      return resultado.clientes.find((c: GuaraCliente) => c.cpf === cpf.replace(/\D/g, '')) || null;
    } catch (error) {
      console.error('[GuaraRepository] Erro ao buscar cliente por CPF:', error);
      throw error;
    }
  }

  /**
   * Lista indicações de um cliente (usuários indicados por ele)
   * Busca na tabela pontuacoes onde o cliente é indicador
   */
  async listarIndicacoesPorCliente(clienteId: string): Promise<GuaraIndicacao[]> {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT
           p.id,
           p.cliente_id as indicador_cliente_id,
           p.referencia_cliente_id as convertido_cliente_id,
           p.created_at
         FROM pontuacoes p
         WHERE p.cliente_id = ?
           AND p.tipo = 'INDICADOR'
           AND p.referencia_cliente_id IS NOT NULL
         ORDER BY p.created_at DESC`,
        [clienteId]
      );
      
      // Mapeia para interface GuaraIndicacao (nome e email virão da API externa quando necessário)
      return (rows as any[]).map(row => ({
        id: row.id,
        indicador_cliente_id: row.indicador_cliente_id,
        nome: '', // Dados virão da API externa
        email: '',
        telefone: undefined,
        convertido_cliente_id: row.convertido_cliente_id,
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error('[GuaraRepository] Erro ao listar indicações:', error);
      // Retorna array vazio se não houver dados
      return [];
    }
  }

  /**
   * Registra nova indicação (cria novo cliente indicado)
   */
  async registrarIndicacao(
    clienteId: string,
    nome: string,
    email: string,
    telefone?: string
  ): Promise<string> {
    try {
      const indicacaoId = this.generateUUID();
      
      await db.query(
        `INSERT INTO clientes 
        (id, empresa_id, indicador_cliente_id, nome, email, telefone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [indicacaoId, this.empresaId, clienteId, nome, email, telefone || null]
      );
      
      return indicacaoId;
    } catch (error) {
      console.error('[GuaraRepository] Erro ao registrar indicação:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas do cliente baseado na tabela pontuacoes
   */
  async buscarEstatisticas(clienteId: string) {
    try {
      const [rows] = await db.query(
        `SELECT 
          COUNT(DISTINCT p.referencia_cliente_id) as total_indicacoes,
          COUNT(DISTINCT p.referencia_cliente_id) as total_convertidos,
          0 as total_pendentes
         FROM pontuacoes p
         WHERE p.cliente_id = ?
           AND p.tipo = 'INDICADOR'
           AND p.referencia_cliente_id IS NOT NULL`,
        [clienteId]
      );
      
      const result = rows as any[];
      return result[0] || {
        total_indicacoes: 0,
        total_convertidos: 0,
        total_pendentes: 0,
      };
    } catch (error) {
      console.error('[GuaraRepository] Erro ao buscar estatísticas:', error);
      // Retorna valores padrão se houver erro
      return {
        total_indicacoes: 0,
        total_convertidos: 0,
        total_pendentes: 0,
      };
    }
  }

  /**
   * Busca links de um cliente
   */
  async buscarLinks(clienteId: string) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM links WHERE cliente_id = ? ORDER BY created_at DESC`,
        [clienteId]
      );
      return rows;
    } catch (error) {
      console.error('[GuaraRepository] Erro ao buscar links:', error);
      throw error;
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Exporta instância singleton
export const guaraRepository = new GuaraRepository();
