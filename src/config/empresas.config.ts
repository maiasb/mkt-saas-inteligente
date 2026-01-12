// Registry de empresas hard coded

export interface EmpresaConfig {
  id: string;
  slug: string;
  nome: string;
  email: string;
  telefone?: string;
  cnpj?: string;
  ativo: boolean;
  cor: string; // Cor tema da empresa
  logo?: string;
}

// Empresas cadastradas no sistema
export const EMPRESAS: Record<string, EmpresaConfig> = {
  'guara-acqua-park': {
    id: 'guara-acqua-park-001',
    slug: 'guara-acqua-park',
    nome: 'Guará Acqua Park',
    email: 'contato@guaraacquapark.com.br',
    telefone: '(61) 3999-0000',
    cnpj: '12.345.678/0001-90',
    ativo: true,
    cor: '#0EA5E9', // Azul água
  },
};

// Helper para obter empresa por slug
export function getEmpresaBySlug(slug: string): EmpresaConfig | null {
  return EMPRESAS[slug] || null;
}

// Helper para obter empresa por ID
export function getEmpresaById(id: string): EmpresaConfig | null {
  return Object.values(EMPRESAS).find(e => e.id === id) || null;
}

// Helper para listar todas as empresas ativas
export function getEmpresasAtivas(): EmpresaConfig[] {
  return Object.values(EMPRESAS).filter(e => e.ativo);
}

// Helper para verificar se slug existe
export function empresaExists(slug: string): boolean {
  return slug in EMPRESAS;
}
