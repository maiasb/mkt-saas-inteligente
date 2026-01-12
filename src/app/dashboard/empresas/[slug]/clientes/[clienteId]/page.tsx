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
  const [loading, setLoading] = useState(true);

  const empresa = getEmpresaBySlug(empresaSlug);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Busca dados do cliente na API
        const clienteResponse = await fetch(`/api/${empresaSlug}/clientes/${clienteId}`);
        const clienteData = await clienteResponse.json();
        setCliente(clienteData.cliente);

        // Busca pontuações
        const pontuacaoResponse = await fetch(`/api/pontuacoes/${clienteId}`);
        const pontuacaoData = await pontuacaoResponse.json();
        setPontuacao(pontuacaoData);

        // Busca dados dos clientes indicados
        if (pontuacaoData.indicados && pontuacaoData.indicados.length > 0) {
          const indicadosPromises = pontuacaoData.indicados.map(async (ind: any) => {
            try {
              const response = await fetch(`/api/${empresaSlug}/clientes/${ind.cliente_id}`);
              const data = await response.json();
              return data.cliente;
            } catch (error) {
              console.error('Erro ao buscar indicado:', error);
              return null;
            }
          });

          const indicadosData = await Promise.all(indicadosPromises);
          setIndicados(indicadosData.filter(Boolean));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clienteId, empresaSlug]);

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
        <div className="text-center">Carregando dados do cliente...</div>
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 xl:ml-0 ml-14">
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
                  {pontuacao.historico[0].tipo === 'INDICADOR' ? 'Como indicador' : 'Como indicado'}
                </span>
                <span className="font-semibold" style={{ color: empresa.cor }}>
                  +{pontuacao.historico[0].pontos} pontos
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clientes Indicados */}
      <div className="bg-white rounded-lg shadow p-6">
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
      {pontuacao && pontuacao.historico && pontuacao.historico.length > 0 && (
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
                    {item.tipo === 'INDICADOR' ? 'Indicou um cliente' : 'Foi indicado'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: empresa.cor }}>
                    +{item.pontos} pontos
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
