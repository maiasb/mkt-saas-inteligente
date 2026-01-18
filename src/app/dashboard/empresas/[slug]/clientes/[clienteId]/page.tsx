'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getEmpresaBySlug } from '@/config/empresas.config';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  status?: string;
  associado_status?: string;
}

interface Pontuacao {
  total_pontos: number;
  historico: Array<{
    id: string;
    empresa_id: string;
    pontos: number;
    tipo: 'INDICADOR' | 'INDICADO';
    link_id: string | null;
    referencia_cliente_id: string | null;
    created_at: string;
  }>;
  indicados: Array<{
    cliente_id: string;
    created_at: string;
  }>;
}

interface ClienteIndicado {
  id: string;
  nome: string;
  email: string;
}

export default function ClienteDetalhesPage() {
  const params = useParams();
  const empresaSlug = params.slug as string;
  const clienteId = params.clienteId as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pontuacao, setPontuacao] = useState<Pontuacao | null>(null);
  const [indicados, setIndicados] = useState<ClienteIndicado[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empresa = getEmpresaBySlug(empresaSlug);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Busca dados do cliente na API
        const clienteResponse = await fetch(`/api/${empresaSlug}/clientes/${clienteId}`);
        
        if (!clienteResponse.ok) {
          throw new Error('Erro ao buscar dados do cliente');
        }
        
        const clienteData = await clienteResponse.json();
        
        if (!clienteData.cliente) {
          throw new Error('Cliente não encontrado');
        }
        
        setCliente(clienteData.cliente);
        setLinks(Array.isArray(clienteData.links) ? clienteData.links : []);

        // Busca pontuações
        const pontuacaoResponse = await fetch(`/api/pontuacoes/${clienteId}`);
        
        if (pontuacaoResponse.ok) {
          const pontuacaoData = await pontuacaoResponse.json();
          setPontuacao(pontuacaoData);

          // Busca dados dos clientes indicados
          if (Array.isArray(pontuacaoData.indicados) && pontuacaoData.indicados.length > 0) {
            const indicadosPromises = pontuacaoData.indicados.map(async (ind: any) => {
              try {
                const response = await fetch(`/api/${empresaSlug}/clientes/${ind.cliente_id}`);
                
                if (!response.ok) {
                  // Cliente indicado não encontrado - ignora silenciosamente
                  if (response.status === 404) {
                    console.warn(`Cliente indicado ${ind.cliente_id} não encontrado (404)`);
                  }
                  return null;
                }
                
                const data = await response.json();
                return data.cliente || null;
              } catch (error) {
                // Erro na busca do indicado - não afeta o fluxo principal
                console.warn(`Erro ao buscar indicado ${ind.cliente_id}:`, error);
                return null;
              }
            });

            const indicadosData = await Promise.all(indicadosPromises);
            setIndicados(indicadosData.filter(Boolean));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar dados do cliente');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clienteId, empresaSlug]);

  const handleGerarLink = async () => {
    if (!cliente || !empresa || isGeneratingLink) return;

    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clienteId: cliente.id,
          empresaId: empresa.id,
          empresaSlug: empresa.slug
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error?.error || 'Erro ao gerar link');
        return;
      }

      // Recarrega os links do cliente
      const clienteResponse = await fetch(`/api/${empresaSlug}/clientes/${clienteId}`);
      
      if (clienteResponse.ok) {
        const clienteData = await clienteResponse.json();
        setLinks(Array.isArray(clienteData.links) ? clienteData.links : []);
      }
      
      alert('Link gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link. Tente novamente.');
    } finally {
      setIsGeneratingLink(false);
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

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Info Card Skeleton */}
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Pontuação Card Skeleton */}
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 w-56 bg-gray-200 rounded mb-4"></div>
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-200 mb-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Links Skeleton */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-10 w-40 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicados Skeleton */}
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-100">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Cliente não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link 
            href={`/dashboard/empresas/${empresaSlug}/clientes`} 
            className="text-gray-600 hover:text-gray-900"
          >
            ← Voltar para Clientes
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Detalhes do Cliente
        </h1>
        <div className="flex items-center gap-3">
          <div 
            className="w-2 h-8 rounded"
            style={{ backgroundColor: empresa.cor }}
          />
          <div>
            <p className="text-lg font-semibold" style={{ color: empresa.cor }}>
              {empresa.nome}
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Informações do Cliente
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="text-lg font-medium text-gray-900">{cliente.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium text-gray-900">{cliente.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="text-lg font-medium text-gray-900">{cliente.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CPF/CNPJ</p>
              <p className="text-lg font-medium text-gray-900">{cliente.cpf || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-medium text-gray-900">{cliente.status || '-'}</p>
            </div>
          </div>
        </div>

        {/* Pontuação */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Pontuação por Indicações
          </h2>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
              style={{ backgroundColor: `${empresa.cor}20` }}
            >
              <span className="text-4xl font-bold" style={{ color: empresa.cor }}>
                {pontuacao?.total_pontos || 0}
              </span>
            </div>
            <p className="text-gray-600">pontos totais</p>
          </div>
          {pontuacao && pontuacao.historico && pontuacao.historico.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Último ganho:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {pontuacao.historico[0].tipo === 'INDICADOR' ? 'Indicou' : 'Foi indicado'}
                </span>
                <span className="font-semibold" style={{ color: empresa.cor }}>
                  +{pontuacao.historico[0].pontos} pontos
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Links do Cliente */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Links de Indicação ({links.length})
          </h2>
          <button
            onClick={handleGerarLink}
            disabled={isGeneratingLink}
            className="px-4 py-2 rounded-lg transition text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: empresa.cor }}
          >
            {isGeneratingLink ? 'Gerando...' : '+ Gerar Novo Link'}
          </button>
        </div>
        {links.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum link gerado ainda. Clique em &quot;Gerar Novo Link&quot; para criar o primeiro.
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link: any) => (
              <div 
                key={link.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Código: <span className="font-mono">{link.codigo}</span></p>
                  <p className="text-sm break-all" style={{ color: empresa.cor }}>
                    {link.url}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Criado em {new Date(link.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(link.url);
                    alert('Link copiado!');
                  }}
                  className="px-4 py-2 rounded-lg transition whitespace-nowrap text-white text-sm font-medium"
                  style={{ backgroundColor: empresa.cor }}
                >
                  Copiar Link
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clientes Indicados */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Clientes Indicados ({indicados.length})
        </h2>
        {indicados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Este cliente ainda não indicou ninguém
          </div>
        ) : (
          <div className="space-y-4">
            {indicados.map((indicado) => (
              <div 
                key={indicado.id} 
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: `${empresa.cor}08` }}
              >
                <div>
                  <p className="font-medium text-gray-900">{indicado.nome}</p>
                  <p className="text-sm text-gray-600">{indicado.email || '-'}</p>
                </div>
                <Link
                  href={`/dashboard/empresas/${empresaSlug}/clientes/${indicado.id}`}
                  className="px-4 py-2 rounded-lg transition text-sm font-medium"
                  style={{ 
                    backgroundColor: `${empresa.cor}15`,
                    color: empresa.cor
                  }}
                >
                  Ver Detalhes
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Pontuações */}
      {pontuacao && Array.isArray(pontuacao.historico) && pontuacao.historico.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Histórico de Pontuações
          </h2>
          <div className="space-y-3">
            {pontuacao.historico.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.tipo === 'INDICADOR' ? 'Indicou' : 'Foi indicado'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: empresa.cor }}>
                    +{item.pontos || 0} pontos
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
