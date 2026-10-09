'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEmpresa } from '@/hooks/useEmpresa';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
}

interface EmpresaStats {
  totalClientes: number;
  totalPontos: number;
  totalLinks: number;
}

export default function ClientesEmpresaPage() {
  const params = useParams();
  const empresaSlug = params.slug as string;
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteLinks, setClienteLinks] = useState<any[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: '', email: '', telefone: '', cpf: '' });
  const [isSavingCliente, setIsSavingCliente] = useState(false);

  const { empresa, carregandoEmpresa } = useEmpresa(empresaSlug);
  
  const fetchClientes = useCallback(async (page: number) => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/empresas/${empresaSlug}/clientes?page=${page}&limit=10`);
      const data = await response.json();
      setClientes(data.clientes || []);
      setTotalPaginas(data.paginacao?.total_paginas || 1);
      setTotalItens(data.paginacao?.total_itens || 0);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [empresaSlug, empresa]);

  useEffect(() => {
    fetchClientes(paginaAtual);
  }, [paginaAtual, fetchClientes]);

  const openLinkModal = async (cliente: Cliente) => {
    setIsLoadingLinks(true);
    try {
      const response = await fetch(`/api/empresas/${empresaSlug}/clientes/${cliente.id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar links');
      }
      
      const data = await response.json();
      
      setSelectedCliente(cliente);
      setClienteLinks(Array.isArray(data.links) ? data.links : []);
      setShowLinkModal(true);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      alert('Erro ao carregar links. Tente novamente.');
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleGerarLink = async () => {
    if (!selectedCliente || !empresa || isGeneratingLink) return;

    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clienteId: selectedCliente.id,
          empresaId: empresa.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error?.error || 'Erro ao gerar link');
        return;
      }

      // Recarrega os links do cliente
      const linksResponse = await fetch(`/api/empresas/${empresaSlug}/clientes/${selectedCliente.id}`);
      
      if (linksResponse.ok) {
        const data = await linksResponse.json();
        setClienteLinks(Array.isArray(data.links) ? data.links : []);
      }
      
      alert('Link gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link. Tente novamente.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCriarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCliente) return;

    setIsSavingCliente(true);
    try {
      const response = await fetch(`/api/empresas/${empresaSlug}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error?.error || 'Erro ao cadastrar cliente');
        return;
      }

      setNovoCliente({ nome: '', email: '', telefone: '', cpf: '' });
      setShowNovoCliente(false);
      await fetchClientes(paginaAtual);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      alert('Erro ao cadastrar cliente. Tente novamente.');
    } finally {
      setIsSavingCliente(false);
    }
  };

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
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="mb-8 xl:ml-0 ml-14">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton - Desktop */}
        <div className="hidden xl:block bg-white rounded-lg shadow overflow-hidden">
          <div className="animate-pulse">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-3 flex gap-4">
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            {/* Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-t border-gray-200 flex gap-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards Skeleton - Mobile */}
        <div className="xl:hidden space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Todos os Clientes</h1>
        <p className="text-gray-600 mt-1">
          Lista completa de clientes da {empresa.nome}
        </p>
        <button
          onClick={() => setShowNovoCliente(!showNovoCliente)}
          className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: empresa.cor }}
        >
          {showNovoCliente ? 'Cancelar' : 'Novo cliente'}
        </button>
      </div>

      {showNovoCliente && (
        <form onSubmit={handleCriarCliente} className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Nome"
            value={novoCliente.nome}
            onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={novoCliente.email}
            onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <input
            placeholder="Telefone"
            value={novoCliente.telefone}
            onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <input
            placeholder="CPF"
            value={novoCliente.cpf}
            onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={isSavingCliente}
            className="sm:col-span-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: empresa.cor }}
          >
            {isSavingCliente ? 'Salvando...' : 'Cadastrar cliente'}
          </button>
        </form>
      )}


      {/* Main Content */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-2 h-8 rounded"
            style={{ backgroundColor: empresa.cor }}
          />
          <div>
            <p className="text-lg font-semibold" style={{ color: empresa.cor }}>
              Listagem de Clientes
            </p>
            <p className="text-sm text-gray-600">
              {totalItens} cliente{totalItens !== 1 ? 's' : ''} cadastrado{totalItens !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {clientes.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">Nenhum cliente cadastrado ainda.</p>
            <p className="text-sm text-gray-500 mt-2">
              Use o botão Novo cliente para cadastrar o primeiro.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden xl:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientes.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cliente.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.telefone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === cliente.id ? null : cliente.id)}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition"
                              style={{ color: empresa.cor }}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {openDropdownId === cliente.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setOpenDropdownId(null)}
                                />
                                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                  <div className="py-1">
                                    <Link
                                      href={`/dashboard/empresas/${empresaSlug}/clientes/${cliente.id}`}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                      onClick={() => setOpenDropdownId(null)}
                                    >
                                      <span>👁️</span>
                                      Ver Detalhes
                                    </Link>
                                    <button
                                      onClick={() => {
                                        openLinkModal(cliente);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <span>🔗</span>
                                      Ver Links
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="xl:hidden space-y-4">
              {clientes.map((cliente) => (
                <div key={cliente.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-lg font-medium text-gray-900">
                      {cliente.nome}
                    </p>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === cliente.id ? null : cliente.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition"
                        style={{ color: empresa.cor }}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openDropdownId === cliente.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <Link
                                href={`/dashboard/empresas/${empresaSlug}/clientes/${cliente.id}`}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => setOpenDropdownId(null)}
                              >
                                <span>👁️</span>
                                Ver Detalhes
                              </Link>
                              <button
                                onClick={() => {
                                  openLinkModal(cliente);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <span>🔗</span>
                                Ver Links
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Email:</span>
                      <span className="text-gray-900 flex-1 break-all">{cliente.email || '-'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Telefone:</span>
                      <span className="text-gray-900">{cliente.telefone || '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="mt-6 bg-white px-4 sm:px-6 py-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Mostrando <span className="font-medium">{Math.min((paginaAtual - 1) * 10 + 1, totalItens)}</span> até{' '}
                <span className="font-medium">{Math.min(paginaAtual * 10, totalItens)}</span> de{' '}
                <span className="font-medium">{totalItens}</span> clientes
              </div>
              <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setPaginaAtual(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  className="px-2 sm:px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  style={{
                    backgroundColor: paginaAtual === 1 ? '#e5e7eb' : `${empresa.cor}15`,
                    color: paginaAtual === 1 ? '#9ca3af' : empresa.cor,
                  }}
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1 sm:gap-2">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum;
                    if (totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (paginaAtual <= 3) {
                      pageNum = i + 1;
                    } else if (paginaAtual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i;
                    } else {
                      pageNum = paginaAtual - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPaginaAtual(pageNum)}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition font-medium text-xs sm:text-base"
                        style={{
                          backgroundColor: paginaAtual === pageNum ? empresa.cor : `${empresa.cor}15`,
                          color: paginaAtual === pageNum ? 'white' : empresa.cor,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPaginaAtual(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  className="px-2 sm:px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  style={{
                    backgroundColor: paginaAtual === totalPaginas ? '#e5e7eb' : `${empresa.cor}15`,
                    color: paginaAtual === totalPaginas ? '#9ca3af' : empresa.cor,
                  }}
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Links */}
      {showLinkModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {isLoadingLinks ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando links...</p>
              </div>
            ) : (
              <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Links de {selectedCliente.nome}
              </h2>
              <button
                onClick={handleGerarLink}
                disabled={isGeneratingLink}
                className="px-4 py-2 rounded-lg transition text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: empresa.cor }}
              >
                {isGeneratingLink ? 'Gerando...' : '+ Gerar Link'}
              </button>
            </div>
            
            {clienteLinks.length > 0 ? (
              <div className="space-y-4 mb-6">
                {clienteLinks.map((link: any) => (
                  <div key={link.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <p className="text-sm text-gray-600 mb-1">Código: {link.codigo}</p>
                        <p className="text-sm break-all" style={{ color: empresa.cor }}>
                          {link.url}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(link.url);
                          alert('Link copiado!');
                        }}
                        className="px-4 py-2 rounded-lg transition whitespace-nowrap text-white"
                        style={{ backgroundColor: empresa.cor }}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Nenhum link gerado ainda.</p>
                <button
                  onClick={handleGerarLink}
                  disabled={isGeneratingLink}
                  className="px-6 py-3 rounded-lg transition text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: empresa.cor }}
                >
                  {isGeneratingLink ? 'Gerando...' : 'Gerar Primeiro Link'}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowLinkModal(false);
                setSelectedCliente(null);
              }}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition mt-4"
            >
              Fechar
            </button>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
