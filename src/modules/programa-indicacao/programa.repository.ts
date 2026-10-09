// Repository do programa de indicação (dados locais, por empresa)

import { randomUUID } from 'crypto';
import db from '@/lib/db';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  created_at?: Date;
}

export interface NovoCliente {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
}

export class ProgramaRepository {
  /**
   * Lista os clientes da empresa (todos os participantes da tabela indicacoes)
   */
  async listarClientes(empresaId: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT cliente_id as id, nome, email, telefone, cpf
         FROM indicacoes
         WHERE empresa_id = ?
         GROUP BY cliente_id, nome, email, telefone, cpf
         ORDER BY nome
         LIMIT ? OFFSET ?`,
        [empresaId, limit, offset]
      );
      const [countResult]: any = await db.query(
        `SELECT COUNT(DISTINCT cliente_id) as total FROM indicacoes WHERE empresa_id = ?`,
        [empresaId]
      );
      const totalItens = countResult[0]?.total || 0;

      return {
        clientes: rows as Cliente[],
        paginacao: {
          pagina_atual: page,
          itens_por_pagina: limit,
          total_itens: totalItens,
          total_paginas: Math.ceil(totalItens / limit),
        },
      };
    } catch (error) {
      console.error('[ProgramaRepository] Erro ao listar clientes:', error);
      throw error;
    }
  }

  /**
   * Busca cliente da empresa por ID
   */
  async buscarClientePorId(empresaId: string, clienteId: string): Promise<Cliente | null> {
    try {
      const [rows]: any = await db.query(
        `SELECT cliente_id as id, nome, email, telefone, cpf, created_at
         FROM indicacoes
         WHERE empresa_id = ? AND cliente_id = ?
         LIMIT 1`,
        [empresaId, clienteId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('[ProgramaRepository] Erro ao buscar cliente:', error);
      throw error;
    }
  }

  /**
   * Cadastra cliente na empresa (participante sem indicador e sem link)
   */
  async criarCliente(empresaId: string, cliente: NovoCliente): Promise<string> {
    try {
      const clienteId = randomUUID();

      await db.query(
        `INSERT INTO indicacoes (id, empresa_id, cliente_id, indicador_id, link_id, nome, email, telefone, cpf, created_at)
         VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, NOW())`,
        [randomUUID(), empresaId, clienteId, cliente.nome, cliente.email, cliente.telefone || null, cliente.cpf || null]
      );

      return clienteId;
    } catch (error) {
      console.error('[ProgramaRepository] Erro ao criar cliente:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas do cliente baseado na tabela indicacoes
   */
  async buscarEstatisticas(empresaId: string, clienteId: string) {
    try {
      const [rows]: any = await db.query(
        `SELECT
           COUNT(DISTINCT cliente_id) as total_indicacoes,
           COUNT(DISTINCT cliente_id) as total_convertidos,
           0 as total_pendentes
         FROM indicacoes
         WHERE empresa_id = ? AND indicador_id = ?`,
        [empresaId, clienteId]
      );
      return rows[0];
    } catch (error) {
      console.error('[ProgramaRepository] Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Conta quantas indicações o cliente já fez
   */
  async contarIndicacoes(empresaId: string, clienteId: string): Promise<number> {
    const [rows]: any = await db.query(
      `SELECT COUNT(*) as total FROM indicacoes WHERE empresa_id = ? AND indicador_id = ?`,
      [empresaId, clienteId]
    );
    return rows[0]?.total || 0;
  }

  /**
   * Lista indicações de um cliente (usuários indicados por ele)
   */
  async listarIndicacoesPorCliente(empresaId: string, clienteId: string) {
    try {
      const [rows] = await db.query(
        `SELECT id, indicador_id, cliente_id, nome, email, telefone, created_at
         FROM indicacoes
         WHERE empresa_id = ? AND indicador_id = ?
         ORDER BY created_at DESC`,
        [empresaId, clienteId]
      );
      return rows as any[];
    } catch (error) {
      console.error('[ProgramaRepository] Erro ao listar indicações do cliente:', error);
      throw error;
    }
  }

  /**
   * Busca links de um cliente
   */
  async buscarLinks(empresaId: string, clienteId: string) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM links WHERE empresa_id = ? AND cliente_id = ? ORDER BY created_at DESC`,
        [empresaId, clienteId]
      );
      return rows;
    } catch (error) {
      console.error('[ProgramaRepository] Erro ao buscar links:', error);
      throw error;
    }
  }

  /**
   * Resumo do programa da empresa (totais, indicações recentes e top indicadores)
   */
  async buscarDashboard(empresaId: string) {
    try {
      const [totalClientes]: any = await db.query(
        `SELECT COUNT(DISTINCT cliente_id) as total FROM indicacoes WHERE empresa_id = ?`,
        [empresaId]
      );
      const [totalIndicadores]: any = await db.query(
        `SELECT COUNT(DISTINCT cliente_id) as total FROM links WHERE empresa_id = ? AND ativo = 1`,
        [empresaId]
      );
      const [totalIndicados]: any = await db.query(
        `SELECT COUNT(DISTINCT cliente_id) as total FROM indicacoes WHERE empresa_id = ? AND indicador_id IS NOT NULL`,
        [empresaId]
      );
      const [totalLinks]: any = await db.query(
        `SELECT COUNT(*) as total FROM links WHERE empresa_id = ? AND ativo = 1`,
        [empresaId]
      );
      const [totalPontos]: any = await db.query(
        `SELECT COALESCE(SUM(pontos), 0) as total FROM pontuacoes WHERE empresa_id = ?`,
        [empresaId]
      );

      const [indicacoesRecentes] = await db.query(
        `SELECT i.cliente_id, i.nome, i.email, i.created_at, ind.nome as indicador_nome
         FROM indicacoes i
         LEFT JOIN indicacoes ind ON i.indicador_id = ind.cliente_id
         WHERE i.empresa_id = ? AND i.indicador_id IS NOT NULL
         ORDER BY i.created_at DESC
         LIMIT 5`,
        [empresaId]
      );
      const [topIndicadores] = await db.query(
        `SELECT i.cliente_id, i.nome, i.email, COUNT(*) as total_indicacoes
         FROM indicacoes i
         INNER JOIN indicacoes ind ON ind.indicador_id = i.cliente_id
         WHERE i.empresa_id = ?
         GROUP BY i.cliente_id, i.nome, i.email
         ORDER BY total_indicacoes DESC
         LIMIT 5`,
        [empresaId]
      );

      return {
        resumo: {
          totalClientes: totalClientes[0]?.total || 0,
          totalIndicadores: totalIndicadores[0]?.total || 0,
          totalIndicados: totalIndicados[0]?.total || 0,
          totalLinks: totalLinks[0]?.total || 0,
          totalPontos: totalPontos[0]?.total || 0,
        },
        indicacoesRecentes: indicacoesRecentes || [],
        topIndicadores: topIndicadores || [],
      };
    } catch (error) {
      console.error('[ProgramaRepository] Erro ao buscar dashboard:', error);
      throw error;
    }
  }

  /**
   * Lista indicações (usuários no sistema de indicações)
   * Usa a tabela indicacoes, que contém TODOS os participantes do programa:
   * - indicador_id NULL = participante é apenas indicador
   * - indicador_id preenchido = participante foi indicado por alguém
   */
  async listarIndicacoes(empresaId: string, page: number = 1, limit: number = 10, tipo: string = '', busca: string = '') {
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
        params.push(empresaId);
        countParams.push(empresaId);

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
        params.push(empresaId);
        countParams.push(empresaId);

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
        params.push(empresaId);

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
        countParams.push(empresaId);
        
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
        [empresaId]
      );
      const [statsIndicados]: any = await db.query(
        `SELECT COUNT(DISTINCT cliente_id) as total FROM indicacoes WHERE empresa_id = ? AND indicador_id IS NOT NULL`,
        [empresaId]
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
      console.error('[ProgramaRepository] Erro ao listar indicações:', error);
      throw error;
    }
  }
}

export const programaRepository = new ProgramaRepository();
