import { TIPOS_MATERIAL } from '../../utils/material';
import { Icon } from './Icon';

interface TipoMaterialSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TipoMaterialSelector = ({ value, onChange }: TipoMaterialSelectorProps) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-medium text-gray-700">Tipo de material *</span>
    <div role="radiogroup" aria-label="Tipo de material" className="flex flex-wrap gap-2">
      {TIPOS_MATERIAL.map((tipo) => {
        const selecionado = value === tipo.value;
        return (
          <button
            key={tipo.value}
            type="button"
            role="radio"
            aria-checked={selecionado}
            onClick={() => onChange(tipo.value)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] transition-colors ${
              selecionado
                ? 'bg-tinta font-semibold text-papel'
                : 'border border-borda bg-white font-medium text-tinta-suave hover:border-tinta/30'
            }`}
          >
            {selecionado && (
              <span className="text-areia"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={1.8} /></span>
            )}
            {tipo.label}
          </button>
        );
      })}
    </div>
    <span className="text-xs text-pedra">“Compra de cabelo” entra no custo do cabelo nosso no painel Material.</span>
  </div>
);
