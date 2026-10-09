'use client';

import { useEffect, useState, useCallback } from 'react';
import { EmpresaConfig, REGRAS_PADRAO } from '@/config/empresas.config';

interface FormEmpresa {
  slug: string;
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  cor: string;
  ativo: boolean;
  regras: Record<keyof typeof REGRAS_PADRAO, string>;
}

const CAMPOS_REGRAS: { campo: keyof typeof REGRAS_PADRAO; rotulo: string }[] = [
  { campo: 'pontos_indicador', rotulo: 'Pontos para quem indica' },
  { campo: 'pontos_indicado', rotulo: 'Pontos para quem é indicado' },
  { campo: 'valor_conversao', rotulo: 'Recompensa por conversão (R$)' },
  { campo: 'limite_indicacoes', rotulo: 'Limite de indicações por indicador (0 = sem limite)' },
];

const FORM_VAZIO: FormEmpresa = {
  slug: '',
  nome: '',
  email: '',
  telefone: '',
  cnpj: '',
  cor: '#6366F1',
  ativo: true,
  regras: {
    pontos_indicador: String(REGRAS_PADRAO.pontos_indicador),
    pontos_indicado: String(REGRAS_PADRAO.pontos_indicado),
    valor_conversao: String(REGRAS_PADRAO.valor_conversao),
    limite_indicacoes: String(REGRAS_PADRAO.limite_indicacoes),
  },
};

export default function GerenciarEmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormEmpresa | null>(null);
  const [editando, setEditando] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const carregarEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/empresas?todas=1');
      setEmpresas(response.ok ? await response.json() : []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarEmpresas();
  }, [carregarEmpresas]);

  const abrirNova = () => {
    setEditando(false);
    setForm(FORM_VAZIO);
  };

  const abrirEdicao = (empresa: EmpresaConfig) => {
    setEditando(true);
    setForm({
      slug: empresa.slug,
      nome: empresa.nome,
      email: empresa.email,
      telefone: empresa.telefone || '',
      cnpj: empresa.cnpj || '',
      cor: empresa.cor,
      ativo: empresa.ativo,
      regras: {
        pontos_indicador: String(empresa.regras.pontos_indicador),
        pontos_indicado: String(empresa.regras.pontos_indicado),
        valor_conversao: String(empresa.regras.valor_conversao),
        limite_indicacoes: String(empresa.regras.limite_indicacoes),
      },
    });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(editando ? `/api/empresas/${form.slug}` : '/api/empresas', {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error?.error || 'Erro ao salvar empresa');
        return;
      }

      setForm(null);
      await carregarEmpresas();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      alert('Erro ao salvar empresa. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 w-full';

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-20 xl:pt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Empresas agenciadas</h1>
          <p className="text-gray-600 mt-1">Cadastre empresas e defina as regras do programa de indicação de cada uma</p>
        </div>
        {!form && (
          <button onClick={abrirNova} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium">
            Nova empresa
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={handleSalvar} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              disabled={editando}
              placeholder="Slug (ex: minha-empresa)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputClass}
            />
            <input required placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            <input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className={inputClass} />
            <input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={inputClass} />
            <label className="flex items-center gap-3 text-sm text-gray-700">
              Cor
              <input type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} />
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="ml-4" />
              Ativa
            </label>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Regras de negócio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAMPOS_REGRAS.map(({ campo, rotulo }) => (
                <label key={campo} className="text-sm text-gray-700">
                  {rotulo}
                  <input
                    type="number"
                    min="0"
                    value={form.regras[campo]}
                    onChange={(e) => setForm({ ...form, regras: { ...form.regras, [campo]: e.target.value } })}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium disabled:opacity-50">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setForm(null)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : empresas.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center text-gray-600">Nenhuma empresa cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {empresas.map((empresa) => (
            <div key={empresa.id} className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderColor: empresa.cor }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{empresa.nome}</h3>
                  <p className="text-sm text-gray-500">{empresa.slug}{empresa.ativo ? '' : ' · inativa'}</p>
                </div>
                <button onClick={() => abrirEdicao(empresa)} className="text-sm text-purple-600 font-medium">
                  Editar
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Indicador: {empresa.regras.pontos_indicador} pts · Indicado: {empresa.regras.pontos_indicado} pts ·
                Conversão: R$ {empresa.regras.valor_conversao} ·
                Limite: {empresa.regras.limite_indicacoes || 'sem limite'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
