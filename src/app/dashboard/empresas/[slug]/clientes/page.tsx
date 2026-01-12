'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getEmpresaBySlug } from '@/config/empresas.config';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
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

  const empresa = getEmpresaBySlug(empresaSlug);

  const fetchClientes = useCallback(async (page: number) => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/${empresaSlug}/clientes?page=${page}&limit=10`);
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
  }, [paginaAtual]);

  const openLinkModal = async (cliente: Cliente) => {
    try {
      const response = await fetch(`/api/${empresaSlug}/clientes/${cliente.id}`);
      const data = await response.json();
      
      setSelectedCliente(cliente);
      setClienteLinks(data.links || []);
      setShowLinkModal(true);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      alert('Erro ao carregar links');
    }
  };

  const handleGerarLink = async () => {
    if (!selectedCliente || !empresa) return;

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clienteId: selectedCliente.id,
          empresaId: empresa.id,
          empresaSlug: empresa.slug
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao gerar link');
        return;
      }

      // Recarrega os links do cliente
      const linksResponse = await fetch(`/api/${empresaSlug}/clientes/${selectedCliente.id}`);
      const data = await linksResponse.json();
      setClienteLinks(data.links || []);
      
      alert('Link gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link');
    }
  };

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
      <div className="p-8">
        <div className="text-center">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 xl:ml-0 ml-14">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard/empresas" className="text-gray-600 hover:text-gray-900">
            ← Voltar
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</h1>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="w-2 h-8 rounded"
            style={{ backgroundColor: empresa.cor }}
          />
          <div>
            <p className="text-lg font-semibold" style={{ color: empresa.cor }}>
              {empresa.nome}
            </p>
            <p className="text-sm text-gray-600">
              Clientes gerenciados manualmente
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {clientes.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">Nenhum cliente cadastrado ainda.</p>
            <p className="text-sm text-gray-500 mt-2">
              Adicione clientes manualmente no banco de dados para a empresa ID: <code className="bg-gray-200 px-2 py-1 rounded">{empresa.id}</code>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Links
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detalhes
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => openLinkModal(cliente)}
                            className="font-medium hover:underline"
                            style={{ color: empresa.cor }}
                          >
                            Ver Links
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/dashboard/empresas/${empresaSlug}/clientes/${cliente.id}`}
                            className="font-medium hover:underline"
                            style={{ color: empresa.cor }}
                          >
                            Ver Detalhes
                          </Link>
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
                  <div className="mb-3">
                    <p className="text-lg font-medium text-gray-900">
                      {cliente.nome}
                    </p>
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
                  <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => openLinkModal(cliente)}
                      className="flex-1 py-2 px-4 rounded-lg transition text-sm font-medium"
                      style={{ 
                        backgroundColor: `${empresa.cor}15`,
                        color: empresa.cor
                      }}
                    >
                      Ver Links
                    </button>
                    <Link
                      href={`/dashboard/empresas/${empresaSlug}/clientes/${cliente.id}`}
                      className="flex-1 py-2 px-4 rounded-lg transition text-sm font-medium text-center"
                      style={{ 
                        backgroundColor: `${empresa.cor}15`,
                        color: empresa.cor
                      }}
                    >
                      Detalhes
                    </Link>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Links de {selectedCliente.nome}
              </h2>
              <button
                onClick={handleGerarLink}
                className="px-4 py-2 rounded-lg transition text-white font-medium"
                style={{ backgroundColor: empresa.cor }}
              >
                + Gerar Link
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
                  className="px-6 py-3 rounded-lg transition text-white font-medium"
                  style={{ backgroundColor: empresa.cor }}
                >
                  Gerar Primeiro Link
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
          </div>
        </div>
      )}
    </div>
  );
}
