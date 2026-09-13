import type { ItemAgenda } from '../types';
import { dataLocalIso } from './helpers';

export type VisaoAgenda = 'dia' | 'semana' | 'mes';

export const TODOS = 'todos';
export const SEM_RESPONSAVEL = 'sem';

const CORES_AVATAR = ['#c2a983', '#b9c4b2', '#d4b8a8', '#b8c0cc', '#d9c89a'];
export const corAvatar = (id: number) => CORES_AVATAR[id % CORES_AVATAR.length];

export const MINUTOS_POR_SLOT = 30;
export const ALTURA_SLOT = 28; // px por 30 minutos
export const PX_POR_MINUTO = ALTURA_SLOT / MINUTOS_POR_SLOT;
export const HORA_INICIO_PADRAO = 8;
export const HORA_FIM_PADRAO = 19;

const SIGLAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS_EXTENSO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const somarDias = (data: Date, dias: number) => new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
export const inicioDoDia = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate());
export const mesmoDia = (a: Date, b: Date) => dataLocalIso(a) === dataLocalIso(b);
export const siglaDia = (data: Date) => SIGLAS[data.getDay()];

/** Semana de segunda a domingo. */
export const inicioDaSemana = (data: Date) => somarDias(inicioDoDia(data), -((data.getDay() + 6) % 7));

/** Dias exibidos em cada visão (o mês ocupa semanas inteiras, de segunda a domingo). */
export function diasDaVisao(visao: VisaoAgenda, referencia: Date): Date[] {
  if (visao === 'dia') return [inicioDoDia(referencia)];
  if (visao === 'semana') return Array.from({ length: 7 }, (_, i) => somarDias(inicioDaSemana(referencia), i));
  const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const ultimo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
  const inicio = inicioDaSemana(primeiro);
  const total = Math.ceil(((ultimo.getTime() - inicio.getTime()) / 86400000 + 1) / 7) * 7;
  return Array.from({ length: total }, (_, i) => somarDias(inicio, i));
}

export function tituloPeriodo(visao: VisaoAgenda, referencia: Date): string {
  if (visao === 'dia') return `${DIAS_EXTENSO[referencia.getDay()]}, ${referencia.getDate()} de ${MESES[referencia.getMonth()]}`;
  if (visao === 'mes') return `${MESES[referencia.getMonth()][0].toUpperCase()}${MESES[referencia.getMonth()].slice(1)} de ${referencia.getFullYear()}`;
  const dias = diasDaVisao('semana', referencia);
  const [a, b] = [dias[0], dias[6]];
  const mesA = MESES[a.getMonth()].slice(0, 3);
  const mesB = MESES[b.getMonth()].slice(0, 3);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${mesB} ${b.getFullYear()}`
    : `${a.getDate()} ${mesA} – ${b.getDate()} ${mesB} ${b.getFullYear()}`;
}

export function navegar(visao: VisaoAgenda, referencia: Date, direcao: 1 | -1): Date {
  if (visao === 'dia') return somarDias(referencia, direcao);
  if (visao === 'semana') return somarDias(referencia, 7 * direcao);
  return new Date(referencia.getFullYear(), referencia.getMonth() + direcao, 1);
}

export const horaMinuto = (data: Date) =>
  `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;

/** Faixa de horas da grade: 8h às 19h, abrindo se houver trabalho fora disso. */
export function faixaDeHoras(blocos: ItemAgenda[], dias: Date[]): { inicio: number; fim: number } {
  let inicio = HORA_INICIO_PADRAO;
  let fim = HORA_FIM_PADRAO;
  for (const dia of dias) {
    for (const segmento of recortarNoDia(blocos, dia)) {
      // Cortes de meia-noite (trabalho que atravessa dias) não abrem a grade; só horários reais
      if (segmento.inicio.getTime() !== inicioDoDia(dia).getTime()) inicio = Math.min(inicio, segmento.inicio.getHours());
      if (segmento.fim.getTime() !== somarDias(inicioDoDia(dia), 1).getTime()) {
        fim = Math.max(fim, segmento.fim.getMinutes() > 0 ? segmento.fim.getHours() + 1 : segmento.fim.getHours());
      }
    }
  }
  return { inicio, fim: Math.min(24, fim) };
}

interface Segmento {
  item: ItemAgenda;
  inicio: Date;
  fim: Date;
}

/** Parte de cada bloco que cai dentro do dia (um trabalho pode atravessar dias). */
export function recortarNoDia(blocos: ItemAgenda[], dia: Date): Segmento[] {
  const comeco = inicioDoDia(dia);
  const final = somarDias(comeco, 1);
  return blocos.flatMap((item) => {
    if (!item.inicio || !item.fim) return [];
    // Trabalho em andamento há vários dias aparece só no dia em que começou e no dia atual
    if (item.status === 'em_desenvolvimento' && !mesmoDia(new Date(item.inicio), dia) && !mesmoDia(new Date(item.fim), dia)) return [];
    const inicio = new Date(Math.max(new Date(item.inicio).getTime(), comeco.getTime()));
    const fim = new Date(Math.min(new Date(item.fim).getTime(), final.getTime()));
    return fim > inicio ? [{ item, inicio, fim }] : [];
  });
}

export interface BlocoPosicionado extends Segmento {
  top: number;
  altura: number;
  coluna: number;
  totalColunas: number;
  continuaDeAntes: boolean;
}

/**
 * Posição dos blocos na grade do dia. Blocos que se sobrepõem dividem a largura
 * em colunas (o mesmo critério de agendas como Google Agenda).
 */
export function posicionarBlocos(blocos: ItemAgenda[], dia: Date, horaInicio: number): BlocoPosicionado[] {
  const segmentos = recortarNoDia(blocos, dia).sort((a, b) => a.inicio.getTime() - b.inicio.getTime() || b.fim.getTime() - a.fim.getTime());
  const base = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horaInicio);
  const posicionados: BlocoPosicionado[] = [];
  let grupo: BlocoPosicionado[] = [];
  let fimDoGrupo = 0;
  const fecharGrupo = () => {
    const total = Math.max(1, ...grupo.map((b) => b.coluna + 1));
    grupo.forEach((b) => { b.totalColunas = total; });
    grupo = [];
  };

  for (const segmento of segmentos) {
    if (grupo.length && segmento.inicio.getTime() >= fimDoGrupo) fecharGrupo();
    const ocupadas = new Set(grupo.filter((b) => b.fim.getTime() > segmento.inicio.getTime()).map((b) => b.coluna));
    let coluna = 0;
    while (ocupadas.has(coluna)) coluna += 1;
    const minutosInicio = Math.max(0, (segmento.inicio.getTime() - base.getTime()) / 60000);
    const minutosFim = (segmento.fim.getTime() - base.getTime()) / 60000;
    const bloco: BlocoPosicionado = {
      ...segmento,
      top: Math.round(minutosInicio * PX_POR_MINUTO),
      altura: Math.max(ALTURA_SLOT - 4, Math.round((minutosFim - minutosInicio) * PX_POR_MINUTO) - 2),
      coluna,
      totalColunas: 1,
      continuaDeAntes: new Date(segmento.item.inicio!).getTime() < inicioDoDia(dia).getTime(),
    };
    grupo.push(bloco);
    posicionados.push(bloco);
    fimDoGrupo = Math.max(fimDoGrupo, segmento.fim.getTime());
  }
  fecharGrupo();
  return posicionados;
}

