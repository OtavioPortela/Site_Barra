import type { OrdemServico } from '../types';

export const getFormaPagamentoLabel = (forma?: string | null): string => {
  const labels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
  };
  return forma ? labels[forma] || forma : 'A definir';
};


export const formatarNotaTermica = (ordem: OrdemServico, _formaPagamentoOverride?: string): string => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  const formatDateHour = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Dados básicos
  const dataCriacao = ordem.data_criacao ? formatDate(ordem.data_criacao) : '-';
  const prazoEntrega = ordem.prazo_entrega ? formatDateHour(ordem.prazo_entrega) : '-';
  const statusLabel = {
    pendente: 'Pendente',
    em_desenvolvimento: 'Em Desenvolvimento',
    finalizada: 'Finalizada',
  }[ordem.status] || ordem.status;

  const valorTotal = formatCurrency(ordem.valor);

  // Dados da empresa
  const razaoSocial = 'BARRA CONFECCOES LTDA';
  const nomeFantasia = 'BARRA CONFECCOES';
  const cnpj = '59.220.325/0001-22';

  // Forma de pagamento
  const formaPgto = ordem.forma_pagamento
    ? getFormaPagamentoLabel(ordem.forma_pagamento)
    : ordem.cliente_eh_parceiro
    ? 'Conta do parceiro'
    : 'A definir';

  const observacoesSection = ordem.observacoes
    ? `${'_'.repeat(48)}
          OBSERVACOES
${'_'.repeat(48)}
${ordem.observacoes}
`
    : '';

  return `${'_'.repeat(48)}
          ${razaoSocial}
          ${nomeFantasia}
CNPJ: ${cnpj}
${'_'.repeat(48)}
        ORDEM DE SERVICO - OS
${'_'.repeat(48)}
Numero: ${ordem.numero}
Data de Criacao: ${dataCriacao}
Prazo de Entrega: ${prazoEntrega}
Status: ${statusLabel}
${'_'.repeat(48)}
           DADOS DO CLIENTE
${'_'.repeat(48)}
Cliente: ${ordem.cliente || 'CONSUMIDOR NÃO IDENTIFICADO'}
Telefone: ${ordem.cliente_telefone || '-'}
${'_'.repeat(48)}
          DETALHES DO SERVICO
${'_'.repeat(48)}
Servico: ${ordem.servico || '-'}
${'_'.repeat(48)}
            VALORES
${'_'.repeat(48)}
VALOR TOTAL: R$ ${valorTotal}
Forma de Pagamento: ${formaPgto}
${'_'.repeat(48)}
${observacoesSection}       INFORMACOES ADICIONAIS
${'_'.repeat(48)}
Criado por: ${ordem.usuario_criacao_nome || '-'}
${'_'.repeat(48)}
           Obrigado pela preferencia!
${'_'.repeat(48)}`;
};

export const imprimirNota = (ordem: OrdemServico, formaPagamentoOverride?: string) => {
    const textoNota = formatarNotaTermica(ordem, formaPagamentoOverride);

    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
      const htmlNota = textoNota.replace(/\n/g, '<br>');

      janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ordem de Serviço - ${ordem.numero}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 3mm; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.2; text-align: left; font-weight: bold; }
            }
            body { margin: 0; padding: 3mm; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.2; white-space: pre-wrap; max-width: 80mm; text-align: left; font-weight: bold; }
            .nota { white-space: pre-wrap; word-wrap: break-word; }
            .centered { text-align: center; }
          </style>
        </head>
        <body>
          <div class="nota">${htmlNota}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 100);
              }, 250);
            };
          </script>
        </body>
        </html>
      `);
      janelaImpressao.document.close();
    }
};
