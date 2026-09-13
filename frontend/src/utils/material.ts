import { dataLocalIso } from './helpers';

// Regras do controle de perdas, iguais às do backend (apps/faturamento/material.py).
export const PERDA_ESPERADA = 20;
export const PERDA_ESPERADA_LIMPEZA = 40;

export const TIPOS_MATERIAL = [
  { value: 'linha', label: 'Linha' },
  { value: 'cola', label: 'Cola' },
  { value: 'tela', label: 'Tela' },
  { value: 'fita_silicone', label: 'Fita/silicone' },
  { value: 'embalagem', label: 'Embalagem' },
  { value: 'compra_cabelo', label: 'Compra de cabelo' },
  { value: 'outro', label: 'Outro' },
] as const;

export const perdaEsperada = (limpezaMesclagem?: boolean) =>
  limpezaMesclagem ? PERDA_ESPERADA_LIMPEZA : PERDA_ESPERADA;

export interface ResultadoPerda {
  percentual: number;
  gramas: number;
  acimaDoEsperado: boolean;
}

/** Perda de uma OS; null enquanto o peso final não é um número válido e coerente. */
export function calcularPerda(pesoEntrada: number, pesoFinal: number, limpezaMesclagem?: boolean): ResultadoPerda | null {
  if (!pesoEntrada || !Number.isFinite(pesoFinal) || pesoFinal < 1 || pesoFinal > pesoEntrada) return null;
  const gramas = pesoEntrada - pesoFinal;
  const percentual = Math.round((gramas / pesoEntrada) * 1000) / 10;
  return { percentual, gramas, acimaDoEsperado: percentual > perdaEsperada(limpezaMesclagem) };
}

export const formatarPercentual = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export const formatarPeso = (gramas: number) =>
  gramas >= 1000
    ? `${(gramas / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
    : `${gramas.toLocaleString('pt-BR')} g`;

export type PresetPeriodo = 'mes' | 'mes_passado' | '90_dias';

const dataIso = dataLocalIso;

/** Datas locais (sem passar por UTC, que muda o dia à noite no Brasil). */
export const periodoDoPreset = (preset: PresetPeriodo, hoje = new Date()) => {
  if (preset === 'mes_passado') {
    return {
      data_inicio: dataIso(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
      data_fim: dataIso(new Date(hoje.getFullYear(), hoje.getMonth(), 0)),
    };
  }
  if (preset === '90_dias') {
    return { data_inicio: dataIso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 89)), data_fim: dataIso(hoje) };
  }
  return { data_inicio: dataIso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), data_fim: dataIso(hoje) };
};
