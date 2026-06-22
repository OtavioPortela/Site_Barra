import { useEffect, useState } from 'react';
import { ordemServicoService } from '../../services/api';
import type { OrdemServico } from '../../types';
import { formatarNotaTermica, imprimirNota } from '../../utils/printHelpers';

interface ImprimirNotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkip?: () => void;
  ordem: OrdemServico | null;
  apenasImprimir?: boolean; // Se true, não fatura, apenas imprime
  apenasVisualizar?: boolean; // Se true, apenas mostra a nota (sem opção de imprimir)
}

  // Funções formatarNotaTermica e getFormaPagamentoLabel foram movidas para printHelpers


export const ImprimirNotaModal = ({ isOpen, onClose, onConfirm, onSkip, ordem, apenasImprimir = false, apenasVisualizar = false }: ImprimirNotaModalProps) => {
  const [loading, setLoading] = useState(false);
  const [ordemCompleta, setOrdemCompleta] = useState<OrdemServico | null>(null);
  const [loadingOrdem, setLoadingOrdem] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | ''>('');
  const [adicionarAConta, setAdicionarAConta] = useState(false);
  const [ehParceiro, setEhParceiro] = useState(false);
  const [pagamentoDividido, setPagamentoDividido] = useState(false);
  const [formaPagamento2, setFormaPagamento2] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | ''>('');
  const [valorPagamento1, setValorPagamento1] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');

  // Buscar dados completos da OS quando o modal abrir
  useEffect(() => {
    if (isOpen && ordem) {
      const buscarOrdemCompleta = async () => {
        setLoadingOrdem(true);
        try {
          const ordemDetalhada = await ordemServicoService.getById(ordem.id);
          setOrdemCompleta(ordemDetalhada);

          // Verificar se cliente é parceiro
          if (ordemDetalhada.cliente_eh_parceiro) {
            setEhParceiro(true);
          }

          // Inicializar forma de pagamento se já existir na OS
          if (ordemDetalhada.forma_pagamento) {
            setFormaPagamento(ordemDetalhada.forma_pagamento);
          } else if (ordemDetalhada.pago_na_entrega) {
            // Se for pago na entrega e não for apenas visualizar, definir dinheiro como padrão
            setFormaPagamento('dinheiro');
          } else if (ordemDetalhada.cliente_eh_parceiro && !ordemDetalhada.forma_pagamento) {
            // Se for parceiro e não tiver forma de pagamento, pode estar pendurado na conta
            setAdicionarAConta(true);
          }
        } catch (error) {
          console.error('Erro ao buscar dados completos da OS:', error);
          // Se falhar, usar os dados que já temos
          setOrdemCompleta(ordem);
        } finally {
          setLoadingOrdem(false);
        }
      };
      buscarOrdemCompleta();
    } else {
      setOrdemCompleta(null);
      setFormaPagamento('');
      setAdicionarAConta(false);
      setEhParceiro(false);
      setPagamentoDividido(false);
      setFormaPagamento2('');
      setValorPagamento1('');
      setValorRecebido('');
    }
  }, [isOpen, ordem, apenasVisualizar]);

  if (!isOpen || !ordem) return null;

  // Usar ordem completa se disponível, senão usar a ordem básica
  const ordemParaNota = ordemCompleta || ordem;

  const handleImprimir = () => {
    if (!ordemParaNota) return;

    const total = Number(ordemParaNota.valor);
    const v1 = pagamentoDividido && valorPagamento1 ? parseFloat(valorPagamento1) : null;
    const fpAtual = (formaPagamento || ordemParaNota.forma_pagamento) as any;
    const base = (pagamentoDividido && v1 !== null) ? v1 : total;
    const trocoImprimir = (fpAtual === 'dinheiro' && valorRecebido && !isNaN(parseFloat(valorRecebido)))
      ? Math.max(0, parseFloat(valorRecebido) - base)
      : null;
    const ordemParaImprimir = {
      ...ordemParaNota,
      forma_pagamento: fpAtual,
      forma_pagamento_2: pagamentoDividido && formaPagamento2 ? formaPagamento2 : null,
      valor_pagamento_1: v1,
      valor_pagamento_2: v1 !== null ? parseFloat((total - v1).toFixed(2)) : null,
      troco: trocoImprimir,
    };

    imprimirNota(ordemParaImprimir);
  };

  const handleCopiarTexto = async () => {
    if (!ordemParaNota) return;

    // Usar forma de pagamento selecionada ou salva
    const ordemParaNotaComPagamento = {
      ...ordemParaNota,
      forma_pagamento: formaPagamento || ordemParaNota.forma_pagamento
    };
    const textoNota = formatarNotaTermica(ordemParaNotaComPagamento);
    try {
      await navigator.clipboard.writeText(textoNota);
      alert('Texto copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      alert('Erro ao copiar texto. Tente selecionar e copiar manualmente.');
    }
  };

  const handleConfirmar = async () => {
    if (ehParceiro && adicionarAConta) {
      // Parceiro escolheu adicionar à conta, forma_pagamento será null
    } else if (!ehParceiro && !formaPagamento) {
      alert('Por favor, selecione a forma de pagamento');
      return;
    } else if (ehParceiro && !adicionarAConta && !formaPagamento) {
      alert('Por favor, selecione a forma de pagamento ou adicione à conta do parceiro');
      return;
    }
    if (pagamentoDividido) {
      if (!formaPagamento2) { alert('Selecione a segunda forma de pagamento'); return; }
      const v1 = parseFloat(valorPagamento1);
      const total = ordemParaNota ? Number(ordemParaNota.valor) : 0;
      if (isNaN(v1) || v1 <= 0 || v1 >= total) {
        alert(`O valor da primeira forma deve ser entre R$ 0,01 e R$ ${(total - 0.01).toFixed(2)}`);
        return;
      }
    }

    setLoading(true);
    try {
      // Salvar forma de pagamento na OS (apenas se não for apenas visualizar)
      if (ordemParaNota) {
        const formaPagamentoToSave = (ehParceiro && adicionarAConta)
          ? undefined
          : (formaPagamento || undefined);

        const total = Number(ordemParaNota.valor);
        const v1 = pagamentoDividido && valorPagamento1 ? parseFloat(valorPagamento1) : null;
        const v2 = v1 !== null ? parseFloat((total - v1).toFixed(2)) : null;
        const vRecebido = (formaPagamentoToSave === 'dinheiro' || (formaPagamentoToSave === undefined && ordemParaNota.forma_pagamento === 'dinheiro')) && valorRecebido
          ? parseFloat(valorRecebido)
          : null;

        await ordemServicoService.update(ordemParaNota.id, {
          forma_pagamento: formaPagamentoToSave,
          forma_pagamento_2: (pagamentoDividido && formaPagamento2) ? formaPagamento2 : null,
          valor_pagamento_1: v1 ?? undefined,
          valor_pagamento_2: v2 ?? undefined,
          valor_recebido: vRecebido ?? undefined,
        } as any);

        // Se for adicionar à conta, não faturar (apenas atualiza o status de pagamento para nulo)
        if (ehParceiro && adicionarAConta) {
          // Faturar a OS para sair do kanban (forma_pagamento permanece null → aparece em Débitos)
          await onConfirm();
          onClose();
          return;
        }

        // Atualizar ordemParaNota para usar a forma de pagamento atualizada
        const ordemAtualizada = await ordemServicoService.getById(ordemParaNota.id);
        setOrdemCompleta(ordemAtualizada);
      }

      if (apenasImprimir) {
        // Apenas imprimir, não faturar
        handleImprimir();
        // Chamar onConfirm para notificar que a nota foi emitida
        onConfirm();
        // Aguardar um pouco antes de fechar para garantir que a impressão iniciou
        setTimeout(() => {
          onClose();
        }, 500);
      } else if (apenasVisualizar) {
        // Apenas visualizar, faturar sem imprimir
        await onConfirm();
        onClose();
      } else {
        // Faturar e imprimir (comportamento antigo - não usado mais)
        await onConfirm();
        handleImprimir();
        onClose();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar forma de pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{apenasVisualizar ? 'Faturar' : apenasImprimir ? 'Emitir NFC-e' : 'Faturar'} OS #{ordem.numero}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            {apenasVisualizar
              ? `Abaixo está a nota fiscal que foi impressa quando a OS foi entregue.`
              : apenasImprimir
              ? <>Deseja emitir a NFC-e (Nota Fiscal de Consumidor Eletrônica) da OS <strong>#{ordem?.numero}</strong>?</>
              : <>Deseja imprimir a nota fiscal da OS <strong>#{ordem?.numero}</strong>?</>}
          </p>

          {loadingOrdem ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-gray-500">Carregando dados da OS...</div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800">
                {ordemParaNota ? (() => {
                  const total = Number(ordemParaNota.valor);
                  const v1 = pagamentoDividido && valorPagamento1 ? parseFloat(valorPagamento1) : null;
                  const fpAtual = (formaPagamento || ordemParaNota.forma_pagamento) as any;
                  const base = (pagamentoDividido && v1 !== null) ? v1 : total;
                  const trocoPreview = (fpAtual === 'dinheiro' && valorRecebido && !isNaN(parseFloat(valorRecebido)))
                    ? Math.max(0, parseFloat(valorRecebido) - base)
                    : null;
                  return formatarNotaTermica({
                    ...ordemParaNota,
                    forma_pagamento: fpAtual,
                    forma_pagamento_2: pagamentoDividido && formaPagamento2 ? formaPagamento2 : null,
                    valor_pagamento_1: v1,
                    valor_pagamento_2: v1 !== null ? parseFloat((total - v1).toFixed(2)) : null,
                    troco: trocoPreview,
                  });
                })() : ''}
              </pre>
            </div>
          )}

          {!apenasVisualizar && (
            <div className="flex gap-2">
              <button
                onClick={handleCopiarTexto}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                📋 Copiar Texto
              </button>
            </div>
          )}

          {/* Forma de Pagamento */}
          {(
            <div className="mt-4 space-y-4">
              {/* Se for parceiro, mostrar opção de adicionar à conta */}
              {ehParceiro && (
                <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="adicionarConta"
                    checked={adicionarAConta}
                    onChange={(e) => {
                      setAdicionarAConta(e.target.checked);
                      if (e.target.checked) {
                        setFormaPagamento(''); // Limpar forma de pagamento se marcar conta
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="adicionarConta" className="text-sm font-medium text-gray-700 cursor-pointer">
                    📋 Adicionar à conta do parceiro (deixar pendurado)
                  </label>
                </div>
              )}

              {/* Forma de Pagamento - apenas se não for adicionar à conta */}
              {!adicionarAConta && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento {!ehParceiro && '*'}
                    </label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      required={!ehParceiro}
                    >
                      <option value="">Selecione a forma de pagamento</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                    </select>
                  </div>

                  {/* Toggle pagamento dividido */}
                  {formaPagamento && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pagamentoDividido"
                        checked={pagamentoDividido}
                        onChange={e => {
                          setPagamentoDividido(e.target.checked);
                          if (!e.target.checked) { setFormaPagamento2(''); setValorPagamento1(''); }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="pagamentoDividido" className="text-sm text-gray-700 cursor-pointer">
                        Pagamento dividido (duas formas)
                      </label>
                    </div>
                  )}

                  {/* Valor recebido (dinheiro) */}
                  {(formaPagamento === 'dinheiro') && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Valor recebido (R$)
                          </label>
                          <input
                            type="number"
                            min={pagamentoDividido && valorPagamento1 ? parseFloat(valorPagamento1) : Number(ordemParaNota?.valor)}
                            step="0.01"
                            value={valorRecebido}
                            onChange={e => setValorRecebido(e.target.value)}
                            placeholder={pagamentoDividido && valorPagamento1 ? valorPagamento1 : String(ordemParaNota?.valor ?? '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Troco
                          </label>
                          <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                            valorRecebido && !isNaN(parseFloat(valorRecebido))
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {valorRecebido && !isNaN(parseFloat(valorRecebido))
                              ? (() => {
                                  const base = pagamentoDividido && valorPagamento1 ? parseFloat(valorPagamento1) : Number(ordemParaNota?.valor ?? 0);
                                  const troco = parseFloat(valorRecebido) - base;
                                  return troco >= 0
                                    ? `R$ ${troco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    : 'Valor insuficiente';
                                })()
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos do pagamento dividido */}
                  {pagamentoDividido && ordemParaNota && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Valor — {formaPagamento ? formaPagamento.replace('_', ' ') : 'Forma 1'} (R$)
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={Number(ordemParaNota.valor) - 0.01}
                            value={valorPagamento1}
                            onChange={e => setValorPagamento1(e.target.value)}
                            placeholder="0,00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Restante (R$)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={
                              valorPagamento1 && !isNaN(parseFloat(valorPagamento1))
                                ? (Number(ordemParaNota.valor) - parseFloat(valorPagamento1)).toFixed(2)
                                : '-'
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Segunda forma *</label>
                        <select
                          value={formaPagamento2}
                          onChange={e => setFormaPagamento2(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione</option>
                          {(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'] as const)
                            .filter(f => f !== formaPagamento)
                            .map(f => (
                              <option key={f} value={f}>
                                {f === 'dinheiro' ? 'Dinheiro' : f === 'pix' ? 'PIX' : f === 'cartao_credito' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end space-x-4 pt-4 px-6 pb-6 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          {apenasVisualizar ? (
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Faturando...' : 'Faturar'}
            </button>
          ) : apenasImprimir ? (
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Imprimindo...' : 'Imprimir Nota'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Faturando...' : 'Sim, Faturar e Imprimir'}
              </button>
              {onSkip && (
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await onSkip();
                      onClose();
                    } catch (error) {
                      console.error('Erro ao faturar:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Faturando...' : 'Não, Apenas Faturar'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

