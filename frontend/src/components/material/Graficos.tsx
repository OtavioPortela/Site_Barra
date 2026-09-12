import { useState } from 'react';
import { formatarPercentual, formatarPeso } from '../../utils/material';

// Cor única de dados (bronze validado para contraste sobre o fundo papel); textos usam as cores de texto.
const COR_DADO = '#a6742a';
const COR_DADO_CLARA = '#d9c3a0';

const formatarSemana = (iso: string) => {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
};

const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <div className="pointer-events-none whitespace-nowrap rounded-[9px] bg-tinta px-3 py-2 text-xs leading-relaxed text-[#bdb8ad] shadow-lg">
    {children}
  </div>
);

/* ------------------------------------------------------------------ */

interface PontoPerda {
  semana: string;
  perda: number | null;
  os: number;
  gramas_entrada: number;
  gramas_perdidas: number;
}

export const PerdaSemanalChart = ({ dados, meta }: { dados: PontoPerda[]; meta: number }) => {
  const [ativo, setAtivo] = useState<number | null>(null);
  const pontos = dados.filter((d) => d.perda !== null) as (PontoPerda & { perda: number })[];

  const W = 620;
  const H = 250;
  const esq = 46;
  const dir = 600;
  const topo = 14;
  const base = 214;
  const maximo = Math.max(30, Math.ceil((Math.max(meta, ...pontos.map((p) => p.perda)) + 5) / 10) * 10);
  const ticks = Array.from({ length: maximo / 10 + 1 }, (_, i) => i * 10);
  const passo = pontos.length > 1 ? (dir - 14 - (esq + 14)) / (pontos.length - 1) : 0;
  const x = (i: number) => (pontos.length > 1 ? esq + 14 + i * passo : (esq + dir) / 2);
  const y = (v: number) => base - (v / maximo) * (base - topo);
  const linha = pontos.map((p, i) => `${x(i)},${y(p.perda)}`).join(' ');
  const area = pontos.length > 1 ? `M${linha.split(' ').join(' L')} L${x(pontos.length - 1)},${base} L${x(0)},${base} Z` : '';
  const ultimo = pontos[pontos.length - 1];
  const ponto = ativo !== null ? pontos[ativo] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label="Perda média por semana">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={esq} x2={dir} y1={y(t)} y2={y(t)} stroke="#ece9e2" strokeWidth={1} />
            <text x={esq - 8} y={y(t) + 4} textAnchor="end" fontSize={11.5} fill="#8f8a80">{t}%</text>
          </g>
        ))}
        <line x1={esq} x2={dir} y1={y(meta)} y2={y(meta)} stroke="#4a4741" strokeWidth={1.2} />
        <text x={dir} y={y(meta) - 8} textAnchor="end" fontSize={11.5} fontWeight={700} fill="#4a4741">Meta {meta}%</text>
        {area && <path d={area} fill={COR_DADO} fillOpacity={0.1} />}
        {pontos.length > 1 && <polyline points={linha} fill="none" stroke={COR_DADO} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {ponto && ativo !== null && (
          <line x1={x(ativo)} x2={x(ativo)} y1={topo} y2={base} stroke="#bdb8ad" strokeWidth={1} />
        )}
        {pontos.map((p, i) => (
          (i === ativo || i === pontos.length - 1) && (
            <circle key={p.semana} cx={x(i)} cy={y(p.perda)} r={5} fill={COR_DADO} stroke="#faf9f6" strokeWidth={2} />
          )
        ))}
        {ultimo && ativo === null && (
          <text x={x(pontos.length - 1)} y={y(ultimo.perda) + 24} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1f1e1b">
            {formatarPercentual(ultimo.perda)}
          </text>
        )}
        {pontos.map((p, i) => (
          <text key={`x-${p.semana}`} x={x(i)} y={238} textAnchor="middle" fontSize={11.5} fill="#8f8a80">
            {pontos.length <= 12 || i % 2 === 0 ? formatarSemana(p.semana) : ''}
          </text>
        ))}
        {/* Faixas de hover maiores que os pontos */}
        {pontos.map((p, i) => (
          <rect
            key={`h-${p.semana}`}
            x={x(i) - Math.max(passo, 40) / 2}
            y={topo}
            width={Math.max(passo, 40)}
            height={base - topo}
            fill="transparent"
            onMouseEnter={() => setAtivo(i)}
            onMouseLeave={() => setAtivo(null)}
          />
        ))}
      </svg>
      {ponto && ativo !== null && (
        <div
          className="absolute top-2"
          style={{ left: `${(x(ativo) / W) * 100}%`, transform: x(ativo) > W / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
        >
          <Tooltip>
            <div>Semana de {formatarSemana(ponto.semana)}</div>
            <div className="text-sm font-bold text-[#f6f3ec]">Perda de {formatarPercentual(ponto.perda)}</div>
            <div>{ponto.os} OS pesadas · {formatarPeso(ponto.gramas_perdidas)} perdidos</div>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

interface LinhaPerda {
  nome: string;
  perda: number | null;
  os: number;
  gramas_perdidas: number;
}

export const BarrasPerda = ({ linhas, meta, compacto = false }: { linhas: LinhaPerda[]; meta: number; compacto?: boolean }) => {
  const maximo = Math.max(30, Math.ceil((Math.max(meta, ...linhas.map((l) => l.perda ?? 0)) + 5) / 10) * 10);
  const largura = (v: number) => `${(v / maximo) * 100}%`;

  return (
    <div className={`flex flex-col ${compacto ? 'gap-2.5' : 'gap-3'}`}>
      {linhas.map((linha) => {
        const acima = (linha.perda ?? 0) > meta;
        return (
          <div key={linha.nome} className="group relative flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] text-tinta-suave">{linha.nome}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {acima && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-terracota">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3l9.5 17h-19z M12 10v4 M12 17h.01" />
                    </svg>
                    acima
                  </span>
                )}
                <span className="text-[13px] font-bold tabular-nums text-tinta">{formatarPercentual(linha.perda)}</span>
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-[#efece5]">
              <div className="absolute inset-y-0 left-0 rounded-r" style={{ width: largura(linha.perda ?? 0), background: COR_DADO }} />
              <div className="absolute -inset-y-[3px] w-[1.5px] bg-tinta-suave" style={{ left: largura(meta) }} />
            </div>
            <div className="absolute -top-10 right-0 z-10 hidden group-hover:block">
              <Tooltip>{linha.os} OS · {formatarPeso(linha.gramas_perdidas)} perdidos</Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */

export const ColunasVolume = ({ dados }: { dados: { semana: string; gramas: number; os: number }[] }) => {
  const [ativo, setAtivo] = useState<number | null>(null);
  const kg = dados.map((d) => d.gramas / 1000);
  const maximo = Math.max(1, Math.ceil(Math.max(...kg, 0) / 5) * 5);
  const hoje = new Date();
  const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() + 6) % 7));
  const semanaAtual = `${segunda.getFullYear()}-${String(segunda.getMonth() + 1).padStart(2, '0')}-${String(segunda.getDate()).padStart(2, '0')}`;

  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-2">
      <div className="flex h-[200px] flex-col justify-between text-right text-[11.5px] leading-none tabular-nums text-[#8f8a80]">
        <span>{maximo}</span>
        <span>{maximo / 2}</span>
        <span>0</span>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="relative flex h-[200px] items-end gap-0.5 border-b border-[#dad7cf]">
          <div className="absolute inset-x-0 top-0 h-px bg-[#ece9e2]" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-[#ece9e2]" />
          {dados.map((d, i) => (
            <div
              key={d.semana}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
            >
              {ativo === i && (
                <div className={`absolute bottom-full z-10 mb-1 ${i > dados.length / 2 ? 'right-0' : 'left-0'}`}>
                  <Tooltip>
                    <div>Semana de {formatarSemana(d.semana)}</div>
                    <div className="text-sm font-bold text-[#f6f3ec]">{formatarPeso(d.gramas)}</div>
                    <div>{d.os} OS recebidas</div>
                  </Tooltip>
                </div>
              )}
              <div
                className="w-full max-w-[22px] rounded-t"
                style={{ height: `${(kg[i] / maximo) * 100}%`, background: d.semana >= semanaAtual ? COR_DADO_CLARA : COR_DADO }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-0.5">
          {dados.map((d, i) => (
            <span key={d.semana} className="flex-1 text-center text-[11px] tabular-nums text-[#8f8a80]">
              {dados.length <= 10 || i % 2 === 0 ? formatarSemana(d.semana) : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
