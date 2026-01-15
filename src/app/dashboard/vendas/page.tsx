'use client';

import { useState, useEffect, useCallback } from 'react';

interface Venda {
  localizador: string;
  codigo: number;
  data_hora: string;
  status: string;
  idorigem: string | null;
  cod_local_venda: number;
  local_venda: string;
  ec_origem: number;
  nome_titular: string;
  email_titular: string;
  total_liquido: number;
  pedido_de_cancelamento: any;
  quantidade: number;
  formas_pag_desc?: string;
  data: string;
  hora: string;
  status_desc: string;
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estabelecimento, setEstabelecimento] = useState('2360'); // Guará Acqua Park
  const [limit, setLimit] = useState('50');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  const carregarVendas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (estabelecimento) params.append('estabelecOrig', estabelecimento);
      if (limit) params.append('limit', limit);

      const response = await fetch(`/api/limber-card/vendas?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar vendas');
      }

      const data = await response.json();
      setVendas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [estabelecimento, limit]);

  useEffect(() => {
    carregarVendas();
    setPaginaAtual(1); // Reset pagination on filter change
  }, [carregarVendas]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'X':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  // Paginação
  const totalPaginas = Math.ceil(vendas.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const vendasPaginadas = vendas.slice(indiceInicial, indiceFinal);

  const irParaPagina = (pagina: number) => {
    setPaginaAtual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-0 pt-20 xl:pt-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 text-white">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">💳 Gerenciamento de Vendas</h1>
        <p className="text-sm sm:text-base text-purple-100">Plataforma Limber Card - Vendas Online</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
        <h2 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Estabelecimento
            </label>
            <input
              type="text"
              value={estabelecimento}
              onChange={(e) => setEstabelecimento(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Código"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Limite
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={carregarVendas}
              disabled={loading}
              className="w-full px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {!loading && !error && vendas.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 truncate">{vendas.length}</p>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl ml-2">📊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Aprovadas</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
                  {vendas.filter(v => v.status === 'A').length}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl ml-2">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Canceladas</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 truncate">
                  {vendas.filter(v => v.status === 'X').length}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl ml-2">❌</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Valor Total</p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-purple-600 truncate">
                  {formatarMoeda(
                    vendas
                      .filter(v => v.status === 'A')
                      .reduce((acc, v) => acc + v.total_liquido, 0)
                  )}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl ml-2">💰</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando vendas...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">❌ {error}</p>
        </div>
      )}

      {/* Lista de Vendas */}
      {!loading && !error && vendas.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Localizador
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Data/Hora
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Cliente
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Qtd
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Valor
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Pagamento
                    </th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendasPaginadas.map((venda) => (
                    <tr key={venda.codigo} className="hover:bg-gray-50">
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {venda.localizador}
                        </div>
                        <div className="text-xs text-gray-500">#{venda.codigo}</div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{venda.data}</div>
                        <div className="text-xs text-gray-500">{venda.hora}</div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 max-w-[200px]">
                        <div className="text-sm text-gray-900 truncate">{venda.nome_titular}</div>
                        <div className="text-xs text-gray-500 truncate">{venda.email_titular}</div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {venda.quantidade}
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatarMoeda(venda.total_liquido)}
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {venda.formas_pag_desc || '-'}
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                            venda.status
                          )}`}
                        >
                          {venda.status_desc}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Cards */}
          <div className="lg:hidden space-y-3">
            {vendasPaginadas.map((venda) => (
              <div key={venda.codigo} className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{venda.localizador}</div>
                    <div className="text-xs text-gray-500">#{venda.codigo}</div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                      venda.status
                    )}`}
                  >
                    {venda.status === 'A' ? '✅' : '❌'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{venda.nome_titular}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data:</span>
                    <span className="text-gray-900">{venda.data} {venda.hora}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Qtd:</span>
                    <span className="text-gray-900">{venda.quantidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor:</span>
                    <span className="font-semibold text-gray-900">{formatarMoeda(venda.total_liquido)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pagamento:</span>
                    <span className="text-gray-900">{venda.formas_pag_desc || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, vendas.length)} de {vendas.length}
                </div>
                
                <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => irParaPagina(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 whitespace-nowrap"
                  >
                    ← Anterior
                  </button>
                  
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() => irParaPagina(pagina)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg ${
                        paginaAtual === pagina
                          ? 'bg-purple-500 text-white font-semibold'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pagina}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => irParaPagina(paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 whitespace-nowrap"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sem resultados */}
      {!loading && !error && vendas.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">Nenhuma venda encontrada</p>
        </div>
      )}
    </div>
  );
}
