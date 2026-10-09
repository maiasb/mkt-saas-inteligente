// Repository de empresas agenciadas (tabela `empresas`)

import db from '@/lib/db';
import { EmpresaConfig, REGRAS_PADRAO, RegrasEmpresa } from '@/config/empresas.config';

export type DadosEmpresa = Omit<EmpresaConfig, 'id'>;

export class EmpresasRepository {
  private mapear(row: any): EmpresaConfig {
    const regras = typeof row.regras === 'string' ? JSON.parse(row.regras) : row.regras;
    return {
      id: row.id,
      slug: row.slug,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      cnpj: row.cnpj,
      cor: row.cor,
      ativo: Boolean(row.ativo),
      regras: { ...REGRAS_PADRAO, ...(regras as Partial<RegrasEmpresa>) },
    };
  }

  async listar(apenasAtivas: boolean = false): Promise<EmpresaConfig[]> {
    const [rows] = await db.query(
      `SELECT * FROM empresas ${apenasAtivas ? 'WHERE ativo = 1' : ''} ORDER BY nome`
    );
    return (rows as any[]).map(row => this.mapear(row));
  }

  async buscarPorSlug(slug: string): Promise<EmpresaConfig | null> {
    const [rows]: any = await db.query('SELECT * FROM empresas WHERE slug = ?', [slug]);
    return rows.length > 0 ? this.mapear(rows[0]) : null;
  }

  async buscarPorId(id: string): Promise<EmpresaConfig | null> {
    const [rows]: any = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
    return rows.length > 0 ? this.mapear(rows[0]) : null;
  }

  async criar(id: string, dados: DadosEmpresa): Promise<void> {
    await db.query(
      `INSERT INTO empresas (id, slug, nome, email, telefone, cnpj, cor, ativo, regras)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dados.slug,
        dados.nome,
        dados.email,
        dados.telefone || null,
        dados.cnpj || null,
        dados.cor,
        dados.ativo ? 1 : 0,
        JSON.stringify(dados.regras),
      ]
    );
  }

  // O slug não é atualizado: ele compõe as URLs do painel
  async atualizar(id: string, dados: Omit<DadosEmpresa, 'slug'>): Promise<void> {
    await db.query(
      `UPDATE empresas
       SET nome = ?, email = ?, telefone = ?, cnpj = ?, cor = ?, ativo = ?, regras = ?
       WHERE id = ?`,
      [
        dados.nome,
        dados.email,
        dados.telefone || null,
        dados.cnpj || null,
        dados.cor,
        dados.ativo ? 1 : 0,
        JSON.stringify(dados.regras),
        id,
      ]
    );
  }
}

export const empresasRepository = new EmpresasRepository();
