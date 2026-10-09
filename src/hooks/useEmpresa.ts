'use client';

import { useEffect, useState } from 'react';
import { EmpresaConfig } from '@/config/empresas.config';

// Carrega a empresa pelo slug via API (null = não encontrada)
export function useEmpresa(slug: string) {
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [carregandoEmpresa, setCarregandoEmpresa] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregandoEmpresa(true);
        const response = await fetch(`/api/empresas/${slug}`);
        setEmpresa(response.ok ? await response.json() : null);
      } catch (error) {
        console.error('Erro ao carregar empresa:', error);
        setEmpresa(null);
      } finally {
        setCarregandoEmpresa(false);
      }
    };

    carregar();
  }, [slug]);

  return { empresa, carregandoEmpresa };
}
