// Service de empresas agenciadas: validação e regras de negócio do cadastro

import { randomUUID } from 'crypto';
import { EmpresaConfig, REGRAS_PADRAO, RegrasEmpresa } from '@/config/empresas.config';
import { empresasRepository } from './empresas.repository';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const CAMPOS_REGRAS: (keyof RegrasEmpresa)[] = [
  'pontos_indicador',
  'pontos_indicado',
  'valor_conversao',
  'limite_indicacoes',
];

export class EmpresaValidacaoError extends Error {}

export class EmpresasService {
  async listar(apenasAtivas: boolean = false) {
    return await empresasRepository.listar(apenasAtivas);
  }

  async buscarPorSlug(slug: string) {
    return await empresasRepository.buscarPorSlug(slug);
  }

  async buscarPorId(id: string) {
    return await empresasRepository.buscarPorId(id);
  }

  /**
   * Aceita slug ou id (usado pelas rotas e pelo agente de IA)
   */
  async buscarPorSlugOuId(valor: string) {
    return (
      (await empresasRepository.buscarPorSlug(valor)) ||
      (await empresasRepository.buscarPorId(valor))
    );
  }

  async criar(body: any): Promise<EmpresaConfig> {
    const slug = String(body.slug || '').trim();
    if (!SLUG_REGEX.test(slug)) {
      throw new EmpresaValidacaoError('Slug inválido: use letras minúsculas, números e hífens');
    }
    if (await empresasRepository.buscarPorSlug(slug)) {
      throw new EmpresaValidacaoError('Já existe uma empresa com este slug');
    }

    const dados = this.validarDados(body);
    const id = `${slug}-${randomUUID().substring(0, 8)}`;
    await empresasRepository.criar(id, { ...dados, slug });

    return { id, slug, ...dados };
  }

  async atualizar(slug: string, body: any): Promise<EmpresaConfig | null> {
    const empresa = await empresasRepository.buscarPorSlug(slug);
    if (!empresa) {
      return null;
    }

    const dados = this.validarDados(body);
    await empresasRepository.atualizar(empresa.id, dados);

    return { ...empresa, ...dados };
  }

  private validarDados(body: any): Omit<EmpresaConfig, 'id' | 'slug'> {
    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim();
    if (!nome || !email) {
      throw new EmpresaValidacaoError('nome e email são obrigatórios');
    }

    const cor = String(body.cor || '#6366F1');
    if (!COR_REGEX.test(cor)) {
      throw new EmpresaValidacaoError('Cor inválida: use o formato #RRGGBB');
    }

    return {
      nome,
      email,
      telefone: body.telefone ? String(body.telefone).trim() : null,
      cnpj: body.cnpj ? String(body.cnpj).trim() : null,
      cor,
      ativo: body.ativo !== false,
      regras: this.validarRegras(body.regras),
    };
  }

  private validarRegras(entrada: any): RegrasEmpresa {
    const regras = { ...REGRAS_PADRAO };

    for (const campo of CAMPOS_REGRAS) {
      if (entrada?.[campo] === undefined) continue;
      const valor = Number(entrada[campo]);
      if (!Number.isFinite(valor) || valor < 0) {
        throw new EmpresaValidacaoError(`Regra inválida: ${campo} deve ser um número maior ou igual a 0`);
      }
      regras[campo] = valor;
    }

    return regras;
  }
}

export const empresasService = new EmpresasService();
