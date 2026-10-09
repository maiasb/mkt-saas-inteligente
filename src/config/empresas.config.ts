// Tipos e regras padrão das empresas agenciadas (os dados ficam na tabela `empresas`)

export interface RegrasEmpresa {
  pontos_indicador: number; // pontos para quem indicou
  pontos_indicado: number; // pontos para quem se cadastrou pelo link
  valor_conversao: number; // recompensa (R$) por indicação convertida
  limite_indicacoes: number; // máximo de indicações por indicador (0 = sem limite)
}

export interface EmpresaConfig {
  id: string;
  slug: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cnpj?: string | null;
  ativo: boolean;
  cor: string; // Cor tema da empresa
  regras: RegrasEmpresa;
}

export const REGRAS_PADRAO: RegrasEmpresa = {
  pontos_indicador: 10,
  pontos_indicado: 5,
  valor_conversao: 50,
  limite_indicacoes: 0,
};
