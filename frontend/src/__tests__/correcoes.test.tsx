import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { OrdemServico } from '../types';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  corrigirPagamento: vi.fn(),
  estornarFaturamento: vi.fn(),
  cancelarFaturada: vi.fn(),
}));

vi.mock('../services/api', () => ({
  configuracaoEmpresaService: { get: api.get },
  ordemServicoService: {
    corrigirPagamento: api.corrigirPagamento,
    estornarFaturamento: api.estornarFaturamento,
    cancelarFaturada: api.cancelarFaturada,
  },
}));

import { CorrecaoFaturamentoModal } from '../components/faturamento/CorrecaoFaturamentoModal';
import { descreverPagamento } from '../utils/pagamento';

const ordem = {
  id: 7, numero: 'OS-1721', cliente: 'Diogo Ágape Hair', valor: 100, status: 'finalizada', faturada: true,
  forma_pagamento: 'dinheiro', valor_recebido: 120, data_criacao: '', prazo_entrega: '', descricao: '',
} as unknown as OrdemServico;

const preencherMotivo = (texto = 'Lançado errado') =>
  fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: texto } });

describe('CorrecaoFaturamentoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ tem_pin: true });
  });

  it('corrige para pagamento dividido enviando PIN, motivo e valores', async () => {
    api.corrigirPagamento.mockResolvedValue({});
    const onConcluido = vi.fn();
    render(<CorrecaoFaturamentoModal ordem={ordem} onConcluido={onConcluido} onClose={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Pagamento dividido em duas formas'));
    fireEvent.change(screen.getByLabelText(/Valor na primeira forma/), { target: { value: '40' } });
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Segunda forma de pagamento' })).getByRole('radio', { name: /PIX/ }));
    expect(await screen.findByText(/Segunda forma · R\$\s*60,00/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Valor recebido/), { target: { value: '50' } });
    expect(screen.getByText(/Troco: R\$\s*10,00/)).toBeTruthy();
    preencherMotivo('Cliente pagou parte no PIX');
    fireEvent.change(await screen.findByLabelText(/PIN/), { target: { value: '4321' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar correção' }));
    await waitFor(() => expect(api.corrigirPagamento).toHaveBeenCalledWith(7, {
      pin: '4321', motivo: 'Cliente pagou parte no PIX', forma_pagamento: 'dinheiro',
      forma_pagamento_2: 'pix', valor_pagamento_1: 40, valor_recebido: 50,
    }));
    expect(onConcluido).toHaveBeenCalledWith('corrigir');
  });

  it('exige motivo e PIN antes de chamar a API', async () => {
    render(<CorrecaoFaturamentoModal ordem={ordem} modoInicial="estornar" onConcluido={vi.fn()} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByRole('dialog'));
    expect(await screen.findByText('Informe o PIN.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/PIN/), { target: { value: '4321' } });
    fireEvent.submit(screen.getByRole('dialog'));
    expect(await screen.findByText('Informe o motivo da correção.')).toBeTruthy();
    expect(api.estornarFaturamento).not.toHaveBeenCalled();
  });

  it('sem PIN cadastrado não pede PIN e cancela com motivo', async () => {
    api.get.mockResolvedValue({ tem_pin: false });
    api.cancelarFaturada.mockResolvedValue({});
    render(<CorrecaoFaturamentoModal ordem={ordem} modoInicial="cancelar" onConcluido={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.queryByLabelText(/PIN/)).toBeNull());
    preencherMotivo('Cliente desistiu');
    fireEvent.submit(screen.getByRole('dialog'));
    await waitFor(() => expect(api.cancelarFaturada).toHaveBeenCalledWith(7, { pin: undefined, motivo: 'Cliente desistiu' }));
  });

  it('mostra a mensagem do servidor quando a correção é recusada', async () => {
    api.estornarFaturamento.mockRejectedValue({ response: { data: { error: 'PIN incorreto.' } } });
    render(<CorrecaoFaturamentoModal ordem={ordem} modoInicial="estornar" onConcluido={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(await screen.findByLabelText(/PIN/), { target: { value: '0000' } });
    preencherMotivo();
    fireEvent.submit(screen.getByRole('dialog'));
    expect(await screen.findByText('PIN incorreto.')).toBeTruthy();
  });
});

describe('descreverPagamento', () => {
  const base = { status: 'finalizada', faturada: true, forma_pagamento_2: null, valor_pagamento_1: null, valor_pagamento_2: null, valor_recebido: null } as const;

  it('resume pagamento simples, dividido, estornado e cancelado', () => {
    expect(descreverPagamento({ ...base, forma_pagamento: 'pix' })).toBe('PIX');
    expect(descreverPagamento({ ...base, forma_pagamento: 'dinheiro', forma_pagamento_2: 'pix', valor_pagamento_1: '40.00', valor_pagamento_2: '60.00', valor_recebido: '50.00' }))
      .toMatch(/Dinheiro R\$\s*40,00 \+ PIX R\$\s*60,00 · recebido R\$\s*50,00/);
    expect(descreverPagamento({ ...base, faturada: false, forma_pagamento: null })).toBe('Não faturada, sem pagamento');
    expect(descreverPagamento({ ...base, status: 'cancelada', faturada: false, forma_pagamento: null })).toBe('Cancelada');
  });
});
