'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { EmpresaConfig } from '@/config/empresas.config';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [empresasExpanded, setEmpresasExpanded] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaConfig[]>([]);
  const [empresaExpandida, setEmpresaExpandida] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const carregarEmpresas = async () => {
      try {
        const response = await fetch('/api/empresas');
        if (response.ok) {
          setEmpresas(await response.json());
        }
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
      }
    };

    carregarEmpresas();
  }, []);

  // Auto-expandir empresas se estiver em uma página de empresa
  useEffect(() => {
    if (pathname.includes('/dashboard/empresas/')) {
      setEmpresasExpanded(true);
    }
    const match = pathname.match(/^\/dashboard\/empresas\/([^/]+)/);
    if (match) {
      setEmpresaExpandida(match[1]);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const isEmpresaActive = (slug: string) => {
    return pathname.includes(`/dashboard/empresas/${slug}`);
  };

  return (
    <>
      {/* Mobile Hamburger Button - Only show when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="xl:hidden fixed top-4 left-4 z-50 p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gradient-to-b from-purple-500 via-purple-600 to-pink-500 
          text-white shadow-2xl transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with Close Button */}
          <div className="p-6 border-b border-white/20 relative">
            {/* Close button - only visible on mobile when open */}
            {isOpen && (
              <button
                onClick={() => setIsOpen(false)}
                className="xl:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100">
              Agência de Marketing
            </h1>
            <p className="text-purple-100 text-sm mt-1">Painel Admin</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                ${
                  isActive('/dashboard') && pathname === '/dashboard'
                    ? 'bg-white/20 shadow-lg transform scale-105'
                    : 'hover:bg-white/10 hover:translate-x-1'
                }
              `}
            >
              <span className="text-xl">📊</span>
              <span className="font-medium text-sm">Dashboard</span>
            </Link>

            {/* Empresas - Collapsible */}
            <div>
              <button
                onClick={() => setEmpresasExpanded(!empresasExpanded)}
                className={`
                  w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-all duration-200
                  ${
                    pathname.includes('/dashboard/empresas')
                      ? 'bg-white/20 shadow-lg'
                      : 'hover:bg-white/10'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏢</span>
                  <span className="font-medium text-sm">Empresas</span>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    empresasExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Sub-items de Empresas */}
              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${empresasExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="pl-4 pt-2 space-y-1">
                  {empresas.map((empresa) => (
                    <div key={empresa.id}>
                      <button
                        onClick={() =>
                          setEmpresaExpandida(empresaExpandida === empresa.slug ? null : empresa.slug)
                        }
                        className={`
                          w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm
                          ${
                            isEmpresaActive(empresa.slug)
                              ? 'bg-white/20 shadow-md font-semibold'
                              : 'hover:bg-white/10 hover:translate-x-1'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: empresa.cor }}
                          />
                          <span>{empresa.nome}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            empresaExpandida === empresa.slug ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      <div
                        className={`
                          overflow-hidden transition-all duration-300 ease-in-out
                          ${empresaExpandida === empresa.slug ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                        `}
                      >
                        <div className="pl-6 pt-1 space-y-1">
                          {[
                            { icone: '📊', rotulo: 'Dashboard', caminho: 'dashboard' },
                            { icone: '🎯', rotulo: 'Indicações', caminho: 'indicacoes' },
                            { icone: '👥', rotulo: 'Clientes', caminho: 'clientes' },
                          ].map((item) => (
                            <Link
                              key={item.caminho}
                              href={`/dashboard/empresas/${empresa.slug}/${item.caminho}`}
                              onClick={() => setIsOpen(false)}
                              className={`
                                flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs
                                ${
                                  pathname.includes(`/dashboard/empresas/${empresa.slug}/${item.caminho}`)
                                    ? 'bg-white/20 shadow-sm font-semibold'
                                    : 'hover:bg-white/10 hover:translate-x-1'
                                }
                              `}
                            >
                              <span>{item.icone}</span>
                              <span>{item.rotulo}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Link
                    href="/dashboard/configuracoes/empresas"
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm
                      ${
                        pathname.startsWith('/dashboard/configuracoes/empresas')
                          ? 'bg-white/20 shadow-md font-semibold'
                          : 'hover:bg-white/10 hover:translate-x-1'
                      }
                    `}
                  >
                    <span>⚙️</span>
                    <span>Gerenciar empresas</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:translate-x-1"
            >
              <span className="text-2xl">🚪</span>
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
        </aside>
    </>
  );
}
