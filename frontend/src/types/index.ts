export interface OrdemServico {
  id: number;
  numero: string;
  cliente: string;
  cliente_telefone?: string;
  cliente_eh_parceiro?: boolean;
  descricao: string;
  descricao_cliente?: string;
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
  entregue?: boolean;
  pago_na_entrega?: boolean;
  foto_entrega?: string;
  forma_pagamento?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
  forma_pagamento_2?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | null;
  valor_pagamento_1?: number | null;
  valor_pagamento_2?: number | null;
  valor_recebido?: number | null;
  troco?: number | null;
  // Controle de material/perdas
  origem_cabelo?: 'cliente' | 'proprio';
  custo_cabelo?: number | string | null;
  limpeza_mesclagem?: boolean;
  peso_final_gramas?: number | null;
  tamanho_final_cm?: number | null;
  exige_peso_final?: boolean;
  perda_percentual?: number | null;
}

export interface Cliente {
  id: number;
  nome: string;
  cnpj_cpf?: string;
  email?: string;
  telefone: string;
  endereco?: string;
  ativo: boolean;
  eh_parceiro?: boolean;
  data_cadastro: string;
}

export interface Debito extends OrdemServico {
  // Reutiliza campos de OrdemServico
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

export interface SaidaCaixa {
  id: number;
  tipo: 'saida' | 'entrada';
  descricao: string;
  valor: number;
  categoria: string;
  tipo_material?: string;
  data: string;
  observacoes: string;
  criado_por_nome: string | null;
  data_criacao: string;
}

export interface BillingData {
  faturamento_total: number;
  faturamento_mensal: number;
  faturamento_semanal: number;
  quantidade_finalizadas: number;
  ticket_medio: number;
  total_saidas: number;
  total_saidas_mensal: number;
  lucro_liquido: number;
  lucro_liquido_mensal: number;
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


export interface PerdaAgrupada {
  nome: string;
  perda: number | null;
  os: number;
  gramas_entrada: number;
  gramas_perdidas: number;
}

export interface VolumeLinha {
  nome: string;
  os: number;
  gramas: number;
  valor: number;
  valor_por_100g: number | null;
}

export interface PainelMaterial {
  periodo: { inicio: string; fim: string };
  resumo: {
    gramas_recebidas: number;
    os_recebidas: number;
    media_gramas: number | null;
    perda_media: number | null;
    perda_media_limpeza: number | null;
    perda_esperada: number;
    perda_esperada_limpeza: number;
    os_pesadas: number;
    os_sem_peso_final: number;
    gasto_material: number;
    material_por_100g: number | null;
    faturamento: number;
    material_pct_faturamento: number | null;
  };
  perdas: {
    semanal: (PerdaAgrupada & { semana: string })[];
    por_servico: PerdaAgrupada[];
    por_estado: PerdaAgrupada[];
    por_origem: PerdaAgrupada[];
    acima_do_esperado: {
      id: number; numero: string; cliente: string; servico: string; limpeza_mesclagem: boolean;
      peso_entrada: number; peso_final: number; perda: number; esperado: number;
    }[];
    total_acima_do_esperado: number;
    sem_peso_final: {
      id: number; numero: string; cliente: string; servico: string;
      peso_entrada: number; tamanho_entrada: number; limpeza_mesclagem: boolean; data_finalizacao: string;
    }[];
  };
  volume: {
    semanal: { semana: string; gramas: number; os: number }[];
    por_servico: VolumeLinha[];
    top_clientes: VolumeLinha[];
  };
  custo: {
    por_tipo: { tipo: string; nome: string; valor: number; percentual: number | null }[];
    saidas_outro: { quantidade: number; valor: number };
    cabelo_proprio: { os: number; gramas: number; custo: number; perda_media: number | null; os_pesadas: number; prejuizo_estimado: number };
  };
}

export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';

export interface FotografiaPagamento {
  status: string;
  faturada: boolean;
  data_faturamento: string | null;
  valor: string | null;
  forma_pagamento: FormaPagamento | null;
  forma_pagamento_2: FormaPagamento | null;
  valor_pagamento_1: string | null;
  valor_pagamento_2: string | null;
  valor_recebido: string | null;
}

export interface AlteracaoOS {
  id: number;
  acao: 'corrigir_pagamento' | 'estornar_faturamento' | 'cancelar_faturada';
  acao_label: string;
  motivo: string;
  dados_antes: FotografiaPagamento;
  dados_depois: FotografiaPagamento;
  usuario_nome: string | null;
  data: string;
}

export interface CorrecaoPagamento {
  pin?: string;
  motivo: string;
  forma_pagamento: FormaPagamento | '';
  forma_pagamento_2?: FormaPagamento | null;
  valor_pagamento_1?: number | null;
  valor_recebido?: number | null;
}
