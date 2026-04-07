import axios from 'axios';
import type { LoginCredentials, OrdemServico, BillingData, Debito, Cliente, SaidaCaixa } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
};

export const funcionarioService = {
  getAll: async (): Promise<Array<{
    id: number;
    email: string;
    username: string;
    nome_completo: string;
    cargo?: string;
    telefone?: string;
    ativo: boolean;
    is_staff: boolean;
    data_criacao: string;
  }>> => {
    const response = await api.get('/auth/funcionarios/');
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },

  getById: async (id: number) => {
    const response = await api.get(`/auth/funcionarios/${id}/`);
    return response.data;
  },

  create: async (data: {
    email: string;
    username: string;
    nome_completo: string;
    password: string;
    password2: string;
    cargo?: string;
    telefone?: string;
  }) => {
    const response = await api.post('/auth/funcionarios/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{
    nome_completo: string;
    cargo?: string;
    telefone?: string;
    ativo?: boolean;
  }>) => {
    const response = await api.patch(`/auth/funcionarios/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/auth/funcionarios/${id}/`);
  },
};

export const ordemServicoService = {
  getAll: async (filters?: {
    status?: OrdemServico['status'];
    cliente?: string;
    data_inicio?: string;
    data_fim?: string;
    search?: string;
  }): Promise<OrdemServico[]> => {
    const response = await api.get('/ordens-servico/', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<OrdemServico> => {
    const response = await api.get(`/ordens-servico/${id}/`);
    return response.data;
  },

  create: async (data: {
    cliente: string;
    descricao?: string;
    status?: OrdemServico['status'];
    valor: number;
    prazo_entrega: string; // YYYY-MM-DD
    numero?: string; // Opcional - será gerado automaticamente
    observacoes?: string;
    // Novos campos de confecções
    estado_cabelo?: string;
    tipo_cabelo?: string;
    cor_cabelo?: string;
    peso_gramas?: number;
    tamanho_cabelo_cm?: number;
    cor_linha?: string;
    servico?: string | number; // Nome do serviço ou ID
    valor_metro?: number;
    pago_na_entrega?: boolean;
    foto_entrega?: File;
  } | FormData): Promise<OrdemServico> => {
    const response = await api.post('/ordens-servico/', data, {
      headers: data instanceof FormData ? {
        'Content-Type': 'multipart/form-data',
      } : {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  update: async (id: number, data: Partial<OrdemServico> | FormData): Promise<OrdemServico> => {
    const response = await api.patch(`/ordens-servico/${id}/`, data, {
      headers: data instanceof FormData ? {
        'Content-Type': 'multipart/form-data',
      } : {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  updateStatus: async (id: number, status: OrdemServico['status']): Promise<OrdemServico> => {
    const response = await api.patch(`/ordens-servico/${id}/atualizar-status/`, { status });
    return response.data;
  },

  faturar: async (id: number): Promise<OrdemServico> => {
    const response = await api.post(`/ordens-servico/${id}/faturar/`);
    return response.data;
  },

  desfaturar: async (id: number): Promise<OrdemServico> => {
    const response = await api.post(`/ordens-servico/${id}/desfaturar/`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ordens-servico/${id}/`);
  },

  gerarNumero: async (): Promise<{ numero: string }> => {
    const response = await api.get('/ordens-servico/gerar-numero/');
    return response.data;
  },
};

export const billingService = {
  getBillingData: async (filters?: {
    data_inicio?: string;
    data_fim?: string;
    cliente?: string;
  }): Promise<BillingData> => {
    const response = await api.get('/faturamento/', { params: filters });
    return response.data;
  },
};

export const saidaCaixaService = {
  getAll: async (filters?: {
    data_inicio?: string;
    data_fim?: string;
    categoria?: string;
  }): Promise<SaidaCaixa[]> => {
    const response = await api.get('/faturamento/saidas-caixa/', { params: filters });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },

  create: async (data: {
    descricao: string;
    valor: number;
    categoria: string;
    data: string;
    observacoes?: string;
  }): Promise<SaidaCaixa> => {
    const response = await api.post('/faturamento/saidas-caixa/', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/faturamento/saidas-caixa/${id}/`);
  },
};

export const clienteService = {
  getAll: async (filters?: {
    ativo?: boolean;
    search?: string;
  }): Promise<Cliente[]> => {
    const response = await api.get('/clientes/', { params: filters });
    // A API pode retornar um objeto paginado ou um array direto
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },

  getById: async (id: number) => {
    const response = await api.get(`/clientes/${id}/`);
    return response.data;
  },

  create: async (data: {
    nome: string;
    cnpj_cpf?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    eh_parceiro?: boolean;
  }) => {
    const response = await api.post('/clientes/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{
    nome: string;
    cnpj_cpf: string;
    email: string;
    telefone: string;
    endereco: string;
    eh_parceiro: boolean;
    ativo: boolean;
  }>) => {
    const response = await api.patch(`/clientes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/clientes/${id}/`);
  },
};

export const servicoService = {
  getAll: async (filters?: {
    ativo?: boolean;
    search?: string;
  }): Promise<Array<{ id: number; nome: string; descricao?: string }>> => {
    const response = await api.get('/servicos/', { params: filters });
    // A API pode retornar um objeto paginado ou um array direto
    const data: any = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },

  getById: async (id: number) => {
    const response = await api.get(`/servicos/${id}/`);
    return response.data;
  },

  create: async (data: {
    nome: string;
    descricao?: string;
  }) => {
    const response = await api.post('/servicos/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{ nome: string; descricao?: string; ativo?: boolean }>) => {
    const response = await api.patch(`/servicos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/servicos/${id}/`);
  },
};

export const estadoCabeloService = {
  getAll: async (filters?: { ativo?: boolean }): Promise<Array<{ id: number; nome: string; valor: string; ativo: boolean; ordem: number }>> => {
    const response = await api.get('/configuracoes/estado-cabelo/', { params: filters });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },
  create: async (data: { nome: string; valor: string; ativo?: boolean; ordem?: number }) => {
    const response = await api.post('/configuracoes/estado-cabelo/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<{ nome: string; valor: string; ativo: boolean; ordem: number }>) => {
    const response = await api.patch(`/configuracoes/estado-cabelo/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/configuracoes/estado-cabelo/${id}/`);
  },
};

export const tipoCabeloService = {
  getAll: async (filters?: { ativo?: boolean }): Promise<Array<{ id: number; nome: string; valor: string; ativo: boolean; ordem: number }>> => {
    const response = await api.get('/configuracoes/tipo-cabelo/', { params: filters });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },
  create: async (data: { nome: string; valor: string; ativo?: boolean; ordem?: number }) => {
    const response = await api.post('/configuracoes/tipo-cabelo/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<{ nome: string; valor: string; ativo: boolean; ordem: number }>) => {
    const response = await api.patch(`/configuracoes/tipo-cabelo/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/configuracoes/tipo-cabelo/${id}/`);
  },
};

export const corCabeloService = {
  getAll: async (filters?: { ativo?: boolean }): Promise<Array<{ id: number; nome: string; ativo: boolean; ordem: number }>> => {
    const response = await api.get('/configuracoes/cor-cabelo/', { params: filters });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },
  create: async (data: { nome: string; ativo?: boolean; ordem?: number }) => {
    const response = await api.post('/configuracoes/cor-cabelo/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<{ nome: string; ativo: boolean; ordem: number }>) => {
    const response = await api.patch(`/configuracoes/cor-cabelo/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/configuracoes/cor-cabelo/${id}/`);
  },
};

export const corLinhaService = {
  getAll: async (filters?: { ativo?: boolean }): Promise<Array<{ id: number; nome: string; ativo: boolean; ordem: number }>> => {
    const response = await api.get('/configuracoes/cor-linha/', { params: filters });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },
  create: async (data: { nome: string; ativo?: boolean; ordem?: number }) => {
    const response = await api.post('/configuracoes/cor-linha/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<{ nome: string; ativo: boolean; ordem: number }>) => {
    const response = await api.patch(`/configuracoes/cor-linha/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/configuracoes/cor-linha/${id}/`);
  },
};

export const debitoService = {
  getAll: async (parceiroId?: number): Promise<Debito[]> => {
    const params: any = {};
    if (parceiroId) {
      params.parceiro_id = parceiroId;
    }
    const response = await api.get('/debitos/', { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },

  exportarNota: async (parceiroId: number, formato: 'pdf' | 'excel' = 'excel'): Promise<Blob> => {
    const response = await api.get('/debitos/exportar-nota/', {
      params: {
        parceiro_id: parceiroId,
        formato: formato,
      },
      responseType: 'blob',
    });
    return response.data;
  },

  marcarComoPago: async (debitoId: number, formaPagamento: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito'): Promise<void> => {
    await api.patch(`/debitos/${debitoId}/marcar-pago/`, {
      forma_pagamento: formaPagamento,
    });
  },

  reverterPagamento: async (debitoId: number): Promise<void> => {
    await api.patch(`/debitos/${debitoId}/reverter-pagamento/`);
  },
};

export const configuracaoEmpresaService = {
  get: async (): Promise<{ nome: string; cnpj: string; email: string; telefone: string; endereco: string }> => {
    const response = await api.get('/faturamento/configuracao-empresa/');
    return response.data;
  },
  update: async (data: Partial<{ nome: string; cnpj: string; email: string; telefone: string; endereco: string }>) => {
    const response = await api.patch('/faturamento/configuracao-empresa/', data);
    return response.data;
  },
};

export default api;

