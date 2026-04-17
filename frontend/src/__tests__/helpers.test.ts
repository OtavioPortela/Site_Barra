import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getStatusColor,
} from '../utils/helpers';

describe('formatCurrency', () => {
  it('formata valor inteiro em reais', () => {
    const resultado = formatCurrency(100);
    expect(resultado).toContain('100');
    expect(resultado).toContain('R$');
  });

  it('formata valor decimal', () => {
    const resultado = formatCurrency(1234.56);
    expect(resultado).toContain('1.234,56');
  });

  it('formata zero', () => {
    const resultado = formatCurrency(0);
    expect(resultado).toContain('0');
  });

  it('formata valor negativo', () => {
    const resultado = formatCurrency(-50);
    expect(resultado).toContain('50');
  });
});

describe('formatDate', () => {
  it('formata data YYYY-MM-DD para dd/mm/yyyy sem aplicar timezone', () => {
    expect(formatDate('2025-12-25')).toBe('25/12/2025');
    expect(formatDate('2026-01-01')).toBe('01/01/2026');
  });

  it('retorna a string original se data inválida', () => {
    expect(formatDate('data-invalida')).toBe('data-invalida');
  });

  it('formata data ISO com hora no timezone Brasília', () => {
    // 2025-06-15T13:00:00Z = 10:00 em Brasília (UTC-3) — data continua 15/06
    const resultado = formatDate('2025-06-15T13:00:00Z');
    expect(resultado).toMatch(/15\/06\/2025/);
  });

  it('data ISO meia-noite UTC vira dia anterior em Brasília (UTC-3)', () => {
    // 2026-04-17T00:00:00Z = 21:00 de 16/04 em Brasília
    const resultado = formatDate('2026-04-17T00:00:00Z');
    expect(resultado).toMatch(/16\/04\/2026/);
  });
});

describe('formatDateTime', () => {
  it('formata data com hora no timezone Brasília', () => {
    // 2025-06-15T13:00:00Z = 10:00 em Brasília
    const resultado = formatDateTime('2025-06-15T13:00:00Z');
    expect(resultado).toMatch(/15\/06\/2025/);
    expect(resultado).toMatch(/10:00/);
  });

  it('retorna string original se data inválida', () => {
    expect(formatDateTime('invalido')).toBe('invalido');
  });

  it('aplica offset correto -3h em relação ao UTC', () => {
    // 2026-04-17T22:00:00Z = 19:00 em Brasília
    const resultado = formatDateTime('2026-04-17T22:00:00Z');
    expect(resultado).toMatch(/17\/04\/2026/);
    expect(resultado).toMatch(/19:00/);
  });
});

describe('getStatusLabel', () => {
  it('retorna label correto para pendente', () => {
    expect(getStatusLabel('pendente')).toBe('Pendente');
  });

  it('retorna label correto para em_desenvolvimento', () => {
    expect(getStatusLabel('em_desenvolvimento')).toBe('Em Desenvolvimento');
  });

  it('retorna label correto para finalizada', () => {
    expect(getStatusLabel('finalizada')).toBe('Finalizada');
  });

  it('retorna label correto para cancelada', () => {
    expect(getStatusLabel('cancelada')).toBe('Cancelada');
  });

  it('retorna o próprio valor para status desconhecido', () => {
    expect(getStatusLabel('outro')).toBe('outro');
  });
});

describe('getStatusColor', () => {
  it('retorna classes para pendente (amarelo)', () => {
    expect(getStatusColor('pendente')).toContain('yellow');
  });

  it('retorna classes para em_desenvolvimento (azul)', () => {
    expect(getStatusColor('em_desenvolvimento')).toContain('blue');
  });

  it('retorna classes para finalizada (verde)', () => {
    expect(getStatusColor('finalizada')).toContain('green');
  });

  it('retorna classes para cancelada (vermelho)', () => {
    expect(getStatusColor('cancelada')).toContain('red');
  });

  it('retorna classes padrão para status desconhecido (cinza)', () => {
    expect(getStatusColor('outro')).toContain('gray');
  });
});
