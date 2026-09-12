import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { calcularPerda, periodoDoPreset } from '../utils/material';
import { FinalizarOSModal } from '../components/dashboard/FinalizarOSModal';

const mockAuth = { isPatrao: () => false, user: { nome: 'Func', email: 'f@barra.com' }, logout: vi.fn() };
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => mockAuth }));

import { Sidebar } from '../components/common/Sidebar';

describe('calcularPerda', () => {
  it('calcula percentual e gramas perdidas', () => {
    expect(calcularPerda(200, 168)).toEqual({ percentual: 16, gramas: 32, acimaDoEsperado: false });
  });

  it('marca acima de 20%, ou de 40% com limpeza/mesclagem', () => {
    expect(calcularPerda(200, 145)?.acimaDoEsperado).toBe(true);
    expect(calcularPerda(200, 145, true)?.acimaDoEsperado).toBe(false);
    expect(calcularPerda(200, 110, true)?.acimaDoEsperado).toBe(true);
  });

  it('ignora peso final inválido ou maior que a entrada', () => {
    expect(calcularPerda(200, Number.NaN)).toBeNull();
    expect(calcularPerda(200, 0)).toBeNull();
    expect(calcularPerda(200, 250)).toBeNull();
    expect(calcularPerda(0, 100)).toBeNull();
  });
});

describe('periodoDoPreset', () => {
  const hoje = new Date(2026, 8, 12, 23, 30); // 12/09/2026 às 23h30, quando UTC já é dia 13

  it('este mês vai do dia 1 até hoje, em data local', () => {
    expect(periodoDoPreset('mes', hoje)).toEqual({ data_inicio: '2026-09-01', data_fim: '2026-09-12' });
  });

  it('mês passado cobre o mês inteiro', () => {
    expect(periodoDoPreset('mes_passado', hoje)).toEqual({ data_inicio: '2026-08-01', data_fim: '2026-08-31' });
  });

  it('90 dias inclui hoje', () => {
    expect(periodoDoPreset('90_dias', hoje)).toEqual({ data_inicio: '2026-06-15', data_fim: '2026-09-12' });
  });
});

describe('FinalizarOSModal', () => {
  const ordem = { id: 1, numero: 'OS-1733', cliente: 'Arthur Luxury Hair', servico: '1 peça', peso_gramas: 200, tamanho_cabelo_cm: 45 };

  it('exige o peso final e mostra a perda enquanto digita', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<FinalizarOSModal ordem={{ ...ordem, exige_peso_final: true }} onConfirm={onConfirm} onInformarDepois={vi.fn()} onClose={vi.fn()} />);

    expect(screen.queryByText('Informar depois')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Finalizar/ }));
    expect(await screen.findByText('Informe o peso final em gramas.')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Peso final/), { target: { value: '145' } });
    expect(screen.getByText('Perda de 27,5% (55 g)')).toBeTruthy();
    expect(screen.getByText(/Acima dos 20% esperados/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Finalizar/ }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ peso_final_gramas: 145 }));
  });

  it('recusa peso final maior que o de entrada', async () => {
    const onConfirm = vi.fn();
    render(<FinalizarOSModal ordem={ordem} onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Peso final/), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: /Finalizar/ }));
    expect(await screen.findByText('O peso final não pode ser maior que o de entrada (200 g).')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('OS antiga pode informar depois', async () => {
    const onInformarDepois = vi.fn().mockResolvedValue(undefined);
    render(<FinalizarOSModal ordem={{ ...ordem, exige_peso_final: false }} onConfirm={vi.fn()} onInformarDepois={onInformarDepois} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Informar depois'));
    await waitFor(() => expect(onInformarDepois).toHaveBeenCalled());
  });

  it('mostra a mensagem do backend quando a API recusa', async () => {
    const onConfirm = vi.fn().mockRejectedValue({ response: { data: { error: 'Informe o peso final para finalizar esta OS.' } } });
    render(<FinalizarOSModal ordem={ordem} onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Peso final/), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: /Finalizar/ }));
    expect(await screen.findByText('Informe o peso final para finalizar esta OS.')).toBeTruthy();
  });
});

describe('Sidebar — item Material', () => {
  const renderSidebar = () =>
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    );

  it('funcionário não vê Material', () => {
    mockAuth.isPatrao = () => false;
    renderSidebar();
    expect(screen.queryAllByText('Material')).toHaveLength(0);
  });

  it('patrão/admin vê Material', () => {
    mockAuth.isPatrao = () => true;
    renderSidebar();
    // Aparece no menu desktop e no mobile
    expect(screen.getAllByText('Material').length).toBeGreaterThan(0);
  });
});
