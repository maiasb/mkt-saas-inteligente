'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Empresa {
  id: string;
  slug: string;
  nome: string;
  email: string;
  telefone?: string;
  cnpj?: string;
  cor: string;
  stats: {
    totalClientes: number;
    totalIndicacoes: number;
    totalConvertidos: number;
  };
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/empresas/lista');
      const data = await response.json();
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 xl:ml-0 ml-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Empresas Agenciadas</h1>
        <p className="text-gray-600 mt-2">
          Empresas cadastradas no sistema (hard coded)
        </p>
      </div>

      {/* Main Content */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="h-3 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : empresas.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">Nenhuma empresa configurada ainda.</p>
            <p className="text-sm text-gray-500 mt-2">
              Adicione empresas em <code className="bg-gray-200 px-2 py-1 rounded">src/config/empresas.config.ts</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresas.map((empresa) => (
              <div 
                key={empresa.id} 
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                style={{ borderTop: `4px solid ${empresa.cor}` }}
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{empresa.nome}</h3>
                
                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Clientes</p>
                    <p className="text-lg font-bold" style={{ color: empresa.cor }}>
                      {empresa.stats.totalClientes}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Indicações</p>
                    <p className="text-lg font-bold" style={{ color: empresa.cor }}>
                      {empresa.stats.totalIndicacoes}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Conversões</p>
                    <p className="text-lg font-bold" style={{ color: empresa.cor }}>
                      {empresa.stats.totalConvertidos}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>📧 {empresa.email}</p>
                  {empresa.telefone && <p>📱 {empresa.telefone}</p>}
                  {empresa.cnpj && <p>🏢 {empresa.cnpj}</p>}
                </div>
                
                <Link
                  href={`/dashboard/empresas/${empresa.slug}/clientes`}
                  className="block text-center py-2 rounded-lg transition"
                  style={{ 
                    backgroundColor: `${empresa.cor}15`,
                    color: empresa.cor,
                    fontWeight: 600
                  }}
                >
                  Ver Clientes →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
