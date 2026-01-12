'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LinksPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 xl:ml-0 ml-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Links de Indicação</h1>
        <p className="text-gray-600 mt-2">
          Gerencie links de indicação por cliente
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Links por Cliente
          </h2>
          <p className="text-gray-600 mb-6">
            Os links de indicação são gerenciados diretamente na página de cada cliente.<br/>
            Acesse a página de clientes de uma empresa para gerar e visualizar links.
          </p>
        </div>
        
        <Link
          href="/dashboard/empresas"
          className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg transition font-medium"
        >
          Ir para Empresas
        </Link>
      </div>
    </div>
  );
}
