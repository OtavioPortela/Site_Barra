import type { OrdemServico } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';
import { Icon } from '../common/Icon';

function getPrazoInfo(prazoEntrega: string, status: OrdemServico['status']) {
  if (status === 'finalizada') return null;
  const agora = new Date();
  const prazo = new Date(prazoEntrega);
  const diffMs = prazo.getTime() - agora.getTime();
  const diffMin = Math.round(diffMs / (1000 * 60));
  const diffH = Math.floor(Math.abs(diffMin) / 60);
  const diffM = Math.abs(diffMin) % 60;

  if (diffMin < 0) {
    const label = diffH > 0 ? `Atrasado ${diffH}h${diffM > 0 ? ` ${diffM}min` : ''}` : `Atrasado ${diffM}min`;
    return { label, badge: 'bg-terracota-fundo text-terracota' };
  }
  if (diffMin < 60) {
    return { label: `${diffMin}min restantes`, badge: 'bg-terracota-fundo text-terracota' };
  }
  if (diffH <= 6) {
    const label = `${diffH}h${diffM > 0 ? ` ${diffM}min` : ''} restantes`;
    return { label, badge: 'bg-ocre-fundo text-ocre' };
  }
  const dias = Math.floor(diffH / 24);
  const hRest = diffH % 24;
  const label = dias > 0 ? `${dias}d ${hRest > 0 ? `${hRest}h` : ''}`.trim() + ' restantes' : `${diffH}h restantes`;
  return { label, badge: 'bg-salvia-fundo text-salvia' };
}

interface OSCardProps {
  ordem: OrdemServico;
  onViewDetails: (ordem: OrdemServico) => void;
  onChangeStatus?: (ordem: OrdemServico, newStatus: OrdemServico['status']) => void;
  onFaturar?: (ordem: OrdemServico) => void;
  onEmitirNota?: (ordem: OrdemServico) => void;
  onToggleEntregue?: (ordem: OrdemServico, newEntregue: boolean) => void;
  onEnviarWhatsApp?: (ordem: OrdemServico) => void;
  ordensEnviadasWhatsApp?: Set<number>;
  ordensNotaEmitida?: Set<number>;
}

