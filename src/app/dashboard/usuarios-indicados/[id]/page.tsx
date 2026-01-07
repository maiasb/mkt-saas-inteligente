'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface UsuarioIndicado {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  link_id: string;
  created_at: string;
}

interface LinkInfo {
  id: string;
  codigo: string;
  url: string;
  empresa_id: string;
  cliente_id: string;
  empresa_nome: string;
  cliente_nome: string;
}

export default function UsuarioIndicadoDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const usuarioId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioIndicado | null>(null);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Buscar usuário indicado
      const usuarioResponse = await fetch(`/api/usuarios-indicados/${usuarioId}`);
      if (!usuarioResponse.ok) {
        setIsLoading(false);
        return;
      }
      const usuarioData = await usuarioResponse.json();
      setUsuario(usuarioData);

      // Buscar informações do link
      if (usuarioData.link_id) {
        const linksResponse = await fetch('/api/links');
        const links = await linksResponse.json();
        const link = links.find((l: any) => l.id === usuarioData.link_id);
        if (link) {
          setLinkInfo(link);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setIsLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router, fetchData]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Usuário indicado não encontrado</p>
          <Link href="/dashboard" className="text-purple-600 hover:underline">
            Voltar para o dashboard
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
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              ← Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{usuario.nome}</h1>
              <p className="text-sm text-gray-600">Usuário Indicado</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações do Usuário */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome Completo</p>
              <p className="text-gray-900 font-medium">{usuario.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-gray-900">{usuario.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Telefone</p>
              <p className="text-gray-900">{usuario.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">CPF</p>
              <p className="text-gray-900">{usuario.cpf || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Data de Cadastro</p>
              <p className="text-gray-900">
                {new Date(usuario.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Informações da Indicação */}
        {linkInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Origem da Indicação</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-4xl">🏢</span>
                <div>
                  <p className="text-sm text-gray-500">Empresa</p>
                  <p className="text-gray-900 font-medium">{linkInfo.empresa_nome}</p>
                </div>
              </div>
              
              {linkInfo.cliente_nome && (
                <div className="flex items-center gap-2">
                  <span className="text-4xl">👤</span>
                  <div>
                    <p className="text-sm text-gray-500">Indicado por</p>
                    <Link
                      href={`/dashboard/empresas/${linkInfo.empresa_id}/clientes/${linkInfo.cliente_id}`}
                      className="text-purple-600 hover:text-purple-900 hover:underline font-medium"
                    >
                      {linkInfo.cliente_nome}
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-4xl">🔗</span>
                <div>
                  <p className="text-sm text-gray-500">Link de Indicação</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 text-sm break-all">{linkInfo.url}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(linkInfo.url);
                        alert('Link copiado!');
                      }}
                      className="text-purple-600 hover:text-purple-900 text-sm"
                      title="Copiar link"
                    >
                      📋
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Código: {linkInfo.codigo}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ações</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href={`mailto:${usuario.email}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
            >
              📧 Enviar Email
            </a>
            {usuario.telefone && (
              <a
                href={`tel:${usuario.telefone}`}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition"
              >
                📱 Ligar
              </a>
            )}
            {linkInfo && linkInfo.cliente_id && (
              <Link
                href={`/dashboard/empresas/${linkInfo.empresa_id}/clientes/${linkInfo.cliente_id}`}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition"
              >
                👤 Ver Cliente Indicador
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
