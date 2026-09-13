import type { ItemAgenda } from '../../types';
import { mesmoDia, resumoDoDia } from '../../utils/agenda';

interface MesAgendaProps {
  dias: Date[];
  mesReferencia: number;
  aFazer: ItemAgenda[];
  blocos: ItemAgenda[];
  agora: Date;
  onEscolherDia: (dia: Date) => void;
}

const SIGLAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

const Linha = ({ cor, borda = false, texto, forte = false }: { cor: string; borda?: boolean; texto: string; forte?: boolean }) => (
  <span className={`flex items-center gap-1.5 text-[12px] ${forte ? 'font-bold' : ''}`}>
    <span className="h-2 w-2 shrink-0 rounded-[3px]" style={borda ? { border: '1px solid #bdb8ad' } : { background: cor }} />
    <span className="truncate">{texto}</span>
  </span>
);

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`;

export const MesAgenda = ({ dias, mesReferencia, aFazer, blocos, agora, onEscolherDia }: MesAgendaProps) => (
  <div className="overflow-x-auto rounded-[14px] border border-[#e2dfd7] bg-papel">
    <div className="min-w-[640px]">
      <div className="grid grid-cols-7 bg-[#f4f2ed]">
        {SIGLAS.map((s) => (
          <span key={s} className="border-b border-r border-borda-suave px-3 py-2.5 text-[11.5px] font-bold tracking-[0.08em] text-[#8f8a80] last:border-r-0">{s}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia, i) => {
          const fora = dia.getMonth() !== mesReferencia;
          const hoje = mesmoDia(dia, agora);
          const r = resumoDoDia(dia, aFazer, blocos, agora);
          return (
            <button
              key={dia.toISOString()}
              type="button"
              onClick={() => onEscolherDia(dia)}
              className={`flex min-h-[112px] flex-col gap-1.5 border-b border-borda-suave p-2.5 text-left transition-colors hover:bg-areia/10 ${(i + 1) % 7 ? 'border-r' : ''} ${fora ? 'bg-[#f4f2ed]' : hoje ? 'bg-areia/10' : ''}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-bold tabular-nums ${hoje ? 'bg-tinta text-papel' : fora ? 'text-pedra-claro' : 'text-tinta'}`}>
                {dia.getDate()}
              </span>
              {r.finalizadas > 0 && <Linha cor="#b9cbb0" texto={plural(r.finalizadas, 'finalizada', 'finalizadas')} />}
              {r.andamento > 0 && <Linha cor="#e3c98f" texto={plural(r.andamento, 'em andamento', 'em andamento')} />}
              {r.atrasadas > 0 && <Linha cor="#d99a8e" forte texto={plural(r.atrasadas, 'atrasada', 'atrasadas')} />}
              {r.aFazer > 0 && <Linha cor="" borda texto={`${r.aFazer} a fazer`} />}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
