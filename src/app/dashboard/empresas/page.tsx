'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEmpresasAtivas } from '@/config/empresas.config';

export default function EmpresasRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a primeira empresa disponível
    const empresas = getEmpresasAtivas();
    if (empresas.length > 0) {
      router.replace(`/dashboard/empresas/${empresas[0].slug}/clientes`);
    } else {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-gray-600">Redirecionando...</div>
    </div>
  );
}
