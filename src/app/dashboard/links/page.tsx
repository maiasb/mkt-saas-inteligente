'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LinkType {
  id: string;
  empresa_id: string;
  cliente_id?: string;
  url: string;
  codigo: string;
  ativo: boolean;
  created_at: string;
  empresa_nome: string;
  cliente_nome?: string;
  usuarios_indicados_count?: number;
}

export default function LinksPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchEmpresas();
    fetchLinks();
    setIsLoading(false);
  }, [router]);

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas');
      const data = await response.json();
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      const data = await response.json();
      setLinks(data);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
    }
  };

  const handleGerarLink = async () => {
    if (!empresaSelecionada) {
      alert('Selecione uma empresa');
      return;
    }

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId: empresaSelecionada }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao gerar link');
        return;
      }

      await fetchLinks();
      setShowModal(false);
      setEmpresaSelecionada('');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return;

    try {
      const response = await fetch(`/api/links?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Erro ao excluir link');
        return;
      }

      await fetchLinks();
    } catch (error) {
      console.error('Erro ao excluir link:', error);
      alert('Erro ao excluir link');
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
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Voltar
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Links de Indicação</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
              disabled={empresas.length === 0}
            >
              + Gerar Novo Link
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {empresas.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">Cadastre empresas primeiro para gerar links.</p>
            <Link
              href="/dashboard/empresas"
              className="mt-4 inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition"
            >
              Cadastrar Empresas
            </Link>
          </div>
        ) : links.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">Nenhum link gerado ainda.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition"
            >
              Gerar Primeiro Link
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indicações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {links.map((link) => (
                    <tr key={link.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {link.empresa_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {link.cliente_nome || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{link.url}</span>
                          <button
                            onClick={() => handleCopyLink(link.url)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Copiar link"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {link.usuarios_indicados_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(link.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden space-y-4">
              {links.map((link) => (
                <div key={link.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{link.empresa_nome}</h3>
                      {link.cliente_nome && (
                        <p className="text-sm text-gray-600">Cliente: {link.cliente_nome}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {link.usuarios_indicados_count || 0} indicações
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Link de Indicação</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900 break-all flex-1">{link.url}</p>
                      <button
                        onClick={() => handleCopyLink(link.url)}
                        className="text-purple-600 hover:text-purple-900 flex-shrink-0"
                        title="Copiar link"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Criado em {new Date(link.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                  >
                    Excluir Link
                  </button>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerar Novo Link</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione a Empresa *
                </label>
                <select
                  value={empresaSelecionada}
                  onChange={(e) => setEmpresaSelecionada(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                >
                  <option value="">Selecione...</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 O link gerado será único e poderá ser usado para rastrear indicações desta empresa.
                </p>
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
                onClick={handleGerarLink}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition"
              >
                Gerar Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
