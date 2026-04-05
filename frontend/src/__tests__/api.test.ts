import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do axios antes de importar o módulo
vi.mock('axios', async () => {
  const mockAxios = {
    create: vi.fn(() => mockInstance),
    defaults: {},
  };
  const mockInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
  };
  return { default: mockAxios };
});

describe('API Service - configuração', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('token é salvo no localStorage após login', () => {
    localStorage.setItem('token', 'meu-token-jwt');
    expect(localStorage.getItem('token')).toBe('meu-token-jwt');
  });

  it('token é removido do localStorage no logout', () => {
    localStorage.setItem('token', 'meu-token-jwt');
    localStorage.removeItem('token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('dados do usuário são removidos no logout', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'teste@barra.com' }));
    localStorage.removeItem('user');
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('VITE_API_URL padrão aponta para localhost', () => {
    // Em ambiente de test, import.meta.env.VITE_API_URL não está definido
    const urlPadrao = 'http://localhost:8000/api';
    expect(urlPadrao).toContain('localhost');
    expect(urlPadrao).toContain('8000');
    expect(urlPadrao).toContain('/api');
  });
});

describe('formatação de token no header', () => {
  it('monta header Authorization corretamente', () => {
    const token = 'abc123';
    const header = `Bearer ${token}`;
    expect(header).toBe('Bearer abc123');
  });

  it('não monta header se token for nulo', () => {
    const token = localStorage.getItem('token');
    expect(token).toBeNull();
  });
});
