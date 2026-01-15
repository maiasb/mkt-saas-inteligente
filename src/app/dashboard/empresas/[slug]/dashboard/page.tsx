'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f59e0b'];

interface DashboardData {
  resumo: {
    totalIndicacoes: number;
    totalConvertidas: number;
    totalVendas: number;
    valorTotal: number;
  };
  indicacoesPorMes: Array<{
    mes: string;
    indicacoes: number;
    convertidas: number;
  }>;
  vendasPorMes: Array<{
    mes: string;
    vendas: number;
    valor: number;
  }>;
  taxaConversao: Array<{
    nome: string;
    valor: number;
  }>;
  formasPagamento: Array<{
    nome: string;
    valor: number;
    quantidade: number;
  }>;
}

export default function EmpresaDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState<DashboardData | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      
      const response = await fetch(`/api/empresas/${slug}/dashboard`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard');
      }
      
      const data = await response.json();
      setDados(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setErro('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando dados...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{erro}</p>
          <button
            onClick={carregarDados}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Nenhum dado disponível</div>
      </div>
    );
  }

  const { resumo, indicacoesPorMes, vendasPorMes, taxaConversao, formasPagamento } = dados;

  // Cores para o gráfico de formas de pagamento
  const PAYMENT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="pt-20 xl:pt-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl p-4 sm:p-6 lg:p-8 text-white mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">📊 Dashboard - Guará Acqua Park</h1>
        <p className="text-sm sm:text-base text-purple-100">Indicações e vendas consolidadas</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-800 font-semibold">Total de Indicações</p>
              <p className="text-3xl font-bold text-purple-900">{resumo.totalIndicacoes}</p>
            </div>
            <span className="text-4xl">🎯</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-semibold">Indicações Convertidas</p>
              <p className="text-3xl font-bold text-green-900">{resumo.totalConvertidas}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-semibold">Total de Vendas</p>
              <p className="text-3xl font-bold text-blue-900">{resumo.totalVendas}</p>
            </div>
            <span className="text-4xl">💳</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-800 font-semibold">Valor Total</p>
              <p className="text-3xl font-bold text-pink-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.valorTotal)}
              </p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Indicações */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Indicações por Período</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={indicacoesPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="indicacoes" stroke="#8b5cf6" strokeWidth={2} name="Indicações" />
              <Line type="monotone" dataKey="convertidas" stroke="#10b981" strokeWidth={2} name="Convertidas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Vendas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💳 Vendas por Período</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendasPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Taxa de Conversão */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📈 Taxa de Conversão</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taxaConversao}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="valor"
              >
                {taxaConversao.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Faturamento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💰 Faturamento por Período</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendasPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value: number | undefined) => 
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
                }
              />
              <Legend />
              <Bar dataKey="valor" fill="#ec4899" name="Faturamento (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Formas de Pagamento */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💰 Top 5 Formas de Pagamento</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formasPagamento} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={150} />
                <Tooltip 
                  formatter={(value: number | undefined) => 
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
                  }
                />
                <Legend />
                <Bar dataKey="valor" fill="#8b5cf6" name="Valor Total (R$)" />
              </BarChart>
            </ResponsiveContainer>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formasPagamento}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.nome}: ${entry.quantidade}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {formasPagamento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
