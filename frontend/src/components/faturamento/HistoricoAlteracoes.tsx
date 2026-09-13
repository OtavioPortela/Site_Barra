import { useEffect, useState } from 'react';
import { ordemServicoService } from '../../services/api';
import type { AlteracaoOS } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { descreverPagamento } from '../../utils/pagamento';

const COR_ACAO: Record<AlteracaoOS['acao'], string> = {
  corrigir_pagamento: 'bg-ocre-fundo text-ocre',
  estornar_faturamento: 'bg-[#e9e6df] text-tinta-suave',
  cancelar_faturada: 'bg-terracota-fundo text-terracota',
};

/** Histórico de correções da OS (só patrão). Some quando a OS nunca foi corrigida. */
export const HistoricoAlteracoes = ({ ordemId, recarregar = 0 }: { ordemId: number; recarregar?: number }) => {
  const [alteracoes, setAlteracoes] = useState<AlteracaoOS[] | null>(null);

  useEffect(() => {
    let ativo = true;
    ordemServicoService.getAlteracoes(ordemId)
      .then((lista) => ativo && setAlteracoes(lista))
      .catch(() => ativo && setAlteracoes([]));
    return () => { ativo = false; };
  }, [ordemId, recarregar]);

  if (!alteracoes || alteracoes.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Histórico de correções</p>
      <ol className="flex flex-col gap-3">
        {alteracoes.map((a) => (
          <li key={a.id} className="flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COR_ACAO[a.acao]}`}>{a.acao_label}</span>
              <span className="text-xs tabular-nums text-gray-500">{formatDateTime(a.data)}{a.usuario_nome ? ` · ${a.usuario_nome}` : ''}</span>
            </div>
            <p className="text-sm text-gray-800">“{a.motivo}”</p>
            <p className="text-xs leading-relaxed text-gray-500">
              <span className="text-gray-400">Antes:</span> {descreverPagamento(a.dados_antes)}
              <br />
              <span className="text-gray-400">Depois:</span> {descreverPagamento(a.dados_depois)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};
