export const ITENS_POR_PAGINA = 5;

export interface Paginado<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
}

/**
 * Recorta a lista na página pedida. A página é sempre corrigida para um
 * intervalo válido: se a lista encolheu (uma OS avançou de coluna), cai na
 * última página que ainda existe em vez de mostrar uma página vazia.
 */
export function paginar<T>(itens: T[], pagina: number, porPagina = ITENS_POR_PAGINA): Paginado<T> {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaAtual = Math.min(Math.max(1, Math.floor(pagina) || 1), totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  return { itens: itens.slice(inicio, inicio + porPagina), paginaAtual, totalPaginas };
}

/** Prazo mais próximo (ou mais atrasado) primeiro; datas inválidas vão para o fim. */
export function ordenarPorPrazo<T extends { prazo_entrega: string }>(ordens: T[]): T[] {
  const tempo = (o: T) => {
    const t = new Date(o.prazo_entrega).getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  };
  return [...ordens].sort((a, b) => tempo(a) - tempo(b));
}
