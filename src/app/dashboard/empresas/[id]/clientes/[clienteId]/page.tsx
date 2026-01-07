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
  const [pontuacaoTotal, setPontuacaoTotal] = useState(0);
  const [indicacoesNivel, setIndicacoesNivel] = useState({ diretas: 0, indiretas: 0 });

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

      // Calcular pontuação recursiva (incluindo indicações indiretas)
      const calcularPontuacaoRecursiva = (clienteIdParam: string, todosClientesParam: any[], nivel: number = 1): { pontos: number, diretas: number, indiretas: number } => {
        const indicadosDiretos = todosClientesParam.filter((c: any) => c.indicador_cliente_id === clienteIdParam);
        
        let pontosDiretos = indicadosDiretos.length * 10; // 10 pontos por indicação direta
        let pontosIndiretos = 0;
        let contadorIndiretas = 0;
        
        // Para cada indicado direto, calcular pontuação dos indicados dele (recursivo)
        indicadosDiretos.forEach((indicado: any) => {
          const resultadoFilho = calcularPontuacaoRecursiva(indicado.id, todosClientesParam, nivel + 1);
          pontosIndiretos += resultadoFilho.pontos * 0.5; // 50% dos pontos dos níveis inferiores
          contadorIndiretas += resultadoFilho.diretas + resultadoFilho.indiretas;
        });
        
        return {
          pontos: pontosDiretos + pontosIndiretos,
          diretas: indicadosDiretos.length,
          indiretas: contadorIndiretas
        };
      };

      const resultado = calcularPontuacaoRecursiva(clienteId, todosClientes);
      setPontuacaoTotal(Math.round(resultado.pontos));
      setIndicacoesNivel({ diretas: resultado.diretas, indiretas: resultado.indiretas });

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Indicações Diretas</p>
                <p className="text-3xl font-bold text-purple-600">{indicacoesNivel.diretas}</p>
              </div>
              <div className="text-4xl">👤</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Indicações Indiretas</p>
                <p className="text-3xl font-bold text-blue-600">{indicacoesNivel.indiretas}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pontuação Total</p>
                <p className="text-3xl font-bold text-green-600">{pontuacaoTotal}</p>
                <p className="text-xs text-gray-400 mt-1">Inclui rede completa</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Links Gerados</p>
                <p className="text-3xl font-bold text-orange-600">{links.length}</p>
              </div>
              <div className="text-4xl">🔗</div>
            </div>
          </div>
        </div>

        {/* Informações sobre Pontuação */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Sistema de Pontuação</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• <strong>Indicação Direta:</strong> 10 pontos por cada pessoa que você indicar</p>
            <p>• <strong>Indicação Indireta:</strong> 50% dos pontos das indicações feitas por quem você indicou</p>
            <p>• <strong>Exemplo:</strong> Se você indicar A (10pts) e A indicar B (10pts), você ganha 10 + 5 = 15 pontos totais</p>
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
