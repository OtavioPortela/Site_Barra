import { useEffect, useState } from 'react';
import { configuracaoEmpresaService, ordemServicoService } from '../../services/api';
import type { FormaPagamento, OrdemServico } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { FORMAS_PAGAMENTO } from '../../utils/pagamento';
import { Icon } from '../common/Icon';

export type ModoCorrecao = 'corrigir' | 'estornar' | 'cancelar';

interface CorrecaoFaturamentoModalProps {
  ordem: OrdemServico | null;
  modoInicial?: ModoCorrecao;
  onConcluido: (modo: ModoCorrecao) => void;
  onClose: () => void;
}

const MODOS: { value: ModoCorrecao; label: string }[] = [
  { value: 'corrigir', label: 'Corrigir pagamento' },
  { value: 'estornar', label: 'Estornar faturamento' },
  { value: 'cancelar', label: 'Cancelar OS' },
];

const EXPLICACAO: Record<ModoCorrecao, string> = {
  corrigir: 'A OS continua faturada no mesmo dia do Caixa. Só a forma de pagamento e os valores recebidos mudam. O valor total não muda: se estiver errado, estorne e fature de novo.',
  estornar: 'A OS volta para Finalizadas no Dashboard e o pagamento é apagado. Para faturar de novo, o pagamento é informado outra vez.',
  cancelar: 'A OS é estornada e cancelada: sai do Faturamento, do Caixa e dos Débitos e passa para a aba Canceladas do Histórico.',
};

const mensagemDeErro = (error: unknown) => {
  const data = (error as { response?: { data?: { error?: string } } })?.response?.data;
  return data?.error || 'Não foi possível salvar. Tente novamente.';
};

const campo =
  'h-11 w-full rounded-[11px] border border-borda bg-white px-3.5 text-[15px] tabular-nums text-tinta placeholder:text-pedra-claro focus:border-tinta focus:outline-none focus:ring-4 focus:ring-areia/30';

