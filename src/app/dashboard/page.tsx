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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dreams - Painel Admin</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card Empresas */}
          <Link href="/dashboard/empresas">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
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
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
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
            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-purple-800 font-semibold">Total de Empresas</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalEmpresas}</p>
            </div>
            <div className="bg-pink-100 p-4 rounded-lg">
              <p className="text-pink-800 font-semibold">Clientes Cadastrados</p>
              <p className="text-3xl font-bold text-pink-900">{stats.totalClientes}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-blue-800 font-semibold">Links Ativos</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalLinks}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-green-800 font-semibold">Usuários Indicados</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalUsuariosIndicados}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
