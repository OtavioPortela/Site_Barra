import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { OrdemServico } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { SortableOSCard } from './SortableOSCard';

interface OSColumnProps {
  id: string;
  title: string;
  ordens: OrdemServico[];
  onViewDetails: (ordem: OrdemServico) => void;
  onChangeStatus?: (ordem: OrdemServico, newStatus: OrdemServico['status']) => void;
  onFaturar?: (ordem: OrdemServico) => void;
}

export const OSColumn = ({ id, title, ordens, onViewDetails, onChangeStatus, onFaturar }: OSColumnProps) => {
  // Removida a restrição - agora todos podem mover para finalizada
  const canDrop = true;

  const { setNodeRef } = useDroppable({
    id,
    disabled: !canDrop,
  });

  return (
    <div className={`flex-1 min-w-[300px] bg-gray-50 rounded-lg p-4 ${!canDrop ? 'opacity-60' : ''}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <span className="text-sm text-gray-500">({ordens.length})</span>
      </div>

      <SortableContext items={ordens.map(o => o.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
          {ordens.map((ordem) => (
            <SortableOSCard
              key={ordem.id}
              ordem={ordem}
              onViewDetails={onViewDetails}
              onChangeStatus={onChangeStatus}
              onFaturar={onFaturar}
            />
          ))}
          {ordens.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Nenhuma OS nesta coluna
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