export const OSCard = ({ ordem, onViewDetails, onChangeStatus, onFaturar, onEmitirNota, onToggleEntregue, onEnviarWhatsApp, ordensEnviadasWhatsApp, ordensNotaEmitida }: OSCardProps) => {
  // Garantir que faturada existe (pode ser undefined)
  const isFaturada = ordem.faturada === true;
  const isEntregue = ordem.entregue === true;
  const isPagoNaEntrega = ordem.pago_na_entrega === true;
  const foiEnviadaWhatsApp = ordensEnviadasWhatsApp?.has(ordem.id) || false;
  const notaJaEmitida = ordensNotaEmitida?.has(ordem.id) || false;

  const getNextStatus = (currentStatus: OrdemServico['status']): OrdemServico['status'] | null => {
    if (currentStatus === 'pendente') return 'em_desenvolvimento';
    if (currentStatus === 'em_desenvolvimento') {
      // Agora funcionários também podem finalizar
      return 'finalizada';
    }
    return null; // Finalizada não tem próximo
  };

  const getPreviousStatus = (currentStatus: OrdemServico['status']): OrdemServico['status'] | null => {
    // Se a OS já foi marcada como entregue, não deve mais permitir voltar status
    if (isEntregue) return null;
    if (currentStatus === 'em_desenvolvimento') return 'pendente';
    if (currentStatus === 'finalizada') return 'em_desenvolvimento';
    return null; // Pendente não tem anterior
  };

  const nextStatus = getNextStatus(ordem.status);
  const previousStatus = getPreviousStatus(ordem.status);
  const prazoInfo = getPrazoInfo(ordem.prazo_entrega, ordem.status);

  const handleStatusChange = (newStatus: OrdemServico['status']) => {
    if (onChangeStatus) {
      onChangeStatus(ordem, newStatus);
    }
  };

  const handleToggleEntregue = () => {
    if (onToggleEntregue) {
      onToggleEntregue(ordem, !isEntregue);
    }
  };

  const botaoContorno =
    'flex h-8 items-center gap-1.5 rounded-[9px] border border-borda px-[11px] text-[12.5px] font-semibold text-tinta-suave transition-colors hover:border-tinta/30 hover:bg-tinta/[0.03] hover:text-tinta';
  const selo = 'flex h-8 items-center gap-1.5 rounded-[9px] px-[11px] text-[12.5px] font-semibold';

  const botaoDetalhes = (
    <button
      onClick={() => onViewDetails(ordem)}
      className="flex h-8 items-center gap-1 pl-1.5 pr-1 text-[12.5px] font-semibold text-areia-escuro transition-colors hover:text-tinta"
    >
      Detalhes
      <Icon name="chevron" className="h-3.5 w-3.5" strokeWidth={1.8} />
    </button>
  );

  return (
    <article className="flex flex-col gap-3 rounded-[13px] border border-[#e2dfd7] bg-papel px-4 py-3.5 shadow-[0_1px_2px_rgba(31,30,27,0.04)] transition-shadow hover:shadow-[0_6px_18px_-8px_rgba(31,30,27,0.18)]">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold tracking-[0.06em] text-[#8f8a80] tabular-nums">
          {ordem.numero}
        </span>
        {/* Sem selo de prazo (finalizadas) o "Detalhes" sobe para cá e libera o rodapé para as ações */}
        {prazoInfo ? (
          <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-[9px] text-xs font-semibold tabular-nums ${prazoInfo.badge}`}>
            <Icon name="relogio" className="h-3.5 w-3.5" strokeWidth={1.8} />
            {prazoInfo.label}
          </span>
        ) : (
          <span className="-mr-1">{botaoDetalhes}</span>
        )}
      </div>

      <div className="flex flex-col gap-[3px]">
        {ordem.servico && ordem.servico.toString().trim() !== '' ? (
          <>
            <h3 className="text-[15px] font-semibold leading-snug text-tinta">{ordem.servico.toString().trim()}</h3>
            <span className="text-[13px] text-[#6f6b62]">{ordem.cliente}</span>
          </>
        ) : (
          <h3 className="text-[15px] font-semibold leading-snug text-tinta">{ordem.cliente}</h3>
        )}
      </div>

      {ordem.descricao && (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-tinta-suave">{ordem.descricao}</p>
      )}

      <div className="flex items-end justify-between gap-3">
        <span className="font-serif text-[23px] font-semibold leading-none text-tinta tabular-nums">
          {formatCurrency(ordem.valor)}
        </span>
        <div className="flex flex-col items-end gap-0.5 text-xs text-[#8f8a80] tabular-nums">
          <span>Criação {formatDate(ordem.data_criacao)}</span>
          <span>Prazo {formatDateTime(ordem.prazo_entrega)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-borda-suave pt-3">
        {previousStatus && (
          <button
            onClick={() => handleStatusChange(previousStatus)}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-borda text-tinta-suave transition-colors hover:border-tinta/30 hover:text-tinta"
            title={`Voltar para ${previousStatus === 'pendente' ? 'Pendente' : 'Em Desenvolvimento'}`}
            aria-label="Voltar"
          >
            <Icon name="voltar" className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        )}
        {nextStatus && (
          <button
            onClick={() => handleStatusChange(nextStatus)}
            className="flex h-8 items-center gap-1.5 rounded-[9px] bg-[#eae7df] px-3 text-[12.5px] font-semibold text-tinta transition-colors hover:bg-[#dfdbd1]"
            title={`Avançar para ${nextStatus === 'em_desenvolvimento' ? 'Em Desenvolvimento' : 'Finalizada'}`}
          >
            Avançar
            <Icon name="avancar" className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        )}

        {/* Emitir Nota - quando pago na entrega, aparece apenas quando NÃO estiver finalizada (apenas imprime, não fatura) */}
        {isPagoNaEntrega && !isFaturada && ordem.status !== 'finalizada' && onEmitirNota && (
          notaJaEmitida ? (
            <div className={`${selo} cursor-not-allowed bg-[#eae7df] text-pedra`}>
              <Icon name="recibo" className="h-3.5 w-3.5" strokeWidth={1.8} />
              Nota emitida
            </div>
          ) : (
            <button
              onClick={() => onEmitirNota(ordem)}
              className={botaoContorno}
              title="Emitir nota fiscal desta ordem de serviço (apenas impressão)"
            >
              <Icon name="recibo" className="h-3.5 w-3.5" strokeWidth={1.8} />
              Emitir nota
            </button>
          )
        )}

        {onEnviarWhatsApp && ordem.status === 'finalizada' && (
          foiEnviadaWhatsApp ? (
            <div className="flex h-8 items-center gap-1.5 px-1 text-[12.5px] font-semibold text-[#56704f]">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={1.8} />
              Enviado
            </div>
          ) : (
            <button
              onClick={() => onEnviarWhatsApp(ordem)}
              className="flex h-8 items-center gap-1.5 rounded-[9px] border border-[#c9d3c3] bg-[#eef2ea] px-[11px] text-[12.5px] font-semibold text-salvia transition-colors hover:bg-salvia-fundo"
              title="Enviar para WhatsApp"
            >
              <Icon name="mensagem" className="h-3.5 w-3.5" strokeWidth={1.8} />
              WhatsApp
            </button>
          )
        )}

        {ordem.status === 'finalizada' && (
          <button
            onClick={handleToggleEntregue}
            className={
              isEntregue
                ? `${selo} bg-[#e1e8dc] text-[#3f5838] transition-colors hover:bg-[#d5dfcf]`
                : botaoContorno
            }
            title={isEntregue ? 'Desmarcar entrega' : 'Marcar como entregue'}
          >
            <Icon name="pacote" className="h-3.5 w-3.5" strokeWidth={1.8} />
            {isEntregue ? 'Entregue' : 'Marcar entregue'}
          </button>
        )}

        {/* Faturar - apenas para patrão, quando status for finalizada E quando estiver entregue */}
        {ordem.status === 'finalizada' && !isFaturada && isEntregue && onFaturar && (
          <button
            onClick={() => onFaturar(ordem)}
            className="flex h-8 items-center gap-1.5 rounded-[9px] bg-tinta px-3 text-[12.5px] font-semibold text-papel transition-colors hover:bg-black"
            title="Faturar esta ordem de serviço"
          >
            <span className="text-areia"><Icon name="cifrao" className="h-3.5 w-3.5" strokeWidth={1.8} /></span>
            Faturar
          </button>
        )}

        {isFaturada && (
          <div className={`${selo} bg-salvia-fundo text-salvia`}>
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={1.8} />
            Faturada
          </div>
        )}

        {prazoInfo && <span className="ml-auto">{botaoDetalhes}</span>}
      </div>
    </article>
  );
};
