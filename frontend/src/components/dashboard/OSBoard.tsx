import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ordemServicoService } from '../../services/api';
import type { OrdemServico } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { OSCard } from './OSCard';
import { OSColumn } from './OSColumn';

interface OSBoardProps {
  onViewDetails: (ordem: OrdemServico) => void;
  onNewOS: () => void;
}

export const OSBoard = ({ onViewDetails, onNewOS }: OSBoardProps) => {
  const { isPatrao } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadOrdens = async () => {
    try {
      setLoading(true);
      // Usar filtros do backend se houver busca ou filtro de cliente
      const filters: any = {};
      if (searchTerm) {
        filters.search = searchTerm;
      }
      if (filterCliente) {
        filters.cliente = filterCliente;
      }

      const data = await ordemServicoService.getAll(Object.keys(filters).length > 0 ? filters : undefined);
      setOrdens(data);
    } catch (error: any) {
      toast.error('Erro ao carregar ordens de serviço');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar inicialmente
  useEffect(() => {
    loadOrdens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarregar quando os filtros mudarem (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrdens();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterCliente]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const ordemId = Number(active.id);
    const newStatus = over.id as OrdemServico['status'];

    const ordem = ordens.find((o) => o.id === ordemId);
    if (!ordem || ordem.status === newStatus) return;

    // Removida a restrição - agora todos podem mover para finalizada
    await updateStatus(ordem, newStatus);
  };

  const updateStatus = async (ordem: OrdemServico, newStatus: OrdemServico['status']) => {
    if (ordem.status === newStatus) return;

    // Removida a restrição - agora todos podem finalizar
    try {
      await ordemServicoService.updateStatus(ordem.id, newStatus);
      // Recarregar para pegar data_finalizacao atualizada se status for finalizada
      await loadOrdens();
      toast.success('Status atualizado com sucesso!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.detail ||
                          'Erro ao atualizar status';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleFaturar = async (ordem: OrdemServico) => {
    try {
      await ordemServicoService.faturar(ordem.id);
      await loadOrdens();
      toast.success('Ordem de serviço faturada com sucesso!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.detail ||
                          'Erro ao faturar ordem de serviço';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  // Agora os filtros são feitos no backend, então apenas separamos por status
  const pendentes = ordens.filter((o) => o.status === 'pendente');
  const emDesenvolvimento = ordens.filter((o) => o.status === 'em_desenvolvimento');
  const finalizadas = ordens.filter((o) => o.status === 'finalizada');

  const activeOrdem = activeId ? ordens.find((o) => o.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">Ordens de Serviço</h1>
        <button
          onClick={onNewOS}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Nova OS
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar por número ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Filtrar por cliente..."
          value={filterCliente}
          onChange={(e) => setFilterCliente(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OSColumn
            id="pendente"
            title="Pendente"
            ordens={pendentes}
            onViewDetails={onViewDetails}
            onChangeStatus={updateStatus}
            onFaturar={handleFaturar}
          />
          <OSColumn
            id="em_desenvolvimento"
            title="Em Desenvolvimento"
            ordens={emDesenvolvimento}
            onViewDetails={onViewDetails}
            onChangeStatus={updateStatus}
            onFaturar={handleFaturar}
          />
          <OSColumn
            id="finalizada"
            title="Finalizadas"
            ordens={finalizadas}
            onViewDetails={onViewDetails}
            onChangeStatus={updateStatus}
            onFaturar={handleFaturar}
          />
        </div>
        <DragOverlay>
          {activeOrdem ? <OSCard ordem={activeOrdem} onViewDetails={onViewDetails} onChangeStatus={updateStatus} onFaturar={handleFaturar} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

