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
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8 xl:ml-0 ml-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bem-vindo ao painel administrativo Dreams</p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Empresas */}
          <Link href="/dashboard/empresas">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Empresas Agenciadas
                  </h2>
                  <p className="text-gray-600">
                    Gerencie as empresas parceiras
                  </p>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
            </div>
          </Link>

          {/* Card Links */}
          <Link href="/dashboard/links">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Links de Indicação
                  </h2>
                  <p className="text-gray-600">
                    Gere e gerencie links
                  </p>
                </div>
                <div className="text-4xl">🔗</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas</h2>
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
        </div>
      </div>
    </div>
  );
}
