import { describe, it, expect } from 'vitest';
import { paginar, ordenarPorPrazo, ITENS_POR_PAGINA } from '../utils/paginacao';

const lista = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('paginar', () => {
  it('usa 5 itens por página', () => {
    expect(ITENS_POR_PAGINA).toBe(5);
  });

  it('recorta a primeira página e conta o total de páginas', () => {
    expect(paginar(lista(12), 1)).toEqual({ itens: [1, 2, 3, 4, 5], paginaAtual: 1, totalPaginas: 3 });
  });

  it('última página traz só o que sobrou', () => {
    expect(paginar(lista(12), 3)).toEqual({ itens: [11, 12], paginaAtual: 3, totalPaginas: 3 });
  });

  it('cai na última página válida quando a lista encolhe', () => {
    expect(paginar(lista(10), 3)).toEqual({ itens: [6, 7, 8, 9, 10], paginaAtual: 2, totalPaginas: 2 });
  });

  it('corrige página zero, negativa ou inválida para 1', () => {
    expect(paginar(lista(7), 0).paginaAtual).toBe(1);
    expect(paginar(lista(7), -2).paginaAtual).toBe(1);
    expect(paginar(lista(7), Number.NaN).paginaAtual).toBe(1);
  });

  it('lista vazia tem uma página sem itens', () => {
    expect(paginar([], 4)).toEqual({ itens: [], paginaAtual: 1, totalPaginas: 1 });
  });
});

describe('ordenarPorPrazo', () => {
  it('coloca o prazo mais próximo (e os atrasados) primeiro, sem alterar a lista original', () => {
    const ordens = [
      { id: 1, prazo_entrega: '2026-09-15T12:00:00Z' },
      { id: 2, prazo_entrega: '2026-09-10T08:00:00Z' },
      { id: 3, prazo_entrega: 'data-invalida' },
      { id: 4, prazo_entrega: '2026-09-12T18:30:00Z' },
    ];
    expect(ordenarPorPrazo(ordens).map((o) => o.id)).toEqual([2, 4, 1, 3]);
    expect(ordens.map((o) => o.id)).toEqual([1, 2, 3, 4]);
  });
});
