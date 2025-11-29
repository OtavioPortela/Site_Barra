export interface OrdemServico {
  id: number;
  numero: string;
  cliente: string;
  descricao: string;
  status: 'pendente' | 'em_desenvolvimento' | 'finalizada';
  valor: number;
  data_criacao: string;
  prazo_entrega: string;
  data_finalizacao?: string;
  faturada?: boolean;
  data_faturamento?: string;
  // Campos de confecções
  estado_cabelo?: string;
  tipo_cabelo?: string;
  cor_cabelo?: string;
  peso_gramas?: number;
  tamanho_cabelo_cm?: number;
  cor_linha?: string;
  servico?: string;
  valor_metro?: number;
  observacoes?: string;
  usuario_criacao_nome?: string;
}

export interface User {
  id: number;
  email: string;
  nome: string;
  nome_completo?: string;
  token: string;
  is_staff?: boolean;
  cargo?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface BillingData {
  faturamento_total: number;
  faturamento_mensal: number;
  faturamento_semanal: number;
  quantidade_finalizadas: number;
  ticket_medio: number;
  faturamento_por_periodo: Array<{
    periodo: string;
    valor: number;
  }>;
  distribuicao_status: Array<{
    status: string;
    quantidade: number;
  }>;
  top_clientes: Array<{
    cliente: string;
    faturamento: number;
  }>;
  ordens_finalizadas: OrdemServico[];
}

