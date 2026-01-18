// Repository para Limber Card API (Plataforma de Vendas)

interface AuthResponse {
  codigo: number;
  nivel: number;
  nome: string;
  usuario: string;
  token: string;
  email: string | null;
  parceiros: Array<{
    idparceiro: number;
    nomeparceiro: string;
    tipoparceiro: string;
    pedido_de_cancelamento: boolean;
    visualiza_relatorios_venda: number;
    altera_cadastro: boolean;
    sac: boolean;
    integra_venda: boolean;
    desct_central_vendas: string | null;
    administrador: boolean;
    remarcacao: boolean;
    cancelamento_de_venda: boolean;
    docparceiro: string;
  }>;
  estabFavorito: any;
  permissoes: any[];
  mfa: any[];
  status: string;
  message: string;
}

interface Venda {
  codigo: number;
  localizador: string;
  data_hora: string;
  status: string;
  status_desc: string;
  idorigem: string | null;
  cod_local_venda: number;
  local_venda: string;
  nome_titular: string;
  email_titular: string;
  total_liquido: number;
  pedido_de_cancelamento: boolean;
  quantidade: number;
  formas_pag_desc: string;
  data?: string;
  hora?: string;
}

interface ListarVendasParams {
  estabelecOrig?: number;
  dataVendaInit?: string;
  dataVendaFim?: string;
  dataVisitaInit?: string;
  dataVisitaFim?: string;
  statusArray?: string[];
  nomeOrEmail?: string;
  localizador?: string;
}

export class LimberCardRepository {
  private readonly apiUrl = process.env.LIMBER_CARD_API_URL;
  private readonly user = process.env.LIMBER_CARD_USER;
  private readonly password = process.env.LIMBER_CARD_PASSWORD;
  private cachedToken: string | null = null;
  private tokenExpiry: number | null = null;

  /**
   * Autentica na API do Limber Card e retorna o token JWT
   */
  async authenticate(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Dreams-Indicacoes/1.0',
        },
        body: JSON.stringify({
          usuario: this.user,
          senha: this.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication error: ${response.statusText}`);
      }

      const data: AuthResponse = await response.json();

      if (data.status !== 'ok') {
        throw new Error(data.message || 'Erro na autenticação');
      }

      // Cache do token por 1 hora (JWT geralmente expira após esse tempo)
      this.cachedToken = data.token;
      this.tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hora

      return data;
    } catch (error) {
      console.error('[LimberCardRepository] Erro ao autenticar:', error);
      throw error;
    }
  }

  /**
   * Retorna um token válido, fazendo nova autenticação se necessário
   */
  async getToken(): Promise<string> {
    // Verifica se tem token em cache e se ainda é válido
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    // Se não tem ou expirou, autentica novamente
    const authData = await this.authenticate();
    return authData.token;
  }

  /**
   * Força refresh do token (útil para garantir token fresco em cada requisição)
   */
  async getFreshToken(): Promise<string> {
    this.clearTokenCache();
    const authData = await this.authenticate();
    return authData.token;
  }

  /**
   * Limpa o cache do token (útil em caso de erro 401)
   */
  clearTokenCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Lista vendas da plataforma Limber Card
   * GET /api/vendas com query parameters
   */
  async listarVendas(params: ListarVendasParams = {}): Promise<Venda[]> {
    try {
      // Força refresh do token para garantir autenticação válida
      const token = await this.getFreshToken();
      
      // Monta query parameters
      const queryParams = new URLSearchParams();
      
      if (params.estabelecOrig) {
        queryParams.append('estabelecOrig', params.estabelecOrig.toString());
      }
      
      // Datas no formato YYYY-MM-DD (ISO 8601)
      if (params.dataVendaInit) {
        queryParams.append('dataVendaInit', params.dataVendaInit);
      }
      
      if (params.dataVendaFim) {
        queryParams.append('dataVendaFim', params.dataVendaFim);
      }

      if (params.dataVisitaInit) {
        queryParams.append('dataVisitaInit', params.dataVisitaInit);
      }

      if (params.dataVisitaFim) {
        queryParams.append('dataVisitaFim', params.dataVisitaFim);
      }

      if (params.statusArray && params.statusArray.length > 0) {
        queryParams.append('statusArray', params.statusArray.join(','));
      }

      if (params.nomeOrEmail) {
        queryParams.append('nomeOrEmail', params.nomeOrEmail);
      }

      if (params.localizador) {
        queryParams.append('localizador', params.localizador);
      }

      const queryString = queryParams.toString();
      const url = `${this.apiUrl}/vendas${queryString ? `?${queryString}` : ''}`;

      console.log('[LimberCardRepository] Chamando API Limber:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Dreams-Indicacoes/1.0',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[LimberCardRepository] Resposta de erro:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });
        
        // Se for 401, limpa o cache e tenta novamente
        if (response.status === 401) {
          this.clearTokenCache();
          throw new Error('Token expirado. Por favor, tente novamente.');
        }
        throw new Error(`Erro ao buscar vendas: ${response.statusText}. Detalhes: ${errorBody}`);
      }

      const vendas: Venda[] = await response.json();
      return vendas;
    } catch (error) {
      console.error('[LimberCardRepository] Erro ao listar vendas:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes completos de uma venda específica
   * GET /api/vendas/venda/{idVenda}
   */
  async obterDetalhesVenda(codigoVenda: number): Promise<any> {
    try {
      // Força refresh do token para garantir autenticação válida
      const token = await this.getFreshToken();
      
      const url = `${this.apiUrl}/vendas/venda/${codigoVenda}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Dreams-Indicacoes/1.0',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearTokenCache();
          throw new Error('Token expirado. Por favor, tente novamente.');
        }
        throw new Error(`Erro ao buscar detalhes da venda: ${response.statusText}`);
      }

      const detalhes = await response.json();
      return detalhes;
    } catch (error) {
      console.error('[LimberCardRepository] Erro ao obter detalhes da venda:', error);
      throw error;
    }
  }
}
