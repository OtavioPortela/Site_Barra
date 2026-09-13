import { useEffect, useRef, useState } from 'react';
import type { ProfissionalAgenda } from '../../types';
import { Icon } from '../common/Icon';
import { SEM_RESPONSAVEL, TODOS, corAvatar } from '../../utils/agenda';

export const Avatar = ({ iniciais, id, tamanho = 30, escuro = false }: { iniciais: string; id: number; tamanho?: number; escuro?: boolean }) => (
  <span
    className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
    style={{
      width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.36),
      background: escuro ? '#1f1e1b' : corAvatar(id), color: escuro ? '#f6f3ec' : '#1f1e1b',
    }}
  >
    {iniciais}
  </span>
);

interface SeletorProfissionalProps {
  profissionais: ProfissionalAgenda[];
  valor: string;
  onChange: (valor: string) => void;
}

export const SeletorProfissional = ({ profissionais, valor, onChange }: SeletorProfissionalProps) => {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fechar);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fechar); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  const atual = profissionais.find((p) => String(p.id) === valor);
  const rotulo = valor === TODOS ? 'Todos os profissionais' : valor === SEM_RESPONSAVEL ? 'Sem responsável' : atual?.nome.split(' ')[0] ?? 'Profissional';

  const opcoes = [
    { valor: TODOS, nome: 'Todos os profissionais', detalhe: 'Visão geral da equipe' },
    ...profissionais.map((p) => ({
      valor: String(p.id), nome: p.nome, pessoa: p,
      detalhe: [p.is_staff ? 'Patrão' : 'Funcionário', p.em_andamento ? `${p.em_andamento} em andamento` : null, p.atrasadas ? `${p.atrasadas} atrasada${p.atrasadas > 1 ? 's' : ''}` : null].filter(Boolean).join(' · '),
    })),
    { valor: SEM_RESPONSAVEL, nome: 'Sem responsável', detalhe: 'OS antigas, antes da agenda' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={`flex h-11 items-center gap-2.5 rounded-xl border bg-papel pl-1.5 pr-3 transition-colors ${aberto ? 'border-tinta' : 'border-borda hover:border-tinta/30'}`}
      >
        {atual ? <Avatar iniciais={atual.iniciais} id={atual.id} escuro={atual.is_staff} /> : (
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e3e1da] text-tinta-suave">
            <Icon name="clientes" className="h-4 w-4" />
          </span>
        )}
        <span className="max-w-[180px] truncate text-[15px] font-semibold text-tinta">{rotulo}</span>
        <Icon name="chevron" className={`h-3.5 w-3.5 text-pedra transition-transform ${aberto ? '-rotate-90' : 'rotate-90'}`} strokeWidth={1.8} />
      </button>

      {aberto && (
        <div role="listbox" aria-label="Selecione o profissional" className="absolute left-0 top-[calc(100%+6px)] z-40 flex w-[min(320px,calc(100vw-32px))] flex-col gap-0.5 rounded-2xl border border-[#e2dfd7] bg-papel p-2 shadow-[0_24px_50px_-18px_rgba(31,30,27,0.45)]">
          <span className="px-2.5 pb-2 pt-1.5 text-[11.5px] font-bold tracking-[0.08em] text-[#8f8a80]">SELECIONE O PROFISSIONAL</span>
          {opcoes.map((o) => {
            const selecionado = o.valor === valor;
            return (
              <button
                key={o.valor}
                type="button"
                role="option"
                aria-selected={selecionado}
                onClick={() => { onChange(o.valor); setAberto(false); }}
                className={`flex min-h-[52px] items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-left transition-colors ${selecionado ? 'bg-[#f1ece2]' : 'hover:bg-tinta/[0.04]'}`}
              >
                {'pessoa' in o && o.pessoa ? <Avatar iniciais={o.pessoa.iniciais} id={o.pessoa.id} tamanho={34} escuro={o.pessoa.is_staff} /> : (
                  <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#e3e1da] text-tinta-suave">
                    <Icon name={o.valor === TODOS ? 'clientes' : 'usuario'} className="h-4 w-4" />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-semibold text-tinta">{o.nome}</span>
                  <span className="truncate text-[12.5px] text-pedra">{o.detalhe}</span>
                </span>
                {selecionado && <span className="text-areia-escuro"><Icon name="check" /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
