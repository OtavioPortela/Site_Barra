import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ItemAgenda, ProfissionalAgenda } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { ESTILO_SITUACAO, horaMinuto, siglaDia, situacao } from '../../utils/agenda';
import { Icon } from '../common/Icon';
import { Avatar } from './SeletorProfissional';

interface CartaoOSAgendaProps {
  item: ItemAgenda;
  profissionais: ProfissionalAgenda[];
  ehPatrao: boolean;
  onFechar: () => void;
  onAbrirOS: (item: ItemAgenda) => void;
  onComecar: (item: ItemAgenda) => Promise<void>;
  onFinalizar: (item: ItemAgenda) => void;
  onTrocarResponsavel: (item: ItemAgenda, responsavelId: number) => Promise<void>;
}

const quando = (iso: string) => {
  const d = new Date(iso);
  return `${siglaDia(d).toLowerCase()} ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}, ${horaMinuto(d)}`;
};

const Linha = ({ rotulo, children }: { rotulo: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 text-[13px]">
    <span className="text-[#8f8a80]">{rotulo}</span>
    <span className="text-right font-semibold text-tinta">{children}</span>
  </div>
);

export const CartaoOSAgenda = ({ item, profissionais, ehPatrao, onFechar, onAbrirOS, onComecar, onFinalizar, onTrocarResponsavel }: CartaoOSAgendaProps) => {
  const [salvando, setSalvando] = useState(false);
  const estilo = ESTILO_SITUACAO[situacao(item)];
  const podeTrocar = ehPatrao && item.status !== 'pendente';

  const executar = async (acao: () => Promise<void>) => {
    setSalvando(true);
    try { await acao(); } finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 p-3 sm:items-center" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cartao-os-titulo"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[380px] flex-col gap-3.5 rounded-2xl border border-[#e2dfd7] bg-papel p-5 shadow-[0_22px_50px_-18px_rgba(31,30,27,0.4)]"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11.5px] font-bold tracking-[0.06em] text-[#8f8a80] tabular-nums">{item.numero}</span>
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-bold ${estilo.bloco} ${estilo.texto}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.faturada ? 'Faturada' : estilo.rotulo}
            </span>
            <button type="button" onClick={onFechar} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-lg text-pedra hover:bg-tinta/5">
              <Icon name="fechar" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <span id="cartao-os-titulo" className="text-base font-bold text-tinta">{item.servico || item.numero}</span>
          <span className="text-[13.5px] text-[#6f6b62]">{item.cliente}</span>
          {item.descricao && <span className="mt-1 line-clamp-2 text-[13px] text-tinta-suave">{item.descricao}</span>}
        </div>

        <div className="flex flex-col gap-2.5 border-y border-borda-suave py-3">
          <Linha rotulo="Responsável">
            {podeTrocar ? (
              <label className="inline-flex items-center gap-1.5">
                {item.responsavel && <Avatar iniciais={item.responsavel.iniciais} id={item.responsavel.id} tamanho={22} />}
                <select
                  id={`responsavel-${item.id}`}
                  aria-label="Trocar responsável"
                  disabled={salvando}
                  value={item.responsavel?.id ?? ''}
                  onChange={(e) => executar(() => onTrocarResponsavel(item, Number(e.target.value)))}
                  className="h-8 rounded-lg border border-borda bg-white px-2 text-[13px] font-semibold text-tinta focus:border-tinta focus:outline-none"
                >
                  {!item.responsavel && <option value="">Sem responsável</option>}
                  {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </label>
            ) : item.responsavel ? (
              <span className="inline-flex items-center gap-1.5"><Avatar iniciais={item.responsavel.iniciais} id={item.responsavel.id} tamanho={22} />{item.responsavel.nome}</span>
            ) : (
              <span className="text-pedra">{item.status === 'pendente' ? 'Ninguém ainda' : 'Sem responsável'}</span>
            )}
          </Linha>
          {item.inicio && !item.sem_horario_inicio && <Linha rotulo="Começou">{quando(item.inicio)}</Linha>}
          {item.status === 'finalizada' && item.fim && (
            <Linha rotulo="Finalizada">{quando(item.fim)}{item.finalizado_por ? ` · ${item.finalizado_por.nome.split(' ')[0]}` : ''}</Linha>
          )}
          <Linha rotulo="Prazo"><span className={item.atrasada ? 'text-terracota' : ''}>{quando(item.prazo)}{item.atrasada ? ' · atrasada' : ''}</span></Linha>
          {item.criado_por && <Linha rotulo="Criada por">{item.criado_por.nome.split(' ')[0]} · {quando(item.data_criacao)}</Linha>}
          {item.valor !== undefined && <Linha rotulo="Valor">{formatCurrency(item.valor)}</Linha>}
        </div>

        {item.faturada ? (
          <p className="text-[13px] text-pedra">
            OS faturada.{' '}
            {ehPatrao ? <Link to="/historico-os" className="font-semibold text-areia-escuro hover:text-tinta">Correções pelo Histórico</Link> : 'Ajustes só pelo patrão.'}
          </p>
        ) : (
          <div className="flex gap-2">
            {item.status === 'pendente' && (
              <button type="button" disabled={salvando} onClick={() => executar(() => onComecar(item))} className="h-10 flex-1 rounded-[10px] bg-tinta text-[13.5px] font-semibold text-papel hover:bg-black disabled:opacity-60">
                Começar agora
              </button>
            )}
            {item.status === 'em_desenvolvimento' && (
              <button type="button" onClick={() => onFinalizar(item)} className="h-10 flex-1 rounded-[10px] bg-tinta text-[13.5px] font-semibold text-papel hover:bg-black">
                Finalizar
              </button>
            )}
            <button type="button" onClick={() => onAbrirOS(item)} className="h-10 flex-1 rounded-[10px] bg-[#eae7df] text-[13.5px] font-semibold text-tinta hover:bg-[#dfdbd1]">
              Abrir OS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
