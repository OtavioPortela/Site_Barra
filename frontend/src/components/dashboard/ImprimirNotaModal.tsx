import { useEffect, useState } from 'react';
import { ordemServicoService } from '../../services/api';
import type { OrdemServico } from '../../types';

interface ImprimirNotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkip?: () => void;
  ordem: OrdemServico | null;
  apenasImprimir?: boolean; // Se true, não fatura, apenas imprime
  apenasVisualizar?: boolean; // Se true, apenas mostra a nota (sem opção de imprimir)
}

const getFormaPagamentoLabel = (forma?: string | null): string => {
  const labels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
  };
  return forma ? labels[forma] || forma : 'A definir';
};

const formatarNotaTermica = (ordem: OrdemServico): string => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const dataEmissao = ordem.data_criacao ? formatDate(ordem.data_criacao) : new Date().toLocaleDateString('pt-BR');
  const horaEmissao = ordem.data_criacao ? formatTime(ordem.data_criacao) : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const valorTotal = formatCurrency(ordem.valor);
  const valorUnitario = ordem.valor_metro ? formatCurrency(ordem.valor_metro) : valorTotal;

  // Dados da empresa
  const razaoSocial = 'BARRA CONFECCOES LTDA';
  const nomeFantasia = 'BARRA CONFECCOES';
  const cnpj = '59.220.325/0001-22';
  // const endereco = 'ENDEREÇO DA EMPRESA'; // Você pode adicionar o endereço real aqui
  // const telefone = '(00) 0000-0000'; // Você pode adicionar o telefone real aqui

  // Gerar número fictício da NFC-e (normalmente vem do sistema fiscal)
  const numeroNF = ordem.numero.replace('OS-', '').padStart(9, '0');
  const serieNF = '1';
  const codigoVerificacao = Math.random().toString(36).substring(2, 10).toUpperCase();

  return `${'='.repeat(48)}
          ${razaoSocial}
          ${nomeFantasia}
CNPJ: ${cnpj}
${'='.repeat(48)}
           NFC-e - MODELO 65
     NOTA FISCAL DE CONSUMIDOR
          ELETRONICA
${'='.repeat(48)}
Numero: ${numeroNF}  Serie: ${serieNF}
${dataEmissao} ${horaEmissao}
Codigo de Verificacao:
${codigoVerificacao}
${'='.repeat(48)}
           DADOS DO CONSUMIDOR
${'='.repeat(48)}
Consumidor: ${ordem.cliente || 'CONSUMIDOR NÃO IDENTIFICADO'}
${'='.repeat(48)}
                PRODUTOS
${'='.repeat(48)}
${ordem.servico || 'SERVIÇO'}
Qtd: 1.00    Unit: R$ ${valorUnitario}
Total: R$ ${valorTotal}
${'='.repeat(48)}
            RESUMO DA VENDA
${'='.repeat(48)}
Qtde. total de itens: 1
VALOR TOTAL R$ ${valorTotal}
${'='.repeat(48)}
            FORMA DE PAGAMENTO
${'='.repeat(48)}
${getFormaPagamentoLabel(ordem.forma_pagamento || (ordem.pago_na_entrega ? 'dinheiro' : null))}
Valor pago: R$ ${valorTotal}
${'='.repeat(48)}
     Consulte pela Chave de Acesso
     em www.nfce.fazenda.gov.br
${'='.repeat(48)}
           Obrigado pela preferencia!
${'='.repeat(48)}`;
};

export const ImprimirNotaModal = ({ isOpen, onClose, onConfirm, onSkip, ordem, apenasImprimir = false, apenasVisualizar = false }: ImprimirNotaModalProps) => {
  const [loading, setLoading] = useState(false);
  const [ordemCompleta, setOrdemCompleta] = useState<OrdemServico | null>(null);
  const [loadingOrdem, setLoadingOrdem] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | ''>('');
  const [adicionarAConta, setAdicionarAConta] = useState(false);
  const [ehParceiro, setEhParceiro] = useState(false);

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
          } else if (ordemDetalhada.pago_na_entrega && !apenasVisualizar) {
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
      setFormaPagamento(''); // Reset ao fechar
      setAdicionarAConta(false);
      setEhParceiro(false);
    }
  }, [isOpen, ordem, apenasVisualizar]);

  if (!isOpen || !ordem) return null;

  // Usar ordem completa se disponível, senão usar a ordem básica
  const ordemParaNota = ordemCompleta || ordem;

  const handleImprimir = () => {
    if (!ordemParaNota) return;

    // Usar forma de pagamento selecionada ou salva
    const ordemParaImprimir = {
      ...ordemParaNota,
      forma_pagamento: formaPagamento || ordemParaNota.forma_pagamento
    };
    const textoNota = formatarNotaTermica(ordemParaImprimir);

    // Criar uma nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
      // Converter quebras de linha para HTML (NFC-e não usa asteriscos)
      let htmlNota = textoNota.replace(/\n/g, '<br>');

      janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nota Fiscal - OS ${ordem.numero}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 3mm;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                line-height: 1.2;
                text-align: center;
              }
            }
            body {
              margin: 0;
              padding: 3mm;
              font-family: 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.2;
              white-space: pre-wrap;
              max-width: 80mm;
              text-align: center;
            }
            .nota {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            strong {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="nota">${htmlNota}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 100);
              }, 250);
            };
          </script>
        </body>
        </html>
      `);
      janelaImpressao.document.close();
    }
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
    // Validar forma de pagamento (apenas se não for apenas visualizar)
    // Se for parceiro e marcar adicionar à conta, não precisa validar forma de pagamento
    if (!apenasVisualizar) {
      if (ehParceiro && adicionarAConta) {
        // Parceiro escolheu adicionar à conta, forma_pagamento será null
      } else if (!ehParceiro && !formaPagamento) {
        alert('Por favor, selecione a forma de pagamento');
        return;
      } else if (ehParceiro && !adicionarAConta && !formaPagamento) {
        alert('Por favor, selecione a forma de pagamento ou adicione à conta do parceiro');
        return;
      }
    }

    setLoading(true);
    try {
      // Salvar forma de pagamento na OS (apenas se não for apenas visualizar)
      if (ordemParaNota && !apenasVisualizar) {
        // Se for parceiro e marcar adicionar à conta, enviar undefined (null no backend)
        // Caso contrário, enviar forma de pagamento selecionada
        const formaPagamentoToSave = (ehParceiro && adicionarAConta)
          ? undefined
          : (formaPagamento || undefined);
        await ordemServicoService.update(ordemParaNota.id, { forma_pagamento: formaPagamentoToSave });

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
              ? `Deseja emitir a NFC-e (Nota Fiscal de Consumidor Eletrônica) da OS <strong>#{ordem.numero}</strong>?`
              : `Deseja imprimir a nota fiscal da OS <strong>#{ordem.numero}</strong>?`}
          </p>

          {loadingOrdem ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-gray-500">Carregando dados da OS...</div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800">
                {ordemParaNota ? formatarNotaTermica({
                  ...ordemParaNota,
                  forma_pagamento: formaPagamento || ordemParaNota.forma_pagamento
                }) : ''}
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

          {/* Forma de Pagamento - apenas se não for apenas visualizar */}
          {!apenasVisualizar && (
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

