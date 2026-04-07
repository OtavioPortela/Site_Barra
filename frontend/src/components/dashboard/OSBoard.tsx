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
import { whatsappService } from '../../services/whatsappService';
import type { OrdemServico } from '../../types';
import { ImprimirNotaModal } from './ImprimirNotaModal';
import { OSCard } from './OSCard';
import { OSColumn } from './OSColumn';

interface OSBoardProps {
  onViewDetails: (ordem: OrdemServico) => void;
  onNewOS: () => void;
}

export const OSBoard = ({ onViewDetails, onNewOS }: OSBoardProps) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [showImprimirModal, setShowImprimirModal] = useState(false);
  const [ordemParaFaturar, setOrdemParaFaturar] = useState<OrdemServico | null>(null);
  const [ordemParaImprimir, setOrdemParaImprimir] = useState<OrdemServico | null>(null);
  const [showImprimirNotaModal, setShowImprimirNotaModal] = useState(false);
  const [ordensEnviadasWhatsApp, setOrdensEnviadasWhatsApp] = useState<Set<number>>(new Set());
  const [ordensNotaEmitida, setOrdensNotaEmitida] = useState<Set<number>>(new Set());

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

  const handleFaturar = (ordem: OrdemServico) => {
    // Abrir modal apenas para visualizar a nota (sem imprimir)
    setOrdemParaFaturar(ordem);
    setShowImprimirModal(true);
  };

  const handleEmitirNota = (ordem: OrdemServico) => {
    // Abrir modal apenas para imprimir (não faturar)
    setOrdemParaImprimir(ordem);
    setShowImprimirNotaModal(true);
  };

  const handleCloseImprimirNotaModal = () => {
    // Marcar que a nota foi emitida quando fechar o modal
    if (ordemParaImprimir) {
      handleNotaEmitida(ordemParaImprimir.id);
    }
    setShowImprimirNotaModal(false);
    setOrdemParaImprimir(null);
  };

  const handleNotaEmitida = (ordemId: number) => {
    // Marcar que a nota foi emitida
    setOrdensNotaEmitida(prev => new Set(prev).add(ordemId));
  };

  const handleConfirmarFaturar = async () => {
    if (!ordemParaFaturar) return;

    try {
      await ordemServicoService.faturar(ordemParaFaturar.id);
      await loadOrdens();
      toast.success('Ordem de serviço faturada com sucesso!');
      setShowImprimirModal(false);
      setOrdemParaFaturar(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.detail ||
                          'Erro ao faturar ordem de serviço';
      toast.error(errorMessage);
      console.error(error);
      throw error;
    }
  };

  const handleCloseImprimirModal = () => {
    setShowImprimirModal(false);
    setOrdemParaFaturar(null);
  };

  const handleEnviarWhatsApp = async (ordem: OrdemServico) => {
    console.log('🔍 Iniciando envio WhatsApp para OS:', ordem.id);
    console.log('📋 Dados da OS:', ordem);
    console.log('📞 Telefone na OS (lista):', ordem.cliente_telefone);

    try {
      // Buscar dados completos da OS para garantir que temos todas as informações
      console.log('📥 Buscando OS completa...');
      const ordemCompleta = await ordemServicoService.getById(ordem.id);
      console.log('✅ OS completa obtida:', ordemCompleta);
      console.log('📞 Telefone na OS completa:', ordemCompleta.cliente_telefone);

      // Verificar se tem telefone do cliente
      if (!ordemCompleta.cliente_telefone || ordemCompleta.cliente_telefone.trim() === '') {
        console.error('❌ Telefone não encontrado na OS completa');
        toast.error('Cliente não possui telefone cadastrado');
        return;
      }

      // Enviar nota da OS via WhatsApp
      console.log('📤 Enviando para WhatsApp...');
      console.log('📞 Número:', ordemCompleta.cliente_telefone);
      console.log('🆔 OS ID:', ordemCompleta.id);

      await whatsappService.enviarNotaOS(ordemCompleta.cliente_telefone, ordemCompleta.id);

      // Marcar como enviada
      setOrdensEnviadasWhatsApp(prev => new Set(prev).add(ordem.id));

      console.log('✅ WhatsApp enviado com sucesso!');
      toast.success('Nota da OS enviada para WhatsApp com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro completo ao enviar WhatsApp:', error);
      console.error('📦 Response data:', error.response?.data);
      console.error('📊 Response status:', error.response?.status);
      console.error('🔍 Error message:', error.message);
      console.error('📋 Error stack:', error.stack);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.detail ||
                          error.message ||
                          'Erro ao enviar para WhatsApp';
      toast.error(`Erro: ${errorMessage}`);
    }
  };

  const handleToggleEntregue = async (ordem: OrdemServico, newEntregue: boolean) => {
    // Se está marcando como entregue, marcar e abrir modal para emitir nota
    if (newEntregue && !ordem.entregue) {
      try {
        // Primeiro marcar como entregue
        await ordemServicoService.update(ordem.id, { entregue: true });
        await loadOrdens();

        // Buscar a OS atualizada para ter os dados mais recentes
        const ordemAtualizada = await ordemServicoService.getById(ordem.id);

        // Abrir modal para emitir nota
        setOrdemParaImprimir(ordemAtualizada);
        setShowImprimirNotaModal(true);

        toast.success('OS marcada como entregue!');
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          'Erro ao marcar como entregue';
        toast.error(errorMessage);
        console.error(error);
      }
    } else {
      // Se está desmarcando, apenas atualizar
      try {
        await ordemServicoService.update(ordem.id, { entregue: newEntregue });
        await loadOrdens();
        toast.success('Entrega desmarcada.');
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          'Erro ao atualizar entrega da OS';
        toast.error(errorMessage);
        console.error(error);
      }
    }
  };


  // Filtrar ordens: excluir faturadas do dashboard e separar por status
  // Garantir que faturada seja tratado como boolean (pode vir undefined do backend)
  const ordensFiltradas = ordens.filter((o) => o.faturada !== true);
  const pendentes = ordensFiltradas.filter((o) => o.status === 'pendente');
  const emDesenvolvimento = ordensFiltradas.filter((o) => o.status === 'em_desenvolvimento');
  const finalizadas = ordensFiltradas.filter((o) => o.status === 'finalizada');

  // Debug
  if (ordens.length > 0) {
    // eslint-disable-next-line no-console
    console.log('OSBoard - Ordens recebidas:', ordens.length);
    // eslint-disable-next-line no-console
    console.log('OSBoard - Ordens após filtrar faturadas:', ordensFiltradas.length);
    // eslint-disable-next-line no-console
    console.log('OSBoard - Finalizadas (não faturadas):', finalizadas.length);
  }

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
            onEmitirNota={handleEmitirNota}
            onToggleEntregue={handleToggleEntregue}
            onEnviarWhatsApp={handleEnviarWhatsApp}
            ordensEnviadasWhatsApp={ordensEnviadasWhatsApp}
            ordensNotaEmitida={ordensNotaEmitida}
          />
          <OSColumn
            id="em_desenvolvimento"
            title="Em Desenvolvimento"
            ordens={emDesenvolvimento}
            onViewDetails={onViewDetails}
            onChangeStatus={updateStatus}
            onFaturar={handleFaturar}
            onEmitirNota={handleEmitirNota}
            onToggleEntregue={handleToggleEntregue}
            onEnviarWhatsApp={handleEnviarWhatsApp}
            ordensEnviadasWhatsApp={ordensEnviadasWhatsApp}
            ordensNotaEmitida={ordensNotaEmitida}
          />
          <OSColumn
            id="finalizada"
            title="Finalizadas"
            ordens={finalizadas}
            onViewDetails={onViewDetails}
            onChangeStatus={updateStatus}
            onFaturar={handleFaturar}
            onEmitirNota={handleEmitirNota}
            onToggleEntregue={handleToggleEntregue}
            onEnviarWhatsApp={handleEnviarWhatsApp}
            ordensEnviadasWhatsApp={ordensEnviadasWhatsApp}
            ordensNotaEmitida={ordensNotaEmitida}
          />
        </div>
        <DragOverlay>
          {activeOrdem ? (
            <OSCard
              ordem={activeOrdem}
              onViewDetails={onViewDetails}
              onChangeStatus={updateStatus}
              onFaturar={handleFaturar}
              onEmitirNota={handleEmitirNota}
              onToggleEntregue={handleToggleEntregue}
              onEnviarWhatsApp={handleEnviarWhatsApp}
              ordensEnviadasWhatsApp={ordensEnviadasWhatsApp}
              ordensNotaEmitida={ordensNotaEmitida}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {ordemParaFaturar && (
        <ImprimirNotaModal
          isOpen={showImprimirModal}
          onClose={handleCloseImprimirModal}
          onConfirm={handleConfirmarFaturar}
          ordem={ordemParaFaturar}
          apenasVisualizar={true}
        />
      )}

      {ordemParaImprimir && (
        <ImprimirNotaModal
          isOpen={showImprimirNotaModal}
          onClose={handleCloseImprimirNotaModal}
          onConfirm={() => {
            // Quando imprimir, apenas fechar o modal (a nota será marcada como emitida no onClose)
            handleCloseImprimirNotaModal();
          }}
          ordem={ordemParaImprimir}
          apenasImprimir={true}
        />
      )}
    </div>
  );
};

