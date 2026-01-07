'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa_id: string;
  created_at: string;
}

interface LinkCliente {
  id: string;
  codigo: string;
  url: string;
  ativo: boolean;
  created_at: string;
  usuarios_indicados_count: number;
}

interface UsuarioIndicado {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  created_at: string;
  nivel_indicacao: number;
}

export default function ClienteDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const empresaId = params.id as string;
  const clienteId = params.clienteId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [empresaNome, setEmpresaNome] = useState('');
  const [links, setLinks] = useState<LinkCliente[]>([]);
  const [usuariosIndicados, setUsuariosIndicados] = useState<UsuarioIndicado[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Buscar empresa
      const empresaResponse = await fetch('/api/empresas');
      const empresas = await empresaResponse.json();
      const empresa = empresas.find((e: any) => e.id === empresaId);
      if (empresa) {
        setEmpresaNome(empresa.nome);
      }

      // Buscar cliente
      const clienteResponse = await fetch(`/api/empresas/${empresaId}/clientes`);
      const clientes = await clienteResponse.json();
      const clienteData = clientes.find((c: any) => c.id === clienteId);
      if (clienteData) {
        setCliente(clienteData);
      }

      // Buscar links do cliente
      const linksResponse = await fetch('/api/links');
      const todosLinks = await linksResponse.json();
      const linksCliente = todosLinks.filter((link: any) => link.cliente_id === clienteId);
      setLinks(linksCliente);

      // Buscar clientes indicados por este cliente (através dos links)
      const clientesIndicadosResponse = await fetch(`/api/empresas/${empresaId}/clientes`);
      const todosClientes = await clientesIndicadosResponse.json();
      const indicados = todosClientes.filter((c: any) => c.indicador_cliente_id === clienteId);
      setUsuariosIndicados(indicados);

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setIsLoading(false);
    }
  }, [empresaId, clienteId]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router, fetchData]);

  const handleGenerateLink = async () => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId }),
      });

      if (!response.ok) {
        alert('Erro ao gerar link');
        return;
      }

      await fetchData();
      setShowLinkModal(false);
      alert('Link gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link');
    }
  };

  const totalIndicacoes = usuariosIndicados.length;
  const pontuacao = totalIndicacoes * 10; // 10 pontos por indicação

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Cliente não encontrado</p>
          <Link href={`/dashboard/empresas/${empresaId}/clientes`} className="text-purple-600 hover:underline">
            Voltar para clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/empresas/${empresaId}/clientes`} className="text-gray-600 hover:text-gray-900">
              ← Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{cliente.nome}</h1>
              <p className="text-sm text-gray-600">{empresaNome}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total de Indicações</p>
                <p className="text-3xl font-bold text-purple-600">{totalIndicacoes}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pontuação</p>
                <p className="text-3xl font-bold text-green-600">{pontuacao}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Links Gerados</p>
                <p className="text-3xl font-bold text-blue-600">{links.length}</p>
              </div>
              <div className="text-4xl">🔗</div>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{cliente.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="text-gray-900">{cliente.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cadastrado em</p>
              <p className="text-gray-900">{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Links do Cliente */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Links de Indicação</h2>
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
            >
              + Novo Link
            </button>
          </div>

          {links.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum link gerado ainda</p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${link.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {link.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {link.usuarios_indicados_count || 0} indicações
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 break-all">{link.url}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Criado em {new Date(link.created_at).toLocaleDateString('pt-BR')}
                      </p>
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
          )}
        </div>

        {/* Usuários Indicados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Usuários Indicados</h2>
          
          {usuariosIndicados.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma indicação ainda</p>
          ) : (
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
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosIndicados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link 
                          href={`/dashboard/empresas/${empresaId}/clientes/${usuario.id}`}
                          className="text-purple-600 hover:text-purple-900 hover:underline"
                        >
                          {usuario.nome}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.telefone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Confirmação */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gerar Novo Link</h2>
            <p className="text-gray-600 mb-6">
              Deseja gerar um novo link de indicação para <strong>{cliente.nome}</strong>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateLink}
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
