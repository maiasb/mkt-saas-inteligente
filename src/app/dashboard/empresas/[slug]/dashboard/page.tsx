'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEmpresa } from '@/hooks/useEmpresa';

interface DashboardData {
  resumo: {
    totalClientes: number;
    totalIndicadores: number;
    totalIndicados: number;
    totalLinks: number;
    totalPontos: number;
  };
  indicacoesRecentes: Array<{
    cliente_id: string;
    nome: string;
    email: string;
    created_at: string;
    indicador_nome: string;
  }>;
  topIndicadores: Array<{
    cliente_id: string;
    nome: string;
    email: string;
    total_indicacoes: number;
  }>;
}

export default function EmpresaDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState<DashboardData | null>(null);

  const { empresa, carregandoEmpresa } = useEmpresa(slug);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setErro('');
        
        const response = await fetch(`/api/empresas/${slug}/dashboard`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do dashboard');
        }
        
        const data = await response.json();
        setDados(data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        setErro('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [slug]);

  if (carregandoEmpresa) {
    return <div className="p-8 text-gray-600">Carregando...</div>;
  }

  if (!empresa) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Empresa não encontrada
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{erro}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: empresa.cor }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
        <div className="text-center text-gray-500">Nenhum dado disponível</div>
      </div>
    );
  }

  const { resumo, indicacoesRecentes, topIndicadores } = dados;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard - {empresa.nome}</h1>
        <p className="text-gray-600 mt-2">Resumo geral do programa de indicações</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4" style={{ borderColor: empresa.cor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Clientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{resumo.totalClientes}</p>
            </div>
            <span className="text-4xl">👥</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Indicadores</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{resumo.totalIndicadores}</p>
            </div>
            <span className="text-4xl">🎯</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Indicados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{resumo.totalIndicados}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Links Ativos</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{resumo.totalLinks}</p>
            </div>
            <span className="text-4xl">🔗</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Pontos</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{resumo.totalPontos}</p>
            </div>
            <span className="text-4xl">⭐</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Indicadores */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🏆 Top Indicadores</h2>
            <Link
              href={`/dashboard/empresas/${slug}/clientes?tipo=indicadores`}
              className="text-sm font-medium hover:underline"
              style={{ color: empresa.cor }}
            >
              Ver todos
            </Link>
          </div>
          {topIndicadores && topIndicadores.length > 0 ? (
            <div className="space-y-3">
              {topIndicadores.map((indicador, index) => (
                <Link
                  key={indicador.cliente_id}
                  href={`/dashboard/empresas/${slug}/clientes/${indicador.cliente_id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition"
                  style={{ backgroundColor: `${empresa.cor}05` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: empresa.cor }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{indicador.nome}</p>
                      <p className="text-sm text-gray-600">{indicador.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: empresa.cor }}>
                      {indicador.total_indicacoes}
                    </p>
                    <p className="text-xs text-gray-600">indicações</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum indicador ainda
            </div>
          )}
        </div>

        {/* Indicações Recentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🕒 Indicações Recentes</h2>
            <Link
              href={`/dashboard/empresas/${slug}/indicacoes`}
              className="text-sm font-medium hover:underline"
              style={{ color: empresa.cor }}
            >
              Ver todas
            </Link>
          </div>
          {indicacoesRecentes && indicacoesRecentes.length > 0 ? (
            <div className="space-y-3">
              {indicacoesRecentes.map((indicacao) => (
                <div
                  key={indicacao.cliente_id}
                  className="p-4 rounded-lg border border-gray-200"
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
                          month: '2-digit',
                          year: 'numeric'
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

      {/* Ações Rápidas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/dashboard/empresas/${slug}/clientes`}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-center"
        >
          <span className="text-4xl mb-2 block">👥</span>
          <h3 className="font-bold text-gray-900">Ver Clientes</h3>
          <p className="text-sm text-gray-600 mt-1">Gerenciar todos os clientes</p>
        </Link>

        <Link
          href={`/dashboard/empresas/${slug}/indicacoes`}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-center"
        >
          <span className="text-4xl mb-2 block">📊</span>
          <h3 className="font-bold text-gray-900">Ver Indicações</h3>
          <p className="text-sm text-gray-600 mt-1">Acompanhar indicações</p>
        </Link>

        <Link
          href={`/dashboard/empresas/${slug}/clientes`}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-center"
        >
          <span className="text-4xl mb-2 block">🔗</span>
          <h3 className="font-bold text-gray-900">Gerar Links</h3>
          <p className="text-sm text-gray-600 mt-1">Criar novos links de indicação</p>
        </Link>
      </div>
    </div>
  );
}
