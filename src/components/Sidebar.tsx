'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getEmpresasAtivas } from '@/config/empresas.config';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [empresasExpanded, setEmpresasExpanded] = useState(false);
  const [guaraExpanded, setGuaraExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const empresas = getEmpresasAtivas();

  // Auto-expandir empresas se estiver em uma página de empresa
  useEffect(() => {
    if (pathname.includes('/dashboard/empresas/')) {
      setEmpresasExpanded(true);
    }
    if (pathname.includes('/dashboard/empresas/guara-acqua-park') || pathname.includes('/dashboard/vendas')) {
      setEmpresasExpanded(true);
      setGuaraExpanded(true);
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
            
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100">
              Dreams
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
                  {/* Guará Acqua Park - Expandível */}
                  <div>
                    <button
                      onClick={() => setGuaraExpanded(!guaraExpanded)}
                      className={`
                        w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm
                        ${
                          isEmpresaActive('guara-acqua-park') || pathname.includes('/dashboard/vendas')
                            ? 'bg-white/20 shadow-md font-semibold'
                            : 'hover:bg-white/10 hover:translate-x-1'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>Guará Acqua Park</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          guaraExpanded ? 'rotate-180' : ''
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

                    {/* Sub-items do Guará */}
                    <div
                      className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${guaraExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                      `}
                    >
                      <div className="pl-6 pt-1 space-y-1">
                        <Link
                          href="/dashboard/empresas/guara-acqua-park/clientes"
                          onClick={() => setIsOpen(false)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs
                            ${
                              pathname.includes('/dashboard/empresas/guara-acqua-park/clientes')
                                ? 'bg-white/20 shadow-sm font-semibold'
                                : 'hover:bg-white/10 hover:translate-x-1'
                            }
                          `}
                        >
                          <span>👥</span>
                          <span>Clientes</span>
                        </Link>

                        <Link
                          href="/dashboard/vendas"
                          onClick={() => setIsOpen(false)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs
                            ${
                              pathname.includes('/dashboard/vendas')
                                ? 'bg-white/20 shadow-sm font-semibold'
                                : 'hover:bg-white/10 hover:translate-x-1'
                            }
                          `}
                        >
                          <span>💳</span>
                          <span>Vendas (Limber)</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Outras empresas */}
                  {empresas
                    .filter((empresa) => empresa.slug !== 'guara-acqua-park')
                    .map((empresa) => (
                      <Link
                        key={empresa.id}
                        href={`/dashboard/empresas/${empresa.slug}/clientes`}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm
                          ${
                            isEmpresaActive(empresa.slug)
                              ? 'bg-white/20 shadow-md font-semibold'
                              : 'hover:bg-white/10 hover:translate-x-1'
                          }
                        `}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: empresa.cor }}
                        />
                        <span>{empresa.nome}</span>
                      </Link>
                    ))}
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
