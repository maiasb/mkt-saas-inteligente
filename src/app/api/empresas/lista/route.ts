// API agregada que retorna lista de todas as empresas cadastradas

import { NextResponse } from 'next/server';
import { getEmpresasAtivas } from '@/config/empresas.config';
import { guaraService } from '@/modules/guara-acqua-park';

// GET - Lista todas as empresas com estatísticas
export async function GET() {
  try {
    const empresas = getEmpresasAtivas();
    
    // Busca estatísticas de cada empresa
    const empresasComStats = await Promise.all(
      empresas.map(async (empresa) => {
        let stats = {
          totalClientes: 0,
          totalIndicacoes: 0,
          totalConvertidos: 0,
        };

        try {
          if (empresa.slug === 'guara-acqua-park') {
            stats = await guaraService.buscarEstatisticasGerais();
          }
        } catch (error) {
          console.error(`Erro ao buscar stats de ${empresa.slug}:`, error);
        }

        return {
          ...empresa,
          stats,
        };
      })
    );

    return NextResponse.json(empresasComStats);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar empresas' },
      { status: 500 }
    );
  }
}
