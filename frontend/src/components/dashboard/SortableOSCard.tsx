import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrdemServico } from '../../types';
import { OSCard } from './OSCard';

interface SortableOSCardProps {
  ordem: OrdemServico;
  onViewDetails: (ordem: OrdemServico) => void;
  onChangeStatus?: (ordem: OrdemServico, newStatus: OrdemServico['status']) => void;
  onFaturar?: (ordem: OrdemServico) => void;
}

export const SortableOSCard = ({ ordem, onViewDetails, onChangeStatus, onFaturar }: SortableOSCardProps) => {
  const {
    attributes,
    listeners,
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
      <OSCard ordem={ordem} onViewDetails={onViewDetails} onChangeStatus={onChangeStatus} onFaturar={onFaturar} />
    </div>
  );
};