export const CorrecaoFaturamentoModal = ({ ordem, modoInicial = 'corrigir', onConcluido, onClose }: CorrecaoFaturamentoModalProps) => {
  const [modo, setModo] = useState<ModoCorrecao>(modoInicial);
  const [temPin, setTemPin] = useState(true);
  const [pin, setPin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [forma, setForma] = useState<FormaPagamento | ''>('');
  const [dividido, setDividido] = useState(false);
  const [forma2, setForma2] = useState<FormaPagamento | ''>('');
  const [valor1, setValor1] = useState('');
  const [recebido, setRecebido] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!ordem) return;
    setModo(modoInicial);
    setPin('');
    setMotivo('');
    setErro('');
    setForma((ordem.forma_pagamento as FormaPagamento) ?? '');
    const eraDividido = !!(ordem.forma_pagamento_2 && ordem.valor_pagamento_1 != null);
    setDividido(eraDividido);
    setForma2(eraDividido ? (ordem.forma_pagamento_2 as FormaPagamento) : '');
    setValor1(eraDividido ? String(ordem.valor_pagamento_1) : '');
    setRecebido(ordem.valor_recebido != null ? String(ordem.valor_recebido) : '');
    configuracaoEmpresaService.get().then((c) => setTemPin(c.tem_pin)).catch(() => setTemPin(true));
  }, [ordem, modoInicial]);

  if (!ordem) return null;

  const total = Number(ordem.valor);
  const ehParceiro = !!ordem.cliente_eh_parceiro;
  const v1 = parseFloat(valor1);
  const v2 = dividido && Number.isFinite(v1) ? Math.round((total - v1) * 100) / 100 : null;
  const baseDinheiro = dividido && Number.isFinite(v1) ? v1 : total;
  const recebidoNumero = parseFloat(recebido);
  const troco = forma === 'dinheiro' && Number.isFinite(recebidoNumero) ? recebidoNumero - baseDinheiro : null;

  const validar = () => {
    if (temPin && !pin) return 'Informe o PIN.';
    if (motivo.trim().length < 3) return 'Informe o motivo da correção.';
    if (modo !== 'corrigir') return '';
    if (!forma && !ehParceiro) return 'Escolha a forma de pagamento.';
    if (dividido) {
      if (!forma2) return 'Escolha a segunda forma de pagamento.';
      if (forma2 === forma) return 'As duas formas de pagamento precisam ser diferentes.';
      if (!Number.isFinite(v1) || v1 <= 0 || v1 >= total) return `O valor da primeira forma deve ficar entre R$ 0,01 e ${formatCurrency(total - 0.01)}.`;
    }
    if (forma === 'dinheiro' && recebido && recebidoNumero < baseDinheiro) return 'O valor recebido não pode ser menor que o valor em dinheiro.';
    return '';
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    setErro('');
    setSalvando(true);
    const base = { pin: temPin ? pin : undefined, motivo: motivo.trim() };
    try {
      if (modo === 'corrigir') {
        await ordemServicoService.corrigirPagamento(ordem.id, {
          ...base,
          forma_pagamento: forma,
          forma_pagamento_2: dividido ? (forma2 as FormaPagamento) : null,
          valor_pagamento_1: dividido ? v1 : null,
          valor_recebido: forma === 'dinheiro' && recebido ? recebidoNumero : null,
        });
      } else if (modo === 'estornar') {
        await ordemServicoService.estornarFaturamento(ordem.id, base);
      } else {
        await ordemServicoService.cancelarFaturada(ordem.id, base);
      }
      onConcluido(modo);
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  };

  const chipsForma = (valor: FormaPagamento | '', onChange: (f: FormaPagamento) => void, rotulo: string) => (
    <div role="radiogroup" aria-label={rotulo} className="flex flex-wrap gap-2">
      {FORMAS_PAGAMENTO.map((f) => {
        const selecionado = valor === f.value;
        return (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={selecionado}
            onClick={() => { onChange(f.value); setErro(''); }}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] transition-colors ${
              selecionado ? 'bg-tinta font-semibold text-papel' : 'border border-borda bg-white font-medium text-tinta-suave hover:border-tinta/30'
            }`}
          >
            {selecionado && <span className="text-areia"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={1.8} /></span>}
            {f.label}
          </button>
        );
      })}
    </div>
  );

  const rotuloBotao = { corrigir: 'Salvar correção', estornar: 'Estornar faturamento', cancelar: 'Cancelar OS' }[modo];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-tinta/50 p-4" onClick={salvando ? undefined : onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="correcao-titulo"
        noValidate
        onSubmit={confirmar}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-[580px] flex-col overflow-hidden rounded-[18px] bg-papel shadow-[0_24px_60px_-20px_rgba(31,30,27,0.45)]"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.06em] text-[#8f8a80] tabular-nums">{ordem.numero} · FATURADA</span>
            <h2 id="correcao-titulo" className="font-serif text-[30px] font-semibold leading-none text-tinta">Corrigir faturamento</h2>
            <span className="text-sm text-[#6f6b62]">{ordem.cliente} · {formatCurrency(total)}</span>
          </div>
          <button type="button" onClick={onClose} disabled={salvando} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-[9px] text-pedra hover:bg-tinta/5">
            <Icon name="fechar" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          <div role="tablist" aria-label="Tipo de correção" className="grid grid-cols-3 gap-1 rounded-xl bg-[#e9e6df] p-[3px]">
            {MODOS.map((m) => (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={modo === m.value}
                onClick={() => { setModo(m.value); setErro(''); }}
                className={`min-h-[38px] rounded-[9px] px-2 text-[13px] leading-tight transition-colors ${
                  modo === m.value
                    ? `${m.value === 'cancelar' ? 'bg-terracota' : 'bg-tinta'} font-semibold text-papel`
                    : 'font-medium text-tinta-suave hover:text-tinta'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className={`rounded-xl px-4 py-3 text-[13.5px] leading-relaxed ${modo === 'cancelar' ? 'bg-terracota-fundo text-[#8c3a2f]' : 'bg-[#f0eee8] text-tinta-suave'}`}>
            {EXPLICACAO[modo]}
          </p>

          {modo === 'corrigir' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-tinta-suave">{dividido ? 'Primeira forma de pagamento' : 'Forma de pagamento'}</span>
                {chipsForma(forma, setForma, 'Forma de pagamento')}
                {ehParceiro && (
                  <button type="button" onClick={() => { setForma(''); setDividido(false); }} className={`w-fit text-[13px] font-semibold ${forma === '' ? 'text-tinta' : 'text-areia-escuro hover:text-tinta'}`}>
                    {forma === '' ? '✓ Na conta do parceiro (vai para Débitos)' : 'Deixar na conta do parceiro'}
                  </button>
                )}
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium text-tinta">
                <input id="pagamento-dividido" type="checkbox" checked={dividido} disabled={!forma} onChange={(e) => setDividido(e.target.checked)} className="h-[18px] w-[18px] accent-[#1f1e1b]" />
                Pagamento dividido em duas formas
              </label>

              {dividido && (
                <div className="flex flex-col gap-4 rounded-xl border border-borda-suave p-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-[13px] font-semibold text-tinta-suave">Valor na primeira forma (R$)</span>
                    <input id="valor-pagamento-1" type="number" min="0.01" step="0.01" value={valor1} onChange={(e) => { setValor1(e.target.value); setErro(''); }} className={campo} placeholder="0,00" />
                  </label>
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-semibold text-tinta-suave">
                      Segunda forma{v2 !== null && v2 > 0 ? ` · ${formatCurrency(v2)}` : ''}
                    </span>
                    {chipsForma(forma2, setForma2, 'Segunda forma de pagamento')}
                  </div>
                </div>
              )}

              {forma === 'dinheiro' && (
                <label className="flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-tinta-suave">Valor recebido em dinheiro (R$)</span>
                  <input id="valor-recebido" type="number" min="0" step="0.01" value={recebido} onChange={(e) => { setRecebido(e.target.value); setErro(''); }} className={campo} placeholder="Opcional, para calcular o troco" />
                  {troco !== null && troco >= 0 && <span className="text-[13px] tabular-nums text-pedra">Troco: {formatCurrency(troco)}</span>}
                </label>
              )}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-tinta-suave">Motivo <span className="text-terracota">*</span></span>
            <textarea
              id="motivo-correcao"
              value={motivo}
              onChange={(e) => { setMotivo(e.target.value); setErro(''); }}
              rows={2}
              className="w-full resize-none rounded-[11px] border border-borda bg-white px-3.5 py-2.5 text-[15px] text-tinta placeholder:text-pedra-claro focus:border-tinta focus:outline-none focus:ring-4 focus:ring-areia/30"
              placeholder={modo === 'corrigir' ? 'Ex.: cliente pagou no PIX, foi lançado como dinheiro' : modo === 'estornar' ? 'Ex.: valor total lançado errado' : 'Ex.: cliente desistiu do serviço'}
            />
            <span className="text-xs text-pedra">Fica registrado no histórico da OS, com seu nome e o horário.</span>
          </label>

          {temPin && (
            <label className="flex w-40 flex-col gap-2">
              <span className="text-[13px] font-semibold text-tinta-suave">PIN <span className="text-terracota">*</span></span>
              <input id="pin-correcao" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => { setPin(e.target.value); setErro(''); }} className={`${campo} tracking-[0.3em]`} placeholder="••••" />
            </label>
          )}

          {erro && <p role="alert" className="text-sm font-medium text-terracota">{erro}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-borda-suave px-6 py-4">
          <button type="button" onClick={onClose} disabled={salvando} className="h-11 rounded-[11px] px-4 text-sm font-semibold text-tinta-suave hover:bg-tinta/5">
            Voltar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className={`h-11 rounded-[11px] px-5 text-sm font-semibold text-papel transition-colors disabled:opacity-60 ${modo === 'cancelar' ? 'bg-terracota hover:bg-[#7c3228]' : 'bg-tinta hover:bg-black'}`}
          >
            {salvando ? 'Salvando...' : rotuloBotao}
          </button>
        </div>
      </form>
    </div>
  );
};
