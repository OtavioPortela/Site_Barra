import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ItemAgenda } from '../types';
import {
  diasDaVisao, faixaDeHoras, navegar, posicionarBlocos, resumoDoDia, tituloPeriodo, ALTURA_SLOT,
} from '../utils/agenda';
import { CartaoOSAgenda } from '../components/agenda/CartaoOSAgenda';

const item = (extra: Partial<ItemAgenda>): ItemAgenda => ({
  id: 1, numero: 'OS-1', cliente: 'Ouvidor Cabelos', servico: '1 peça', descricao: '', status: 'em_desenvolvimento',
  faturada: false, atrasada: false, prazo: new Date(2026, 8, 10, 18).toISOString(), responsavel: null, finalizado_por: null,
  criado_por: null, data_criacao: new Date(2026, 8, 7, 16).toISOString(), inicio: null, fim: null, peso_gramas: 200,
  tamanho_cabelo_cm: 45, exige_peso_final: true, limpeza_mesclagem: false, pode_mover: true, ...extra,
});

const em = (dia: number, h: number, m = 0) => new Date(2026, 8, dia, h, m).toISOString();

describe('datas da agenda', () => {
  const quinta = new Date(2026, 8, 10, 15, 10);

  it('semana vai de segunda a domingo e o mês ocupa semanas inteiras', () => {
    const semana = diasDaVisao('semana', quinta);
    expect(semana.map((d) => d.getDate())).toEqual([7, 8, 9, 10, 11, 12, 13]);
    const mes = diasDaVisao('mes', quinta);
    expect(mes.length % 7).toBe(0);
    expect([mes[0].getDate(), mes[0].getMonth()]).toEqual([31, 7]);
    expect(mes.some((d) => d.getMonth() === 8 && d.getDate() === 30)).toBe(true);
  });

  it('títulos e navegação por período', () => {
    expect(tituloPeriodo('dia', quinta)).toBe('Quinta, 10 de setembro');
    expect(tituloPeriodo('semana', quinta)).toBe('7 – 13 set 2026');
    expect(tituloPeriodo('mes', quinta)).toBe('Setembro de 2026');
    expect(navegar('semana', quinta, 1).getDate()).toBe(17);
    expect(navegar('mes', quinta, -1).getMonth()).toBe(7);
  });
});

describe('posicionarBlocos', () => {
  const dia = new Date(2026, 8, 10);

  it('posiciona pela hora e divide a largura quando há sobreposição', () => {
    const blocos = [
      item({ id: 1, inicio: em(10, 8), fim: em(10, 10, 30) }),
      item({ id: 2, inicio: em(10, 9, 30), fim: em(10, 11) }),
      item({ id: 3, inicio: em(10, 11), fim: em(10, 12) }),
    ];
    const [a, b, c] = posicionarBlocos(blocos, dia, 8);
    expect([a.top, a.coluna, a.totalColunas]).toEqual([0, 0, 2]);
    expect([b.top, b.coluna, b.totalColunas]).toEqual([ALTURA_SLOT * 3, 1, 2]);
    // Começa quando os anteriores já acabaram: volta a ocupar a largura toda
    expect([c.coluna, c.totalColunas]).toEqual([0, 1]);
    expect(a.altura).toBe(ALTURA_SLOT * 5 - 2);
  });

  it('recorta trabalho que atravessa dias', () => {
    const longo = item({ inicio: em(9, 17), fim: em(10, 9) });
    const [hoje] = posicionarBlocos([longo], dia, 8);
    expect(hoje.continuaDeAntes).toBe(true);
    expect(hoje.top).toBe(0);
    expect(posicionarBlocos([longo], new Date(2026, 8, 11), 8)).toEqual([]);
  });

  it('em andamento há dias aparece só no dia em que começou e hoje', () => {
    const andamento = item({ status: 'em_desenvolvimento', inicio: em(7, 16), fim: em(10, 15) });
    expect(posicionarBlocos([andamento], new Date(2026, 8, 7), 8)).toHaveLength(1);
    expect(posicionarBlocos([andamento], new Date(2026, 8, 8), 8)).toHaveLength(0);
    expect(posicionarBlocos([andamento], new Date(2026, 8, 10), 8)).toHaveLength(1);
    // O corte de meia-noite não abre a grade
    expect(faixaDeHoras([andamento], [new Date(2026, 8, 7), new Date(2026, 8, 10)])).toEqual({ inicio: 8, fim: 19 });
  });

  it('a grade abre fora das 8h–19h quando há trabalho', () => {
    expect(faixaDeHoras([item({ inicio: em(10, 9), fim: em(10, 12) })], [dia])).toEqual({ inicio: 8, fim: 19 });
    expect(faixaDeHoras([item({ inicio: em(10, 6, 30), fim: em(10, 20, 15) })], [dia])).toEqual({ inicio: 6, fim: 21 });
  });
});

