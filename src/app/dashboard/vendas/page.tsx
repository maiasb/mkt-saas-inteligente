'use client';

import { useState, useEffect, useCallback } from 'react';

interface Venda {
  codigo: number;
  localizador: string;
  data_hora: string;
  status: string;
  status_desc: string;
  idorigem: string | null;
  cod_local_venda: number;
  local_venda: string;
  nome_titular: string;
  email_titular: string;
  total_liquido: number;
  pedido_de_cancelamento: boolean;
  quantidade: number;
  formas_pag_desc: string;
  data?: string;
  hora?: string;
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estabelecimento, setEstabelecimento] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [alertaAberto, setAlertaAberto] = useState(false);
  const [alertaMensagem, setAlertaMensagem] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('');
  const [formaPagamentoFiltro, setFormaPagamentoFiltro] = useState<string>('');

  const carregarVendas = useCallback(async () => {
    // Valida se o estabelecimento foi selecionado
    if (!estabelecimento) {
      setError('Por favor, selecione um estabelecimento antes de buscar.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (estabelecimento) params.append('estabelecOrig', estabelecimento);
      // Removido limit para obter todos os registros
      if (dataInicio) params.append('dataVendaInit', dataInicio);
      if (dataFim) params.append('dataVendaFim', dataFim);

      const response = await fetch(`/api/limber-card/vendas?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar vendas');
      }

      const data = await response.json();
      
      // Ordenar por data (mais recentes primeiro)
      const vendasOrdenadas = data.sort((a: Venda, b: Venda) => {
        // Usar data_hora como fallback se data/hora não existirem
        const dataA = a.data && a.hora ? a.data : a.data_hora.split(' ')[0];
        const horaA = a.data && a.hora ? a.hora : a.data_hora.split(' ')[1];
        const [diaA, mesA, anoA] = dataA.split('/');
        const [horaANum, minA, segA] = horaA.split(':');
        const dataHoraA = new Date(parseInt(anoA), parseInt(mesA) - 1, parseInt(diaA), parseInt(horaANum), parseInt(minA), parseInt(segA || '0'));
        
        const dataB = b.data && b.hora ? b.data : b.data_hora.split(' ')[0];
        const horaB = b.data && b.hora ? b.hora : b.data_hora.split(' ')[1];
        const [diaB, mesB, anoB] = dataB.split('/');
        const [horaBNum, minB, segB] = horaB.split(':');
        const dataHoraB = new Date(parseInt(anoB), parseInt(mesB) - 1, parseInt(diaB), parseInt(horaBNum), parseInt(minB), parseInt(segB || '0'));
        
        return dataHoraB.getTime() - dataHoraA.getTime(); // Decrescente
      });
      
      setVendas(vendasOrdenadas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [estabelecimento, dataInicio, dataFim]);

  useEffect(() => {
    // Não carrega vendas automaticamente
  }, []);

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
  
  // Aplicar filtros de status e forma de pagamento
  const vendasFiltradas = vendas.filter(venda => {
    const statusMatch = !statusFiltro || venda.status === statusFiltro;
    const formaPagMatch = !formaPagamentoFiltro || venda.formas_pag_desc?.toLowerCase().includes(formaPagamentoFiltro.toLowerCase());
    return statusMatch && formaPagMatch;
  });
  
  const vendasPaginadas = vendasFiltradas.slice(indiceInicial, indiceFinal);

  // Obter opções únicas de formas de pagamento
  const formasPagamentoUnicas = Array.from(new Set(
    vendas
      .map(v => v.formas_pag_desc)
      .filter(Boolean)
      .flatMap(forma => forma.split(',').map(f => f.trim()))
  )).sort();

  const irParaPagina = (pagina: number) => {
    setPaginaAtual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gerar números de páginas para paginação inteligente
  const gerarPaginas = () => {
    const paginas: (number | string)[] = [];
    const delta = 2; // Quantas páginas mostrar ao redor da atual
    
    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 || // Primeira página
        i === totalPaginas || // Última página
        (i >= paginaAtual - delta && i <= paginaAtual + delta) // Páginas ao redor da atual
      ) {
        paginas.push(i);
      } else if (
        paginas[paginas.length - 1] !== '...' // Evita adicionar múltiplos "..."
      ) {
        paginas.push('...');
      }
    }
    
    return paginas;
  };

  const abrirDetalhes = async (codigoVenda: number) => {
    try {
      setLoadingDetalhes(true);
      setModalAberto(true);
      
      const response = await fetch(`/api/limber-card/vendas/${codigoVenda}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes da venda');
      }

      const detalhes = await response.json();
      setVendaSelecionada(detalhes);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      alert('Erro ao carregar detalhes da venda');
      setModalAberto(false);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setVendaSelecionada(null);
  };

  return (
    <>
      <div className="space-y-4 lg:space-y-6 p-4 lg:p-8 pt-20 xl:pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Vendas</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
        <h2 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Estabelecimento
            </label>
            <select
              value={estabelecimento}
              onChange={(e) => setEstabelecimento(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecione um estabelecimento</option>
              <option value="2360">2360 - Ecommerce Guará Acqua Park</option>
              <option value="2361">2361 - Guará Acqua Park</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Data da Venda (Início)
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Data da Venda (Fim)
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => {
                if (!estabelecimento) {
                  setAlertaMensagem('Por favor, selecione um estabelecimento antes de buscar as vendas!');
                  setAlertaAberto(true);
                  return;
                }
                carregarVendas();
                setPaginaAtual(1); // Reset para primeira página ao atualizar
              }}
              disabled={loading}
              className="w-full px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>
        </div>
        
        {/* Filtros Rápidos - Status e Forma de Pagamento */}
        {vendas.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* Filtro de Status */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Filtrar por Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setStatusFiltro('');
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                    statusFiltro === '' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos ({vendas.length})
                </button>
                <button
                  onClick={() => {
                    setStatusFiltro('A');
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                    statusFiltro === 'A' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  ✓ Aprovadas ({vendas.filter(v => v.status === 'A').length})
                </button>
                <button
                  onClick={() => {
                    setStatusFiltro('X');
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                    statusFiltro === 'X' 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  ✕ Canceladas ({vendas.filter(v => v.status === 'X').length})
                </button>
                <button
                  onClick={() => {
                    setStatusFiltro('R');
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                    statusFiltro === 'R' 
                      ? 'bg-yellow-600 text-white shadow-md' 
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  ⏳ Reservadas ({vendas.filter(v => v.status === 'R').length})
                </button>
              </div>
            </div>

            {/* Filtro de Forma de Pagamento */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Filtrar por Forma de Pagamento
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setFormaPagamentoFiltro('');
                    setPaginaAtual(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                    formaPagamentoFiltro === '' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                {formasPagamentoUnicas.map(forma => (
                  <button
                    key={forma}
                    onClick={() => {
                      setFormaPagamentoFiltro(forma);
                      setPaginaAtual(1);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                      formaPagamentoFiltro === forma 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {forma} ({vendas.filter(v => v.formas_pag_desc?.includes(forma)).length})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {!loading && !error && vendas.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total {statusFiltro || formaPagamentoFiltro ? '(Filtrado)' : ''}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 truncate">{vendasFiltradas.length}</p>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl ml-2">📊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Aprovadas</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
                  {vendasFiltradas.filter(v => v.status === 'A').length}
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
                  {vendasFiltradas.filter(v => v.status === 'X').length}
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
                    vendasFiltradas.reduce((acc, v) => acc + v.total_liquido, 0)
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
                    <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Ações
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
                        <div className="text-sm text-gray-900 truncate">{venda.nome_titular || '-'}</div>
                        <div className="text-xs text-gray-500 truncate">{venda.email_titular || '-'}</div>
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
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => abrirDetalhes(venda.codigo)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Ver Detalhes
                        </button>
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
                    <span className="font-medium text-gray-900 truncate ml-2">{venda.nome_titular || '-'}</span>
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
                
                <button
                  onClick={() => abrirDetalhes(venda.codigo)}
                  className="mt-3 w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                >
                  Ver Detalhes
                </button>
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
                  
                  {gerarPaginas().map((pagina, index) => {
                    if (pagina === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={pagina}
                        onClick={() => irParaPagina(pagina as number)}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg ${
                          paginaAtual === pagina
                            ? 'bg-purple-500 text-white font-semibold'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pagina}
                      </button>
                    );
                  })}
                  
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
          <div className="text-6xl mb-4">{estabelecimento ? '📭' : '🔍'}</div>
          <p className="text-gray-600 text-lg">
            {estabelecimento 
              ? 'Nenhuma venda encontrada' 
              : 'Selecione um estabelecimento e clique em "Atualizar" para buscar as vendas'
            }
          </p>
        </div>
      )}

      {/* Modal de Detalhes */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Detalhes da Venda</h2>
              <button
                onClick={fecharModal}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 sm:p-6">
              {loadingDetalhes ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  <p className="mt-4 text-gray-600">Carregando detalhes...</p>
                </div>
              ) : vendaSelecionada ? (
                <div className="space-y-6">
                  {/* Informações Principais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Localizador</p>
                      <p className="text-lg font-bold text-gray-900">{vendaSelecionada.localizador}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Código</p>
                      <p className="text-lg font-bold text-gray-900">#{vendaSelecionada.codigo}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Data/Hora</p>
                      <p className="text-lg font-semibold text-gray-900">{vendaSelecionada.data_hora}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${getStatusColor(vendaSelecionada.status)}`}>
                        {vendaSelecionada.status_desc}
                      </span>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Cliente</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Nome</p>
                        <p className="text-base font-medium text-gray-900">{vendaSelecionada.nome_titular || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.email_titular || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Documento</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.doc_titular || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Telefone</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.fone_titular || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data de Nascimento</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.nascimento_titular || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">IP do Comprador</p>
                        <p className="text-base text-gray-900 font-mono text-xs">{vendaSelecionada.ip_comprador || '-'}</p>
                      </div>
                    </div>
                    
                    {/* Endereço */}
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Endereço</p>
                      <p className="text-sm text-gray-900">
                        {vendaSelecionada.endereco_f || '-'}
                        {vendaSelecionada.numero_f && `, ${vendaSelecionada.numero_f}`}
                        {vendaSelecionada.bairro_f && ` - ${vendaSelecionada.bairro_f}`}
                        {(vendaSelecionada.endereco_f || vendaSelecionada.numero_f || vendaSelecionada.bairro_f) && <br />}
                        {vendaSelecionada.municipio_f || '-'}
                        {vendaSelecionada.estado_f && ` - ${vendaSelecionada.estado_f}`}
                        {vendaSelecionada.codigo_postal_f && ` | CEP: ${vendaSelecionada.codigo_postal_f}`}
                      </p>
                    </div>
                  </div>

                  {/* Venda */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 Informações da Venda</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-xs text-purple-600 mb-1">Quantidade</p>
                        <p className="text-2xl font-bold text-purple-700">{vendaSelecionada.quantidade}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-xs text-green-600 mb-1">Valor Total</p>
                        <p className="text-2xl font-bold text-green-700">{formatarMoeda(vendaSelecionada.total_liquido)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">Pagamento</p>
                        <p className="text-base font-semibold text-blue-700">{vendaSelecionada.formas_pag_desc || 'Pix'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Origem</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.origem_venda || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vendedor</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.usuario_venda || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data de Inclusão</p>
                        <p className="text-base text-gray-900">
                          {vendaSelecionada.data_hora_inc ? new Date(vendaSelecionada.data_hora_inc).toLocaleString('pt-BR') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cupom</p>
                        <p className="text-base font-semibold text-green-700">{vendaSelecionada.cupom_desc || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pagamento PIX */}
                  {vendaSelecionada.payment_id_pix && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Pagamento PIX</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">ID do Pagamento</p>
                          <p className="text-sm font-mono text-gray-900 break-all">{vendaSelecionada.payment_id_pix || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
                            {vendaSelecionada.status_pix || 'CONCLUÍDA'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">QR Code PIX</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs font-mono text-gray-700 break-all">{vendaSelecionada.qrcode_pix || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estabelecimento */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Estabelecimento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Local de Venda</p>
                        <p className="text-base font-medium text-gray-900">{vendaSelecionada.nome_local_venda || vendaSelecionada.local_venda || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Código</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.local_venda || vendaSelecionada.cod_local_venda || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ponto de Venda</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.ponto_venda || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">CNPJ</p>
                        <p className="text-base text-gray-900">{vendaSelecionada.cnpj_estabelec || '-'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">URL da Origem</p>
                        {vendaSelecionada.ec_origem_url ? (
                          <a 
                            href={vendaSelecionada.ec_origem_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {vendaSelecionada.ec_origem_url}
                          </a>
                        ) : (
                          <p className="text-base text-gray-900">-</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  {vendaSelecionada.bilhetes && vendaSelecionada.bilhetes.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎟️ Bilhetes</h3>
                      <div className="space-y-2">
                        {vendaSelecionada.bilhetes.map((bilhete: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{bilhete.nome}</p>
                              <p className="text-sm text-gray-500">Quantidade: {bilhete.quantidade}</p>
                            </div>
                            <p className="font-semibold text-gray-900">{formatarMoeda(bilhete.valor)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-12">Erro ao carregar detalhes</p>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="sticky bottom-0 bg-gray-50 p-4 sm:p-6 flex justify-end border-t">
              <button
                onClick={fecharModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Alerta Customizado */}
      {alertaAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scale-in">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative">
                <div className="inline-block p-4 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">Atenção!</h3>
              </div>
            </div>
            
            {/* Corpo do alerta */}
            <div className="p-8">
              <p className="text-gray-700 text-center text-lg mb-6 leading-relaxed">
                {alertaMensagem}
              </p>
              <button
                onClick={() => setAlertaAberto(false)}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-300"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
