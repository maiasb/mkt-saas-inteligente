'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  totalEmpresas: number;
  totalClientes: number;
  totalLinks: number;
  totalUsuariosIndicados: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalEmpresas: 0,
    totalClientes: 0,
    totalLinks: 0,
    totalUsuariosIndicados: 0,
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setIsLoading(false);
      fetchStats();
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Estatísticas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas Gerais</h2>
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 p-4 rounded-lg h-24">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg">
                <p className="text-purple-800 font-semibold">Total de Empresas</p>
                <p className="text-3xl font-bold text-purple-900">{stats.totalEmpresas}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-4 rounded-lg">
                <p className="text-pink-800 font-semibold">Clientes Cadastrados</p>
                <p className="text-3xl font-bold text-pink-900">{stats.totalClientes}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg">
                <p className="text-blue-800 font-semibold">Links Ativos</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalLinks}</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg">
                <p className="text-green-800 font-semibold">Usuários Indicados</p>
                <p className="text-3xl font-bold text-green-900">{stats.totalUsuariosIndicados}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