describe('resumoDoDia', () => {
  it('conta finalizadas, em andamento (só hoje), atrasadas e a fazer', () => {
    const agora = new Date(2026, 8, 10, 15);
    const aFazer = [item({ status: 'pendente', prazo: em(10, 14), atrasada: true }), item({ status: 'pendente', prazo: em(10, 17) })];
    const blocos = [
      item({ status: 'finalizada', inicio: em(10, 8), fim: em(10, 9) }),
      item({ status: 'em_desenvolvimento', inicio: em(10, 11), fim: em(10, 15), atrasada: true }),
    ];
    expect(resumoDoDia(new Date(2026, 8, 10), aFazer, blocos, agora)).toEqual({ finalizadas: 1, andamento: 1, atrasadas: 2, aFazer: 1 });
    expect(resumoDoDia(new Date(2026, 8, 9), aFazer, blocos, agora)).toEqual({ finalizadas: 0, andamento: 0, atrasadas: 0, aFazer: 0 });
  });
});

describe('CartaoOSAgenda', () => {
  const profissionais = [{ id: 2, nome: 'Caio Souza', iniciais: 'CS', is_staff: false, em_andamento: 1, atrasadas: 0 }];
  const renderCartao = (it: ItemAgenda, ehPatrao: boolean, extra = {}) =>
    render(
      <MemoryRouter>
        <CartaoOSAgenda item={it} profissionais={profissionais} ehPatrao={ehPatrao} onFechar={vi.fn()} onAbrirOS={vi.fn()}
          onComecar={vi.fn().mockResolvedValue(undefined)} onFinalizar={vi.fn()} onTrocarResponsavel={vi.fn().mockResolvedValue(undefined)} {...extra} />
      </MemoryRouter>
    );

  it('OS a fazer oferece Começar agora', () => {
    const onComecar = vi.fn().mockResolvedValue(undefined);
    renderCartao(item({ status: 'pendente' }), false, { onComecar });
    fireEvent.click(screen.getByRole('button', { name: 'Começar agora' }));
    expect(onComecar).toHaveBeenCalled();
    expect(screen.getByText('Ninguém ainda')).toBeTruthy();
  });

  it('só o patrão troca o responsável', () => {
    const emAndamento = item({ responsavel: { id: 2, nome: 'Caio Souza', iniciais: 'CS' }, inicio: em(10, 11), fim: em(10, 15) });
    const { unmount } = renderCartao(emAndamento, false);
    expect(screen.queryByLabelText('Trocar responsável')).toBeNull();
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeTruthy();
    unmount();
    renderCartao(emAndamento, true);
    expect(screen.getByLabelText('Trocar responsável')).toBeTruthy();
  });

  it('faturada não tem ações e funcionário não vê valor', () => {
    renderCartao(item({ status: 'finalizada', faturada: true, inicio: em(9, 9), fim: em(9, 10) }), false);
    expect(screen.queryByRole('button', { name: 'Abrir OS' })).toBeNull();
    expect(screen.getByText(/Ajustes só pelo patrão/)).toBeTruthy();
    expect(screen.queryByText('Valor')).toBeNull();
  });
});
