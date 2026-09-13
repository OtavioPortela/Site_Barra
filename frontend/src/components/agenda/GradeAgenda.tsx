import { useMemo, useState } from 'react';
import type { ItemAgenda } from '../../types';
import {
  ALTURA_SLOT, ESTILO_SITUACAO, PX_POR_MINUTO, andamentoSemHorario, faixaDeHoras, horaMinuto, horarioDoSlot, mesmoDia,
  posicionarBlocos, siglaDia, situacao,
} from '../../utils/agenda';
import { Avatar } from './SeletorProfissional';

interface GradeAgendaProps {
  dias: Date[];
  aFazer: ItemAgenda[];
  blocos: ItemAgenda[];
  agora: Date;
  compacta?: boolean;
  onAbrir: (item: ItemAgenda) => void;
  onMover: (item: ItemAgenda, novoPrazo: Date) => void;
  onCriar: (prazo: Date) => void;
}

const nomeCurto = (nome: string) => nome.split(' ')[0];

export const GradeAgenda = ({ dias, aFazer, blocos, agora, compacta = false, onAbrir, onMover, onCriar }: GradeAgendaProps) => {
  const [arrastando, setArrastando] = useState<ItemAgenda | null>(null);
  const [alvo, setAlvo] = useState<{ dia: number; slot: number } | null>(null);
  const { inicio: horaInicio, fim: horaFim } = useMemo(() => faixaDeHoras(blocos, dias), [blocos, dias]);
  const totalSlots = (horaFim - horaInicio) * 2;
  const alturaGrade = totalSlots * ALTURA_SLOT;
  const colunas = `56px repeat(${dias.length}, minmax(${compacta ? 0 : 120}px, 1fr))`;

  const soltar = (diaIndex: number, slot: number) => {
    if (arrastando) onMover(arrastando, horarioDoSlot(dias[diaIndex], horaInicio, slot));
    setArrastando(null);
    setAlvo(null);
  };

  const slotDoEvento = (e: React.DragEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.min(totalSlots - 1, Math.max(0, Math.floor((e.clientY - rect.top) / ALTURA_SLOT)));
  };

  const iniciarArraste = (e: React.DragEvent, item: ItemAgenda) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.id));
    setArrastando(item);
  };

  const semHorario = andamentoSemHorario(blocos);
  const aFazerDoDia = (dia: Date) => [
    ...(mesmoDia(dia, agora) ? semHorario : []),
    ...aFazer.filter((i) => mesmoDia(new Date(i.prazo), dia)),
  ];
  const limiteChips = compacta ? 3 : 2;

  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#e2dfd7] bg-papel">
      <div className="min-w-full" style={{ minWidth: compacta ? undefined : 56 + dias.length * 120 }}>
        {/* Cabeçalho dos dias */}
        {!compacta && (
          <div className="grid border-b border-borda-suave" style={{ gridTemplateColumns: colunas }}>
            <div />
            {dias.map((dia) => {
              const hoje = mesmoDia(dia, agora);
              return (
                <div key={dia.toISOString()} className="flex items-center gap-2 border-l border-borda-suave px-3 py-2.5">
                  <span className={`text-[11.5px] font-bold tracking-[0.08em] ${hoje ? 'text-terracota' : 'text-[#8f8a80]'}`}>{siglaDia(dia)}</span>
                  <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-[15px] font-bold tabular-nums ${hoje ? 'bg-tinta text-papel' : 'text-tinta'}`}>
                    {String(dia.getDate()).padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Faixa A fazer */}
        <div className="grid border-b border-[#dad7cf] bg-[#f4f2ed]" style={{ gridTemplateColumns: colunas }}>
          <div className="flex items-center justify-center py-1.5">
            <span className="text-[10.5px] font-bold tracking-[0.1em] text-[#8f8a80] [writing-mode:vertical-rl] rotate-180">A FAZER</span>
          </div>
          {dias.map((dia) => {
            const itens = aFazerDoDia(dia);
            return (
              <div
                key={dia.toISOString()}
                onDragOver={(e) => { if (arrastando) e.preventDefault(); }}
                // Soltar na faixa A fazer muda só o dia, mantendo o horário do prazo
                onDrop={() => {
                  if (!arrastando) return;
                  const prazoAtual = new Date(arrastando.prazo);
                  onMover(arrastando, new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), prazoAtual.getHours(), prazoAtual.getMinutes()));
                  setArrastando(null);
                }}
                className={`flex min-h-[64px] flex-col gap-1 border-l border-borda-suave p-1.5 ${compacta ? 'flex-row flex-wrap' : ''}`}
              >
                {itens.slice(0, limiteChips).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    draggable={item.pode_mover}
                    onDragStart={(e) => iniciarArraste(e, item)}
                    onDragEnd={() => { setArrastando(null); setAlvo(null); }}
                    onClick={() => onAbrir(item)}
                    title={`${item.numero} · ${item.cliente}${item.servico ? ` · ${item.servico}` : ''}`}
                    className={`flex h-6 min-w-0 items-center gap-1.5 rounded-[7px] border px-1.5 text-left text-[11.5px] transition-opacity ${
                      item.status === 'em_desenvolvimento'
                        ? `${item.atrasada ? 'border-[#e5bdb5] bg-terracota-fundo text-[#8c3a2f]' : 'border-[#e3d0a8] bg-ocre-fundo text-[#6e4b12]'}`
                        : item.atrasada ? 'border-[#e5bdb5] bg-terracota-fundo text-[#8c3a2f]' : 'border-borda bg-papel text-tinta'
                    } ${arrastando?.id === item.id ? 'opacity-40' : ''} ${item.pode_mover ? 'cursor-grab' : ''}`}
                  >
                    <span className="font-bold tabular-nums">{item.status === 'em_desenvolvimento' ? 'andamento' : horaMinuto(new Date(item.prazo))}</span>
                    <span className="truncate">{item.cliente}</span>
                  </button>
                ))}
                {itens.length > limiteChips && (
                  <button type="button" onClick={() => onAbrir(itens[limiteChips])} className="pl-1 text-left text-[11.5px] font-bold text-areia-escuro hover:text-tinta">
                    +{itens.length - limiteChips} a fazer
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Grade de horários */}
        <div className="relative grid" style={{ gridTemplateColumns: colunas, height: alturaGrade }}>
          <div className="relative">
            {Array.from({ length: horaFim - horaInicio }, (_, i) => (
              <span key={i} className="absolute right-2 text-[11px] tabular-nums text-[#8f8a80]" style={{ top: i === 0 ? 2 : i * ALTURA_SLOT * 2 - 7 }}>
                {String(horaInicio + i).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {dias.map((dia, diaIndex) => {
            const hoje = mesmoDia(dia, agora);
            const posicionados = posicionarBlocos(blocos, dia, horaInicio);
            const topoAgora = ((agora.getHours() - horaInicio) * 60 + agora.getMinutes()) * PX_POR_MINUTO;
            return (
              <div
                key={dia.toISOString()}
                className={`relative border-l border-borda-suave ${hoje ? 'bg-areia/[0.06]' : ''}`}
                style={{ backgroundImage: `repeating-linear-gradient(to bottom, #ece9e2 0, #ece9e2 1px, transparent 1px, transparent ${ALTURA_SLOT * 2}px)` }}
                onDragOver={(e) => { if (!arrastando) return; e.preventDefault(); setAlvo({ dia: diaIndex, slot: slotDoEvento(e) }); }}
                onDragLeave={() => setAlvo((a) => (a?.dia === diaIndex ? null : a))}
                onDrop={(e) => { e.preventDefault(); soltar(diaIndex, slotDoEvento(e)); }}
                onDoubleClick={(e) => { if (e.target === e.currentTarget) onCriar(horarioDoSlot(dia, horaInicio, slotDoEvento(e))); }}
                title="Clique duas vezes para criar uma OS neste horário"
              >
                {posicionados.map((b) => {
                  const estilo = ESTILO_SITUACAO[situacao(b.item)];
                  const larguraPct = 100 / b.totalColunas;
                  const pessoa = b.item.responsavel;
                  const emAndamento = b.item.status === 'em_desenvolvimento';
                  return (
                    <div
                      key={`${b.item.id}-${diaIndex}`}
                      className="absolute px-0.5"
                      style={{ top: b.top, height: b.altura, left: `${b.coluna * larguraPct}%`, width: `${larguraPct}%` }}
                    >
                      <button
                        type="button"
                        draggable={b.item.pode_mover}
                        onDragStart={(e) => iniciarArraste(e, b.item)}
                        onDragEnd={() => { setArrastando(null); setAlvo(null); }}
                        onClick={() => onAbrir(b.item)}
                        className={`flex h-full w-full flex-col gap-0.5 overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-[0_1px_2px_rgba(31,30,27,0.05)] transition-shadow hover:shadow-md ${estilo.bloco} ${estilo.texto} ${arrastando?.id === b.item.id ? 'opacity-40' : ''}`}
                      >
                        {b.altura < 40 ? (
                          // Bloco curto (ex.: OS antiga sem horário de início): horário e cliente numa linha
                          <span className="flex items-center gap-1 truncate text-[11px] leading-tight">
                            <span className="font-bold tabular-nums">{b.item.sem_horario_inicio ? horaMinuto(b.fim) : horaMinuto(b.inicio)}</span>
                            <span className="truncate font-semibold text-tinta">{b.item.cliente}</span>
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center justify-between gap-1">
                              <span className="truncate text-[10.5px] font-bold tabular-nums">
                                {b.item.sem_horario_inicio ? `até ${horaMinuto(b.fim)}` : `${horaMinuto(b.inicio)} – ${emAndamento ? 'agora' : horaMinuto(b.fim)}`}
                              </span>
                              {pessoa && <Avatar iniciais={pessoa.iniciais} id={pessoa.id} tamanho={18} />}
                            </span>
                            <span className="truncate text-[11.5px] font-bold leading-tight text-tinta">{b.item.cliente}</span>
                          </>
                        )}
                        {b.altura > 44 && <span className="truncate text-[11px] leading-tight">{b.item.servico || b.item.numero}</span>}
                        {b.altura > 64 && pessoa && <span className="mt-auto truncate text-[10.5px]">{nomeCurto(pessoa.nome)}</span>}
                      </button>
                    </div>
                  );
                })}

                {alvo?.dia === diaIndex && arrastando && (
                  <div className="pointer-events-none absolute inset-x-1 z-10 rounded-lg border-[1.5px] border-dashed border-areia-escuro bg-areia/20" style={{ top: alvo.slot * ALTURA_SLOT, height: ALTURA_SLOT }}>
                    <span className="absolute left-0 top-full mt-1 whitespace-nowrap rounded-md bg-tinta px-2 py-1 text-[11px] text-papel">
                      Novo prazo: {siglaDia(dia).toLowerCase()} {dia.getDate()}, {horaMinuto(horarioDoSlot(dia, horaInicio, alvo.slot))}
                    </span>
                  </div>
                )}

                {hoje && topoAgora >= 0 && topoAgora <= alturaGrade && (
                  <div className="pointer-events-none absolute inset-x-0 z-[5] border-t-2 border-terracota" style={{ top: topoAgora }}>
                    <span className="absolute -left-[5px] -top-[6px] h-2.5 w-2.5 rounded-full bg-terracota" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
