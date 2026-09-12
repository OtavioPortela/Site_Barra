// Ícones de linha (grade 24px) no lugar dos emojis, para acompanhar a identidade visual.
const paths = {
  dashboard: 'M3.5 4.5h5v15h-5z M9.5 4.5h5v10h-5z M15.5 4.5h5v6h-5z',
  faturamento: 'M4 20h16 M7 16v-4 M12 16V8 M17 16V5',
  historico: 'M3 12a9 9 0 1 0 3-6.7 M3 4v4h4 M12 7.5V12l3 2',
  clientes: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18.5 14.5a6.5 6.5 0 0 1 3 5.5',
  caixa: 'M3.5 7.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z M3.5 7.5V6a2 2 0 0 1 2-2h10 M16.5 13.5h.01',
  recibo: 'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6',
  funcionarios: 'M4 6h16v13H4z M9 3h6v3H9z M9.5 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M6.5 16.5a3 3 0 0 1 6 0 M14.5 11h3 M14.5 14h3',
  configuracoes: 'M4 7h9 M17 7h3 M4 17h3 M11 17h9 M15 5v4 M9 15v4',
  busca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4',
  usuario: 'M4 20a8 8 0 0 1 16 0 M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mais: 'M12 5v14 M5 12h14',
  voltar: 'M19 12H5 M11 6l-6 6 6 6',
  avancar: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M9 6l6 6-6 6',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  mensagem: 'M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.2A8.5 8.5 0 1 1 20.5 11.5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  pacote: 'M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z M3.5 7.5L12 12l8.5-4.5 M12 12v9',
  cifrao: 'M12 3v18 M16.5 7H10a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H7',
  sair: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 16l-4-4 4-4 M6 12h10',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  fechar: 'M6 18L18 6 M6 6l12 12',
  linha: 'M4 17c3-6 6 2 9-3s4-7 7-6',
} as const;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export const Icon = ({ name, className = 'h-[18px] w-[18px]', strokeWidth = 1.6 }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path d={paths[name]} />
  </svg>
);
