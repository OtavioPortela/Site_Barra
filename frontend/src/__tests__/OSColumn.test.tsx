import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { OSColumn } from '../components/dashboard/OSColumn';
import type { OrdemServico } from '../types';

const criarOrdens = (n: number): OrdemServico[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    numero: `OS-${String(i + 1).padStart(4, '0')}`,
    cliente: `Cliente ${i + 1}`,
    servico: '1 peça',
    status: 'pendente',
    valor: 100,
    data_criacao: '2026-09-10T12:00:00Z',
    prazo_entrega: '2099-01-01T12:00:00Z',
    faturada: false,
  }) as OrdemServico);

const renderColuna = (ordens: OrdemServico[], pagina: number, onPaginaChange = vi.fn()) => {
  render(
    <DndContext>
      <OSColumn
        id="pendente"
        title="Pendente"
        ordens={ordens}
        onViewDetails={vi.fn()}
        pagina={pagina}
        onPaginaChange={onPaginaChange}
      />
    </DndContext>
  );
  return onPaginaChange;
};

describe('OSColumn — paginação', () => {
  it('mostra 5 cartões, o total no título e a navegação', () => {
    renderColuna(criarOrdens(12), 1);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByText('OS-0001')).toBeTruthy();
    expect(screen.queryByText('OS-0006')).toBeNull();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('1 de 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toHaveProperty('disabled', true);
  });

  it('avança e volta de página pelos botões', () => {
    const onPaginaChange = renderColuna(criarOrdens(12), 2);
    expect(screen.getByText('OS-0006')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(onPaginaChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onPaginaChange).toHaveBeenCalledWith(1);
  });

  it('última página mostra o restante e desabilita "próxima"', () => {
    renderColuna(criarOrdens(12), 3);
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Próxima página' })).toHaveProperty('disabled', true);
  });

  it('não mostra navegação quando cabe tudo em uma página', () => {
    renderColuna(criarOrdens(5), 1);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('corrige a página guardada quando a coluna encolhe', () => {
    const onPaginaChange = renderColuna(criarOrdens(6), 3);
    expect(screen.getByText('OS-0006')).toBeTruthy();
    expect(onPaginaChange).toHaveBeenCalledWith(2);
  });
});
