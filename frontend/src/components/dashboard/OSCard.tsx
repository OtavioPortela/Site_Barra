import { useAuth } from '../../contexts/AuthContext';
import type { OrdemServico } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

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
  const { isPatrao } = useAuth();
  const isPatraoValue = isPatrao();

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

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">
            {ordem.servico && ordem.servico.toString().trim() !== ''
              ? `${ordem.servico.toString().trim()} - ${ordem.cliente}`
              : ordem.cliente}
          </h3>
          <p className="text-xs text-gray-500 mt-1">OS #{ordem.numero}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(ordem.status)}`}>
          {ordem.status === 'pendente' ? 'Pendente' : ordem.status === 'em_desenvolvimento' ? 'Em Dev' : 'Finalizada'}
        </span>
      </div>

      {ordem.descricao && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{ordem.descricao}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
        <div>
          <span className="font-medium">Criação:</span> {formatDate(ordem.data_criacao)}
        </div>
        <div>
          <span className="font-medium">Prazo:</span> {formatDate(ordem.prazo_entrega)}
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="text-lg font-bold text-blue-600">{formatCurrency(ordem.valor)}</span>
      </div>

      {/* Botões de mudança de status */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex gap-2">
          {previousStatus && (
            <button
              onClick={() => handleStatusChange(previousStatus)}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
              title={`Voltar para ${previousStatus === 'pendente' ? 'Pendente' : 'Em Desenvolvimento'}`}
            >
              ← Voltar
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => handleStatusChange(nextStatus)}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              title={`Avançar para ${nextStatus === 'em_desenvolvimento' ? 'Em Desenvolvimento' : 'Finalizada'}`}
            >
              Avançar →
            </button>
          )}
          {!nextStatus && !previousStatus && (
            <div className="flex-1 px-3 py-1.5 text-xs text-center text-gray-500">
              Finalizada
            </div>
          )}
        </div>

        {/* Botão Emitir Nota - quando pago na entrega, aparece apenas quando NÃO estiver finalizada (apenas imprime, não fatura) */}
        {isPagoNaEntrega && !isFaturada && ordem.status !== 'finalizada' && onEmitirNota && (
          notaJaEmitida ? (
            <div className="w-full px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded font-medium text-center cursor-not-allowed">
              🧾 Nota Emitida
            </div>
          ) : (
            <button
              onClick={() => onEmitirNota(ordem)}
              className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              title="Emitir nota fiscal desta ordem de serviço (apenas impressão)"
            >
              🧾 Emitir Nota
            </button>
          )
        )}

        {/* Botão Faturar - apenas para patrão, quando status for finalizada E quando estiver entregue
            Aparece tanto para OS pagas na entrada quanto para OS não pagas na entrada */}
        {ordem.status === 'finalizada' && isPatraoValue && !isFaturada && isEntregue && onFaturar && (
          <button
            onClick={() => onFaturar(ordem)}
            className="w-full px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
            title="Faturar esta ordem de serviço"
          >
            💰 Faturar
          </button>
        )}

        {/* Indicador de faturada */}
        {isFaturada && (
          <div className="w-full px-3 py-1.5 text-xs text-center bg-green-100 text-green-800 rounded font-medium">
            ✓ Faturada
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onViewDetails(ordem)}
          className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          Ver Detalhes
        </button>

        {onEnviarWhatsApp && ordem.status === 'finalizada' && (
          foiEnviadaWhatsApp ? (
            <div className="w-full px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded font-medium flex items-center justify-center gap-2">
              <span>✓</span>
              Enviado para WhatsApp
            </div>
          ) : (
            <button
              onClick={() => onEnviarWhatsApp(ordem)}
              className="w-full px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span>📱</span>
              Enviar para WhatsApp
            </button>
          )
        )}

        {ordem.status === 'finalizada' && (
          <button
            onClick={handleToggleEntregue}
            className={`w-full px-3 py-1.5 text-sm rounded font-medium transition-colors ${
              isEntregue
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEntregue ? 'Entregue' : 'Marcar como Entregue'}
          </button>
        )}
      </div>
    </div>
  );
};