/** OS em andamento começadas antes da agenda (sem horário de início): aviso na faixa do dia. */
export const andamentoSemHorario = (blocos: ItemAgenda[]) =>
  blocos.filter((b) => b.status === 'em_desenvolvimento' && !b.inicio);

/** Horário de um slot da grade (para soltar um arraste ou criar uma OS). */
export const horarioDoSlot = (dia: Date, horaInicio: number, indiceSlot: number) =>
  new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horaInicio, indiceSlot * MINUTOS_POR_SLOT);

export const valorDatetimeLocal = (data: Date) => `${dataLocalIso(data)}T${horaMinuto(data)}`;

export type SituacaoAgenda = 'a_fazer' | 'andamento' | 'finalizada' | 'atrasada';

export const situacao = (item: ItemAgenda): SituacaoAgenda =>
  item.atrasada ? 'atrasada' : item.status === 'pendente' ? 'a_fazer' : item.status === 'em_desenvolvimento' ? 'andamento' : 'finalizada';

export const ESTILO_SITUACAO: Record<SituacaoAgenda, { bloco: string; texto: string; rotulo: string }> = {
  a_fazer: { bloco: 'bg-papel border-borda', texto: 'text-tinta-suave', rotulo: 'A fazer' },
  andamento: { bloco: 'bg-ocre-fundo border-[#e3d0a8]', texto: 'text-[#6e4b12]', rotulo: 'Em andamento' },
  finalizada: { bloco: 'bg-salvia-fundo border-[#c9d3c3]', texto: 'text-[#3f5838]', rotulo: 'Finalizada' },
  atrasada: { bloco: 'bg-terracota-fundo border-[#e5bdb5]', texto: 'text-[#8c3a2f]', rotulo: 'Atrasada' },
};

export interface ResumoDia {
  finalizadas: number;
  andamento: number;
  atrasadas: number;
  aFazer: number;
}

/** Contagem por dia para a visão Mês. */
export function resumoDoDia(dia: Date, aFazer: ItemAgenda[], blocos: ItemAgenda[], agora: Date): ResumoDia {
  const doDia = (iso: string | null) => !!iso && mesmoDia(new Date(iso), dia);
  const pendentes = aFazer.filter((i) => doDia(i.prazo));
  const finalizadas = blocos.filter((b) => b.status === 'finalizada' && doDia(b.fim));
  const andamento = mesmoDia(dia, agora) ? blocos.filter((b) => b.status === 'em_desenvolvimento') : [];
  return {
    finalizadas: finalizadas.length,
    andamento: andamento.length,
    atrasadas: pendentes.filter((i) => i.atrasada).length + andamento.filter((b) => b.atrasada).length,
    aFazer: pendentes.filter((i) => !i.atrasada).length,
  };
}
