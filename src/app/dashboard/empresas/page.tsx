'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmpresasRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a primeira empresa disponível
    const redirecionar = async () => {
      try {
        const response = await fetch('/api/empresas');
        const empresas = response.ok ? await response.json() : [];
        router.replace(
          empresas.length > 0
            ? `/dashboard/empresas/${empresas[0].slug}/clientes`
            : '/dashboard/configuracoes/empresas'
        );
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        router.replace('/dashboard');
      }
    };

    redirecionar();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-gray-600">Redirecionando...</div>
    </div>
  );
}
