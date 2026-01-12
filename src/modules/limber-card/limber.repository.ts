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
   * Limpa o cache do token (útil em caso de erro 401)
   */
  clearTokenCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = null;
  }
}
