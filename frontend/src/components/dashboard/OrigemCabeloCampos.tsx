import { PERDA_ESPERADA, PERDA_ESPERADA_LIMPEZA } from '../../utils/material';

export interface OrigemCabeloValores {
  origem_cabelo: 'cliente' | 'proprio';
  custo_cabelo: string;
  limpeza_mesclagem: boolean;
}

interface OrigemCabeloCamposProps {
  valores: OrigemCabeloValores;
  onChange: (valores: Partial<OrigemCabeloValores>) => void;
  erroCusto?: string;
}

const OPCOES: { value: OrigemCabeloValores['origem_cabelo']; label: string }[] = [
  { value: 'cliente', label: 'Da cliente' },
  { value: 'proprio', label: 'Nosso' },
];

/** Origem do cabelo, custo (quando é nosso) e limpeza/mesclagem — usados no painel Material. */
export const OrigemCabeloCampos = ({ valores, onChange, erroCusto }: OrigemCabeloCamposProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Origem do cabelo *</span>
        <div role="radiogroup" aria-label="Origem do cabelo" className="flex w-fit rounded-xl bg-[#e9e6df] p-[3px]">
          {OPCOES.map((opcao) => {
            const selecionado = valores.origem_cabelo === opcao.value;
            return (
              <button
                key={opcao.value}
                type="button"
                role="radio"
                aria-checked={selecionado}
                onClick={() => onChange({ origem_cabelo: opcao.value, ...(opcao.value === 'cliente' ? { custo_cabelo: '' } : {}) })}
                className={`h-[38px] rounded-[9px] px-[18px] text-sm transition-colors ${
                  selecionado ? 'bg-tinta font-semibold text-papel' : 'font-medium text-tinta-suave hover:text-tinta'
                }`}
              >
                {opcao.label}
              </button>
            );
          })}
        </div>
      </div>

      {valores.origem_cabelo === 'proprio' && (
        <div className="flex flex-col gap-2">
          <label htmlFor="custo_cabelo" className="text-sm font-medium text-gray-700">Custo do cabelo (R$) *</label>
          <input
            id="custo_cabelo"
            type="number"
            min="0"
            step="0.01"
            value={valores.custo_cabelo}
            onChange={(e) => onChange({ custo_cabelo: e.target.value })}
            className={`w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500 ${
              erroCusto ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0,00"
          />
          {erroCusto ? (
            <p className="text-sm text-red-600">{erroCusto}</p>
          ) : (
            <p className="text-xs text-gray-500">Quanto a Barra pagou pelo cabelo desta OS</p>
          )}
        </div>
      )}
    </div>

    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borda bg-white px-4 py-3.5">
      <input
        type="checkbox"
        checked={valores.limpeza_mesclagem}
        onChange={(e) => onChange({ limpeza_mesclagem: e.target.checked })}
        className="mt-0.5 h-5 w-5 accent-[#1f1e1b]"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-tinta">Limpeza/mesclagem autorizada pela cliente</span>
        <span className="text-[12.5px] text-[#6f6b62]">
          A perda esperada passa de {PERDA_ESPERADA}% para {PERDA_ESPERADA_LIMPEZA}%.
        </span>
      </span>
    </label>
  </div>
);
