import { useAuth } from '../../contexts/AuthContext';
import type { OrdemServico } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

interface OSCardProps {
  ordem: OrdemServico;
  onViewDetails: (ordem: OrdemServico) => void;
  onChangeStatus?: (ordem: OrdemServico, newStatus: OrdemServico['status']) => void;
  onFaturar?: (ordem: OrdemServico) => void;
}

export const OSCard = ({ ordem, onViewDetails, onChangeStatus, onFaturar }: OSCardProps) => {
  const { isPatrao } = useAuth();
  const isPatraoValue = isPatrao();

  // Garantir que faturada existe (pode ser undefined)
  const isFaturada = ordem.faturada === true;

  const getNextStatus = (currentStatus: OrdemServico['status']): OrdemServico['status'] | null => {
    if (currentStatus === 'pendente') return 'em_desenvolvimento';
    if (currentStatus === 'em_desenvolvimento') {
      // Agora funcionários também podem finalizar
      return 'finalizada';
    }
    return null; // Finalizada não tem próximo
  };

  const getPreviousStatus = (currentStatus: OrdemServico['status']): OrdemServico['status'] | null => {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">OS #{ordem.numero}</h3>
          <p className="text-sm text-gray-600 mt-1">{ordem.cliente}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(ordem.status)}`}>
          {ordem.status === 'pendente' ? 'Pendente' : ordem.status === 'em_desenvolvimento' ? 'Em Dev' : 'Finalizada'}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{ordem.descricao}</p>

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

        {/* Botão Faturar - apenas para patrão e quando status for finalizada */}
        {ordem.status === 'finalizada' && isPatraoValue && !isFaturada && onFaturar && (
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

      <button
        onClick={() => onViewDetails(ordem)}
        className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
      >
        Ver Detalhes
      </button>
    </div>
  );
};

