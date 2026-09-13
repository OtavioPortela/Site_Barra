import type { FormaPagamento, FotografiaPagamento } from '../types';
import { formatCurrency } from './helpers';

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
];

export const rotuloForma = (forma: string | null | undefined) =>
  FORMAS_PAGAMENTO.find((f) => f.value === forma)?.label ?? (forma ? forma : 'Conta do parceiro');

/** Resumo legível do pagamento guardado no histórico, ex.: "Dinheiro R$ 40,00 + PIX R$ 60,00". */
export function descreverPagamento(dados: Pick<FotografiaPagamento, 'faturada' | 'forma_pagamento' | 'forma_pagamento_2' | 'valor_pagamento_1' | 'valor_pagamento_2' | 'valor_recebido' | 'status'>) {
  if (dados.status === 'cancelada') return 'Cancelada';
  if (!dados.faturada) return 'Não faturada, sem pagamento';
  let texto = dados.forma_pagamento_2 && dados.valor_pagamento_1 && dados.valor_pagamento_2
    ? `${rotuloForma(dados.forma_pagamento)} ${formatCurrency(Number(dados.valor_pagamento_1))} + ${rotuloForma(dados.forma_pagamento_2)} ${formatCurrency(Number(dados.valor_pagamento_2))}`
    : rotuloForma(dados.forma_pagamento);
  if (dados.valor_recebido) texto += ` · recebido ${formatCurrency(Number(dados.valor_recebido))}`;
  return texto;
}
