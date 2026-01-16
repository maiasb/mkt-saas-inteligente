'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EmpresaStats {
  id: string;
  nome: string;
  slug: string;
  cor: string;
  stats: {
    totalClientes: number;
    totalIndicadores: number;
    totalIndicados: number;
    totalLinks: number;
    totalPontos: number;
  };
}

interface Stats {
  totalEmpresas: number;
  totalClientes: number;
  totalLinks: number;
  totalUsuariosIndicados: number;
  totalPontos: number;
  empresas: EmpresaStats[];
  topIndicadores: Array<{
    cliente_id: string;
    nome: string;
    email: string;
    empresa_id: string;
    total_indicacoes: number;
  }>;
  indicacoesRecentes: Array<{
    cliente_id: string;
    nome: string;
    email: string;
    empresa_id: string;
    created_at: string;
    indicador_nome: string;
  }>;
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
    totalPontos: 0,
    empresas: [],
    topIndicadores: [],
    indicacoesRecentes: []
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
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Geral</h1>
        <p className="text-gray-600 mt-2">Visão completa do sistema de indicações</p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Estatísticas Gerais */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Estatísticas Gerais</h2>
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Empresas</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalEmpresas}</p>
                  </div>
                  <span className="text-4xl">🏢</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Clientes</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalClientes}</p>
                  </div>
                  <span className="text-4xl">👥</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Links Ativos</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalLinks}</p>
                  </div>
                  <span className="text-4xl">🔗</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Indicados</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.totalUsuariosIndicados}</p>
                  </div>
                  <span className="text-4xl">✅</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Pontos</p>
                    <p className="text-3xl font-bold text-pink-600 mt-2">{stats.totalPontos}</p>
                  </div>
                  <span className="text-4xl">⭐</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empresas */}
        {!loadingStats && stats.empresas.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🏢 Empresas Cadastradas</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Clientes por Empresa */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Clientes por Empresa</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.empresas.map(e => ({ nome: e.nome, clientes: e.stats.totalClientes }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clientes" fill="#8b5cf6" name="Clientes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Indicações por Empresa */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Indicações por Empresa</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.empresas.map(e => ({ 
                    nome: e.nome, 
                    indicadores: e.stats.totalIndicadores,
                    indicados: e.stats.totalIndicados
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="indicadores" fill="#3b82f6" name="Indicadores" />
                    <Bar dataKey="indicados" fill="#10b981" name="Indicados" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cards de Empresas */}
              {stats.empresas.map((empresa) => (
                <Link
                  key={empresa.id}
                  href={`/dashboard/empresas/${empresa.slug}/dashboard`}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{empresa.nome}</h3>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: empresa.cor }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: empresa.cor }}>{empresa.stats.totalClientes}</p>
                      <p className="text-xs text-gray-600">Clientes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: empresa.cor }}>{empresa.stats.totalIndicadores}</p>
                      <p className="text-xs text-gray-600">Indicadores</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: empresa.cor }}>{empresa.stats.totalIndicados}</p>
                      <p className="text-xs text-gray-600">Indicados</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Links: <strong>{empresa.stats.totalLinks}</strong></span>
                    <span className="text-gray-600">Pontos: <strong>{empresa.stats.totalPontos}</strong></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top Indicadores e Indicações Recentes */}
        {!loadingStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Indicadores */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🏆 Top 10 Indicadores</h2>
              {stats.topIndicadores.length > 0 ? (
                <div className="space-y-3">
                  {stats.topIndicadores.map((indicador, index) => (
                    <div
                      key={indicador.cliente_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{indicador.nome}</p>
                          <p className="text-xs text-gray-600">{indicador.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">{indicador.total_indicacoes}</p>
                        <p className="text-xs text-gray-600">indicações</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum indicador ainda
                </div>
              )}
            </div>

            {/* Indicações Recentes */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🕒 Indicações Recentes</h2>
              {stats.indicacoesRecentes.length > 0 ? (
                <div className="space-y-3">
                  {stats.indicacoesRecentes.map((indicacao) => (
                    <div
                      key={indicacao.cliente_id}
                      className="p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{indicacao.nome}</p>
                          <p className="text-sm text-gray-600">{indicacao.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Indicado por: <span className="font-medium">{indicacao.indicador_nome || 'N/A'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(indicacao.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma indicação recente
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
