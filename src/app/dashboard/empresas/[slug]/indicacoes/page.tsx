'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getEmpresaBySlug } from '@/config/empresas.config';

interface Indicacao {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'indicado' | 'indicador';
  indicador_nome?: string;
  total_links?: number;
  total_indicados?: number;
}

interface IndicacoesStats {
  totalIndicacoes: number;
  totalIndicadores: number;
  totalIndicados: number;
}

export default function IndicacoesPage() {
  const params = useParams();
  const empresaSlug = params.slug as string;
  
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [filtro, setFiltro] = useState<'todos' | 'indicadores' | 'indicados'>('todos');
  const [busca, setBusca] = useState('');
  const [stats, setStats] = useState<IndicacoesStats>({
    totalIndicacoes: 0,
    totalIndicadores: 0,
    totalIndicados: 0,
  });

  const empresa = getEmpresaBySlug(empresaSlug);

  const fetchIndicacoes = useCallback(async (page: number) => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        tipo: filtro !== 'todos' ? filtro : '',
        busca: busca,
      });

      const response = await fetch(`/api/${empresaSlug}/indicacoes?${params}`);
      const data = await response.json();
      
      setIndicacoes(data.indicacoes || []);
      setTotalPaginas(data.paginacao?.total_paginas || 1);
      setTotalItens(data.paginacao?.total_itens || 0);
      
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar indicações:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaSlug, empresa, filtro, busca]);

  useEffect(() => {
    fetchIndicacoes(paginaAtual);
  }, [paginaAtual, fetchIndicacoes]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPaginaAtual(1);
    fetchIndicacoes(1);
  };

  const handleChangePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPaginas) {
      setPaginaAtual(newPage);
    }
  };

  if (!empresa) {
    return (
      <div className="p-8">
        <p className="text-red-600">Empresa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/empresas/${empresaSlug}/clientes`}
          className="text-gray-600 hover:text-gray-900 mb-2 inline-block"
        >
          ← Voltar
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Sistema de Indicações - {empresa.nome}
        </h1>
        <p className="text-gray-600 mt-1">
          Gerenciamento de indicadores e indicados
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderColor: empresa.cor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total no Sistema</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalIndicacoes}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${empresa.cor}20` }}>
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Indicadores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalIndicadores}</p>
              <p className="text-xs text-gray-500 mt-1">Com links gerados</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Indicados</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalIndicados}</p>
              <p className="text-xs text-gray-500 mt-1">Cadastrados via link</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎁</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleBuscar} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Campo de busca */}
            <div className="flex-1">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de tipo */}
            <div className="w-full sm:w-48">
              <select
                value={filtro}
                onChange={(e) => {
                  setFiltro(e.target.value as any);
                  setPaginaAtual(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="indicadores">Indicadores</option>
                <option value="indicados">Indicados</option>
              </select>
            </div>

            {/* Botão de buscar */}
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Indicações */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : indicacoes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma indicação encontrada
                  </td>
                </tr>
              ) : (
                indicacoes.map((indicacao) => (
                  <tr key={indicacao.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{indicacao.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600 text-sm">{indicacao.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {indicacao.tipo === 'indicador' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          👥 Indicador
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🎁 Indicado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {indicacao.tipo === 'indicador' ? (
                        <div className="text-sm text-gray-600">
                          <div>{indicacao.total_links || 0} links gerados</div>
                          <div className="text-xs text-gray-500">{indicacao.total_indicados || 0} indicados</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {indicacao.indicador_nome ? (
                            <div className="text-xs">Indicado por: <span className="font-medium">{indicacao.indicador_nome}</span></div>
                          ) : (
                            <div className="text-xs text-gray-400">-</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/empresas/${empresaSlug}/clientes/${indicacao.id}`}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                      >
                        Ver detalhes →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {!loading && totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {indicacoes.length} de {totalItens} indicações
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChangePage(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handleChangePage(page)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        page === paginaAtual
                          ? 'bg-purple-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleChangePage(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
