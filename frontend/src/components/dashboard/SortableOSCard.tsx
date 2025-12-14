import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrdemServico } from '../../types';
import { OSCard } from './OSCard';

interface SortableOSCardProps {
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

export const SortableOSCard = ({ ordem, onViewDetails, onChangeStatus, onFaturar, onEmitirNota, onToggleEntregue, onEnviarWhatsApp, ordensEnviadasWhatsApp, ordensNotaEmitida }: SortableOSCardProps) => {
  const {
    attributes,
    listeners: _listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ordem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <OSCard
        ordem={ordem}
        onViewDetails={onViewDetails}
        onChangeStatus={onChangeStatus}
        onFaturar={onFaturar}
        onEmitirNota={onEmitirNota}
        onToggleEntregue={onToggleEntregue}
        onEnviarWhatsApp={onEnviarWhatsApp}
        ordensEnviadasWhatsApp={ordensEnviadasWhatsApp}
        ordensNotaEmitida={ordensNotaEmitida}
      />
    </div>
  );
};

