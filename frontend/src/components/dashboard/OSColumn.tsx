import { useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { OrdemServico } from '../../types';
import { SortableOSCard } from './SortableOSCard';
import { Icon } from '../common/Icon';
import { paginar } from '../../utils/paginacao';

interface OSColumnProps {
  id: string;
  title: string;
  ordens: OrdemServico[];
  onViewDetails: (ordem: OrdemServico) => void;
  onChangeStatus?: (ordem: OrdemServico, newStatus: OrdemServico['status']) => void;
  onFaturar?: (ordem: OrdemServico) => void;
  onEmitirNota?: (ordem: OrdemServico) => void;
  onToggleEntregue?: (ordem: OrdemServico, newEntregue: boolean) => void;
  onEnviarWhatsApp?: (ordem: OrdemServico) => void;
  ordensEnviadasWhatsApp?: Set<number>;
  ordensNotaEmitida?: Set<number>;
  pagina: number;
  onPaginaChange: (pagina: number) => void;
}

export const OSColumn = ({ id, title, ordens, onViewDetails, onChangeStatus, onFaturar, onEmitirNota, onToggleEntregue, onEnviarWhatsApp, ordensEnviadasWhatsApp, ordensNotaEmitida, pagina, onPaginaChange }: OSColumnProps) => {
  // Removida a restrição - agora todos podem mover para finalizada
  const canDrop = true;

  const { setNodeRef } = useDroppable({
    id,
    disabled: !canDrop,
  });

  const { itens: ordensDaPagina, paginaAtual, totalPaginas } = paginar(ordens, pagina);

  // Mantém a página guardada no quadro alinhada com a que está sendo exibida
  useEffect(() => {
    if (paginaAtual !== pagina) {
      onPaginaChange(paginaAtual);
    }
  }, [paginaAtual, pagina, onPaginaChange]);

  return (
    <div className={`flex min-w-[300px] flex-1 flex-col gap-3 ${!canDrop ? 'opacity-60' : ''}`}>
      <div className="flex flex-col gap-2.5 px-0.5 pt-0.5">
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif text-2xl font-semibold leading-tight text-tinta">{title}</h2>
          <span className="inline-flex h-[22px] min-w-6 items-center justify-center rounded-full bg-[#e3e1da] px-2 text-xs font-bold tabular-nums text-tinta-suave">
            {ordens.length}
          </span>
        </div>
        <div className="relative h-px bg-[#dad7cf]">
          <div className="absolute -top-px left-0 h-0.5 w-10 bg-areia" />
        </div>
      </div>

      <SortableContext items={ordensDaPagina.map(o => o.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-[200px] flex-col gap-3">
          {ordensDaPagina.map((ordem) => (
            <SortableOSCard
              key={ordem.id}
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
          ))}
          {ordens.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-[13px] border border-dashed border-[#d6d3ca] px-4 py-9 text-[13.5px] text-pedra-claro">
              <span className="text-areia"><Icon name="linha" className="h-[22px] w-[22px]" /></span>
              Nenhuma OS nesta coluna
            </div>
          )}
        </div>
      </SortableContext>

      {totalPaginas > 1 && (
        <nav aria-label={`Páginas de ${title}`} className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => onPaginaChange(paginaAtual - 1)}
            disabled={paginaAtual === 1}
            aria-label="Página anterior"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-borda bg-papel text-tinta-suave transition-colors hover:border-tinta/30 hover:text-tinta disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-borda disabled:hover:text-tinta-suave"
          >
            <Icon name="chevronEsquerda" className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <span className="text-[13px] font-medium text-pedra tabular-nums">
            {paginaAtual} de {totalPaginas}
          </span>
          <button
            onClick={() => onPaginaChange(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas}
            aria-label="Próxima página"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-borda bg-papel text-tinta-suave transition-colors hover:border-tinta/30 hover:text-tinta disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-borda disabled:hover:text-tinta-suave"
          >
            <Icon name="chevron" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </nav>
      )}
    </div>
  );
};

