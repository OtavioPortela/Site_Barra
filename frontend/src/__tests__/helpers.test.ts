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
  it('formata data ISO para dd/mm/yyyy', () => {
    const resultado = formatDate('2025-12-25');
    expect(resultado).toBe('25/12/2025');
  });

  it('retorna a string original se data inválida', () => {
    const resultado = formatDate('data-invalida');
    expect(resultado).toBe('data-invalida');
  });

  it('formata data com hora ISO', () => {
    const resultado = formatDate('2025-06-15T10:30:00');
    expect(resultado).toMatch(/15\/06\/2025/);
  });
});

describe('formatDateTime', () => {
  it('formata data com hora', () => {
    const resultado = formatDateTime('2025-06-15T10:30:00');
    expect(resultado).toMatch(/15\/06\/2025/);
    expect(resultado).toMatch(/10:30/);
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

  it('retorna o próprio valor para status desconhecido', () => {
    expect(getStatusLabel('outro')).toBe('outro');
  });
});

describe('getStatusColor', () => {
  it('retorna classes para pendente', () => {
    const cor = getStatusColor('pendente');
    expect(cor).toContain('yellow');
  });

  it('retorna classes para em_desenvolvimento', () => {
    const cor = getStatusColor('em_desenvolvimento');
    expect(cor).toContain('blue');
  });

  it('retorna classes para finalizada', () => {
    const cor = getStatusColor('finalizada');
    expect(cor).toContain('green');
  });

  it('retorna classes padrão para status desconhecido', () => {
    const cor = getStatusColor('outro');
    expect(cor).toContain('gray');
  });
});
