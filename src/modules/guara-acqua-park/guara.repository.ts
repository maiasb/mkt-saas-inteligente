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
      // Verifica se API está configurada
      if (!this.apiUrl || !this.apiToken) {
        console.warn('[GuaraRepository] API não configurada, usando dados mockados');
        return this.getMockClientes(page, limit);
      }

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
      console.error('[GuaraRepository] Erro ao listar clientes da API, usando mock:', error);
      return this.getMockClientes(page, limit);
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
      console.error('[GuaraRepository] Erro ao buscar cliente, usando mock:', error);
      const mockData = this.getMockClientes(1, 100);
      return mockData.clientes.find((c: GuaraCliente) => c.id === clienteId) || null;
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
   * Busca na tabela indicacoes onde o cliente é indicador
   */
  async listarIndicacoesPorCliente(clienteId: string): Promise<GuaraIndicacao[]> {
    try {
      const [rows] = await db.query(
        `SELECT 
           i.id,
           i.indicador_id as indicador_cliente_id,
           i.cliente_id as convertido_cliente_id,
           i.created_at
         FROM indicacoes i
         WHERE i.indicador_id = ?
         ORDER BY i.created_at DESC`,
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

  /**Gera dados mockados para testes (quando API não está disponível)
   */
  private getMockClientes(page: number = 1, limit: number = 10) {
    const mockClientes: GuaraCliente[] = [
      {
        id: '67891a2b3c4d5e6f78901234',
        nome: 'João Silva',
        email: 'joao.silva@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
      },
      {
        id: '67891a2b3c4d5e6f78901235',
        nome: 'Maria Santos',
        email: 'maria.santos@email.com',
        telefone: '(11) 98765-4322',
        cpf: '234.567.890-11',
        created_at: new Date('2024-01-20'),
        updated_at: new Date('2024-01-20'),
      },
      {
        id: '67891a2b3c4d5e6f78901236',
        nome: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        telefone: '(11) 98765-4323',
        cpf: '345.678.901-22',
        created_at: new Date('2024-02-10'),
        updated_at: new Date('2024-02-10'),
      },
      {
        id: '67891a2b3c4d5e6f78901237',
        nome: 'Ana Costa',
        email: 'ana.costa@email.com',
        telefone: '(11) 98765-4324',
        cpf: '456.789.012-33',
        created_at: new Date('2024-03-05'),
        updated_at: new Date('2024-03-05'),
      },
      {
        id: '67891a2b3c4d5e6f78901238',
        nome: 'Carlos Ferreira',
        email: 'carlos.ferreira@email.com',
        telefone: '(11) 98765-4325',
        cpf: '567.890.123-44',
        created_at: new Date('2024-03-15'),
        updated_at: new Date('2024-03-15'),
      },
    ];

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedClientes = mockClientes.slice(start, end);

    return {
      clientes: paginatedClientes,
      paginacao: {
        pagina_atual: page,
        itens_por_pagina: limit,
        total_itens: mockClientes.length,
        total_paginas: Math.ceil(mockClientes.length / limit),
      },
    };
  }

  /**
   * 
   * Busca estatísticas do cliente baseado na tabela indicacoes
   */
  async buscarEstatisticas(clienteId: string) {
    try {
      const [rows] = await db.query(
        `SELECT 
          COUNT(DISTINCT i.cliente_id) as total_indicacoes,
          COUNT(DISTINCT i.cliente_id) as total_convertidos,
          0 as total_pendentes
         FROM indicacoes i
         WHERE i.indicador_id = ?`,
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

  /**
   * Lista indicações (usuários no sistema de indicações)
   * Usa tabela indicacoes que contém TODOS os clientes do programa
   * 
   * COLUNAS DA TABELA indicacoes: id, empresa_id, cliente_id, indicador_id, link_id, 
   *   nome, email, telefone, cpf, created_at
   * 
   * LÓGICA: 
   * - indicador_id NULL = cliente é apenas indicador
   * - indicador_id preenchido = cliente foi indicado por alguém
   * - Dados completos: nome, email, telefone, cpf salvos localmente
   */
  async listarIndicacoes(page: number = 1, limit: number = 10, tipo: string = '', busca: string = '') {
    try {
      const offset = (page - 1) * limit;
      let query = '';
      let countQuery = '';
      const params: any[] = [];
      const countParams: any[] = [];

      if (tipo === 'indicadores') {
        // Lista apenas indicadores (clientes que têm links)
        query = `
          SELECT 
            i.cliente_id as id,
            i.nome,
            i.email,
            i.telefone,
            'indicador' as tipo,
            COUNT(DISTINCT l.id) as total_links,
            (SELECT COUNT(*) FROM indicacoes WHERE indicador_id = i.cliente_id AND empresa_id = i.empresa_id) as total_indicados
          FROM indicacoes i
          INNER JOIN links l ON i.cliente_id = l.cliente_id 
            AND i.empresa_id = l.empresa_id
          WHERE i.empresa_id = ?
        `;
        countQuery = `
          SELECT COUNT(DISTINCT i.cliente_id) as total
          FROM indicacoes i
          INNER JOIN links l ON i.cliente_id = l.cliente_id 
            AND i.empresa_id = l.empresa_id
          WHERE i.empresa_id = ?
        `;
        params.push(this.empresaId);
        countParams.push(this.empresaId);

        if (busca) {
          query += ` AND (i.nome LIKE ? OR i.email LIKE ? OR i.cpf LIKE ?)`;
          countQuery += ` AND (i.nome LIKE ? OR i.email LIKE ? OR i.cpf LIKE ?)`;
          const searchTerm = `%${busca}%`;
          params.push(searchTerm, searchTerm, searchTerm);
          countParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` GROUP BY i.cliente_id, i.nome, i.email, i.telefone`;
        query += ` ORDER BY total_indicados DESC, i.nome`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

      } else if (tipo === 'indicados') {
        // Lista apenas indicados (clientes com indicador_id preenchido)
        query = `
          SELECT 
            i.cliente_id as id,
            i.nome,
            i.email,
            i.telefone,
            'indicado' as tipo,
            0 as total_links,
            0 as total_indicados,
            ind.nome as indicador_nome
          FROM indicacoes i
          LEFT JOIN indicacoes ind ON i.indicador_id = ind.cliente_id
            AND i.empresa_id = ind.empresa_id
          WHERE i.empresa_id = ?
            AND i.indicador_id IS NOT NULL
        `;
        countQuery = `
          SELECT COUNT(DISTINCT i.cliente_id) as total
          FROM indicacoes i
          WHERE i.empresa_id = ?
            AND i.indicador_id IS NOT NULL
        `;
        params.push(this.empresaId);
        countParams.push(this.empresaId);

        if (busca) {
          query += ` AND (i.nome LIKE ? OR i.email LIKE ? OR i.cpf LIKE ?)`;
          countQuery += ` AND (i.nome LIKE ? OR i.email LIKE ? OR i.cpf LIKE ?)`;
          const searchTerm = `%${busca}%`;
          params.push(searchTerm, searchTerm, searchTerm);
          countParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` GROUP BY i.cliente_id, i.nome, i.email, i.telefone, ind.nome`;
        query += ` ORDER BY i.nome`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

      } else {
        // Lista todos os clientes do programa
        query = `
          SELECT 
            i.cliente_id as id,
            i.nome,
            i.email,
            i.telefone,
            CASE 
              WHEN EXISTS(SELECT 1 FROM links WHERE cliente_id = i.cliente_id AND empresa_id = i.empresa_id) THEN 'indicador'
              ELSE 'indicado'
            END as tipo,
            (SELECT COUNT(DISTINCT id) FROM links WHERE cliente_id = i.cliente_id AND empresa_id = i.empresa_id) as total_links,
            (SELECT COUNT(*) FROM indicacoes WHERE indicador_id = i.cliente_id AND empresa_id = i.empresa_id) as total_indicados,
            indicador.nome as indicador_nome
          FROM indicacoes i
          LEFT JOIN indicacoes indicador ON i.indicador_id = indicador.cliente_id
            AND i.empresa_id = indicador.empresa_id
          WHERE i.empresa_id = ?
        `;
        params.push(this.empresaId);

        if (busca) {
          query += ` AND (i.nome LIKE ? OR i.email LIKE ? OR i.cpf LIKE ?)`;
          const searchTerm = `%${busca}%`;
          params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` GROUP BY i.cliente_id, i.nome, i.email, i.telefone, i.indicador_id, indicador.nome`;
        query += ` ORDER BY tipo, i.nome LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // Count query para todos
        countQuery = `
          SELECT COUNT(DISTINCT i.cliente_id) as total
          FROM indicacoes i
          WHERE i.empresa_id = ?
        `;
        countParams.push(this.empresaId);
        
        if (busca) {
          countQuery += ` AND (i.nome LIKE ? OR i.email LIKE ? OR i.cpf LIKE ?)`;
          const searchTerm = `%${busca}%`;
          countParams.push(searchTerm, searchTerm, searchTerm);
        }
      }

      // Executa queries
      const [indicacoes] = await db.query(query, params);
      const [countResult]: any = await db.query(countQuery, countParams);
      const totalItens = countResult[0]?.total || 0;

      // Busca estatísticas
      const [statsIndicadores]: any = await db.query(
        `SELECT COUNT(DISTINCT i.cliente_id) as total 
         FROM indicacoes i
         INNER JOIN links l ON i.cliente_id = l.cliente_id 
           AND i.empresa_id = l.empresa_id
         WHERE i.empresa_id = ?`,
        [this.empresaId]
      );
      const [statsIndicados]: any = await db.query(
        `SELECT COUNT(DISTINCT cliente_id) as total FROM indicacoes WHERE empresa_id = ? AND indicador_id IS NOT NULL`,
        [this.empresaId]
      );

      return {
        indicacoes,
        stats: {
          totalIndicacoes: totalItens,
          totalIndicadores: statsIndicadores[0]?.total || 0,
          totalIndicados: statsIndicados[0]?.total || 0,
        },
        paginacao: {
          pagina_atual: page,
          itens_por_pagina: limit,
          total_itens: totalItens,
          total_paginas: Math.ceil(totalItens / limit),
        },
      };
    } catch (error) {
      console.error('[GuaraRepository] Erro ao listar indicações:', error);
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
