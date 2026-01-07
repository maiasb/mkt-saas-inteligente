'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Empresa {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
}

export default function EmpresasPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setIsLoading(false);
      fetchEmpresas();
    }
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

  const handleAddEmpresa = async () => {
    if (!novaEmpresa.nome || !novaEmpresa.email) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaEmpresa),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao criar empresa');
        return;
      }

      await fetchEmpresas();
      setShowModal(false);
      setNovaEmpresa({ nome: '', email: '', telefone: '', cnpj: '' });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      alert('Erro ao criar empresa');
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const response = await fetch(`/api/empresas?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Erro ao excluir empresa');
        return;
      }

      await fetchEmpresas();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      alert('Erro ao excluir empresa');
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
              <h1 className="text-2xl font-bold text-gray-900">Empresas Agenciadas</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
            >
              + Nova Empresa
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {empresas.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">Nenhuma empresa cadastrada ainda.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition"
            >
              Cadastrar Primeira Empresa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresas.map((empresa) => (
              <div key={empresa.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">{empresa.nome}</h3>
                  <button
                    onClick={() => handleDeleteEmpresa(empresa.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📧 {empresa.email}</p>
                  {empresa.telefone && <p>📱 {empresa.telefone}</p>}
                  {empresa.cnpj && <p>🏢 {empresa.cnpj}</p>}
                </div>
                <Link
                  href={`/dashboard/empresas/${empresa.id}/clientes`}
                  className="mt-4 block text-center bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 rounded-lg transition"
                >
                  Ver Clientes
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Nova Empresa</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={novaEmpresa.nome}
                  onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
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
                  value={novaEmpresa.email}
                  onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })}
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
                  value={novaEmpresa.telefone}
                  onChange={(e) => setNovaEmpresa({ ...novaEmpresa, telefone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={novaEmpresa.cnpj}
                  onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })}
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
                onClick={handleAddEmpresa}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
