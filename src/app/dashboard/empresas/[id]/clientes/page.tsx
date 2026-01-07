'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresaId: string;
  links?: Array<{
    id: string;
    codigo: string;
    url: string;
  }>;
}

export default function ClientesPage() {
  const router = useRouter();
  const params = useParams();
  const empresaId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [empresaNome, setEmpresaNome] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
  });

  const fetchEmpresa = useCallback(async () => {
    try {
      const response = await fetch('/api/empresas');
      const empresas = await response.json();
      const empresa = empresas.find((e: any) => e.id === empresaId);
      if (empresa) {
        setEmpresaNome(empresa.nome);
      }
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
    }
  }, [empresaId]);

  const fetchClientes = useCallback(async () => {
    try {
      const response = await fetch(`/api/empresas/${empresaId}/clientes`);
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }, [empresaId]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchEmpresa();
    fetchClientes();
    setIsLoading(false);
  }, [router, empresaId, fetchEmpresa, fetchClientes]);

  const handleAddCliente = async () => {
    if (!novoCliente.nome || !novoCliente.email) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      const response = await fetch(`/api/empresas/${empresaId}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao criar cliente');
        return;
      }

      await fetchClientes();
      setShowModal(false);
      setNovoCliente({ nome: '', email: '', telefone: '' });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert('Erro ao criar cliente');
    }
  };

  const handleDeleteCliente = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const response = await fetch(`/api/empresas/${empresaId}/clientes?clienteId=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Erro ao excluir cliente');
        return;
      }

      await fetchClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedCliente) return;

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: selectedCliente.id }),
      });

      if (!response.ok) {
        alert('Erro ao gerar link');
        return;
      }

      await fetchClientes();
      setShowLinkModal(false);
      setSelectedCliente(null);
      alert('Link gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link');
    }
  };

  const openLinkModal = async (cliente: Cliente) => {
    // Buscar links deste cliente
    try {
      const response = await fetch('/api/links');
      const allLinks = await response.json();
      const clienteLinks = allLinks.filter((link: any) => link.cliente_id === cliente.id);
      
      setSelectedCliente({ ...cliente, links: clienteLinks });
      setShowLinkModal(true);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      alert('Erro ao carregar links');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/empresas" className="text-gray-600 hover:text-gray-900">
                ← Voltar
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                <p className="text-sm text-gray-600">{empresaNome}</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
            >
              + Novo Cliente
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {clientes.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">Nenhum cliente cadastrado ainda.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition"
            >
              Cadastrar Primeiro Cliente
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
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
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link 
                          href={`/dashboard/empresas/${empresaId}/clientes/${cliente.id}`}
                          className="text-purple-600 hover:text-purple-900 hover:underline"
                        >
                          {cliente.nome}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.telefone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openLinkModal(cliente)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Links
                          </button>
                          <button
                            onClick={() => handleDeleteCliente(cliente.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {clientes.map((cliente) => (
                <div key={cliente.id} className="bg-white rounded-lg shadow p-4">
                  <div className="mb-3">
                    <Link 
                      href={`/dashboard/empresas/${empresaId}/clientes/${cliente.id}`}
                      className="text-lg font-medium text-purple-600 hover:text-purple-900"
                    >
                      {cliente.nome}
                    </Link>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Email:</span>
                      <span className="text-gray-900 flex-1 break-all">{cliente.email}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Telefone:</span>
                      <span className="text-gray-900">{cliente.telefone || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => openLinkModal(cliente)}
                      className="flex-1 bg-purple-100 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-200 transition text-sm font-medium"
                    >
                      Links
                    </button>
                    <button
                      onClick={() => handleDeleteCliente(cliente.id)}
                      className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Novo Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={novoCliente.email}
                  onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCliente}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Links */}
      {showLinkModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Links de {selectedCliente.nome}
            </h2>
            
            {selectedCliente.links && selectedCliente.links.length > 0 ? (
              <div className="space-y-4 mb-6">
                {selectedCliente.links.map((link) => (
                  <div key={link.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Código: {link.codigo}</p>
                        <p className="text-sm text-blue-600 break-all">{link.url}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(link.url);
                          alert('Link copiado!');
                        }}
                        className="ml-4 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mb-6">Nenhum link gerado ainda.</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedCliente(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Fechar
              </button>
              <button
                onClick={handleGenerateLink}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition"
              >
                + Gerar Novo Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
