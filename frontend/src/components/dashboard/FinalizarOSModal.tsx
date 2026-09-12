import { useEffect, useRef, useState } from 'react';
import { Icon } from '../common/Icon';
import { calcularPerda, formatarPercentual, perdaEsperada } from '../../utils/material';

export interface MedidasFinais {
  peso_final_gramas?: number;
  tamanho_final_cm?: number;
}

export interface OSParaFinalizar {
  id: number;
  numero: string;
  cliente: string;
  servico?: string;
  peso_gramas?: number;
  tamanho_cabelo_cm?: number;
  limpeza_mesclagem?: boolean;
  exige_peso_final?: boolean;
}

interface FinalizarOSModalProps {
  ordem: OSParaFinalizar | null;
  /** "finalizar": ao avançar para Finalizada. "informar": OS já finalizada sem peso (painel Material). */
  modo?: 'finalizar' | 'informar';
  onConfirm: (medidas: MedidasFinais) => Promise<void>;
  onInformarDepois?: () => Promise<void>;
  onClose: () => void;
}

const mensagemDeErro = (error: unknown) => {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return 'Não foi possível salvar. Tente novamente.';
  if (typeof data.error === 'string') return data.error;
  const primeiro = Object.values(data)[0];
  return Array.isArray(primeiro) ? String(primeiro[0]) : 'Não foi possível salvar. Tente novamente.';
};

export const FinalizarOSModal = ({ ordem, modo = 'finalizar', onConfirm, onInformarDepois, onClose }: FinalizarOSModalProps) => {
  const [peso, setPeso] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const pesoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ordem) return;
    setPeso('');
    setTamanho('');
    setErro('');
    setTimeout(() => pesoRef.current?.focus(), 50);
  }, [ordem]);

  if (!ordem) return null;

  const pesoEntrada = ordem.peso_gramas ?? 0;
  const tamanhoEntrada = ordem.tamanho_cabelo_cm ?? 0;
  const pesoNumero = parseInt(peso, 10);
  const tamanhoNumero = parseInt(tamanho, 10);
  const perda = calcularPerda(pesoEntrada, pesoNumero, ordem.limpeza_mesclagem);
  const esperado = perdaEsperada(ordem.limpeza_mesclagem);
  const pesoMaiorQueEntrada = pesoEntrada > 0 && pesoNumero > pesoEntrada;
  const podeInformarDepois = modo === 'finalizar' && ordem.exige_peso_final === false && !!onInformarDepois;

  const executar = async (acao: () => Promise<void>) => {
    setErro('');
    setSalvando(true);
    try {
      await acao();
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!peso || !Number.isFinite(pesoNumero) || pesoNumero < 1) {
      setErro('Informe o peso final em gramas.');
      return;
    }
    if (pesoMaiorQueEntrada) {
      setErro(`O peso final não pode ser maior que o de entrada (${pesoEntrada} g).`);
      return;
    }
    if (tamanho && tamanhoEntrada > 0 && tamanhoNumero > tamanhoEntrada) {
      setErro(`O tamanho final não pode ser maior que o de entrada (${tamanhoEntrada} cm).`);
      return;
    }
    executar(() => onConfirm({
      peso_final_gramas: pesoNumero,
      ...(tamanho && Number.isFinite(tamanhoNumero) ? { tamanho_final_cm: tamanhoNumero } : {}),
    }));
  };

  const campo =
    'h-[46px] w-full rounded-[11px] border border-borda bg-white px-3.5 text-[15px] tabular-nums text-tinta placeholder:text-pedra-claro focus:border-tinta focus:outline-none focus:ring-4 focus:ring-areia/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4" onClick={salvando ? undefined : onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="finalizar-os-titulo"
        noValidate
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[520px] flex-col gap-[22px] rounded-[18px] bg-papel p-6 shadow-[0_24px_60px_-20px_rgba(31,30,27,0.45)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.06em] text-[#8f8a80] tabular-nums">{ordem.numero}</span>
            <h2 id="finalizar-os-titulo" className="font-serif text-[32px] font-semibold leading-none text-tinta">
              {modo === 'finalizar' ? 'Finalizar OS' : 'Informar peso final'}
            </h2>
            <span className="text-sm text-[#6f6b62]">
              {ordem.servico ? `${ordem.servico} · ${ordem.cliente}` : ordem.cliente}
            </span>
          </div>
          <button type="button" onClick={onClose} disabled={salvando} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-[9px] text-pedra hover:bg-tinta/5">
            <Icon name="fechar" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            ['Peso de entrada', pesoEntrada ? `${pesoEntrada} g` : '—'],
            ['Tamanho de entrada', tamanhoEntrada ? `${tamanhoEntrada} cm` : '—'],
            ['Perda esperada', `até ${esperado}%`],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="flex flex-col gap-1 rounded-xl bg-[#f0eee8] px-3.5 py-3">
              <span className="text-xs text-[#6f6b62]">{rotulo}</span>
              <span className="font-serif text-2xl font-semibold leading-none tabular-nums">{valor}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-tinta-suave">
              Peso final (g) <span className="text-terracota">*</span>
            </span>
            <input
              ref={pesoRef}
              type="number"
              inputMode="numeric"
              min={1}
              max={pesoEntrada || undefined}
              value={peso}
              onChange={(e) => { setPeso(e.target.value); setErro(''); }}
              className={campo}
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-tinta-suave">Tamanho final (cm)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={tamanhoEntrada || undefined}
              value={tamanho}
              onChange={(e) => { setTamanho(e.target.value); setErro(''); }}
              className={campo}
              placeholder="Opcional"
            />
          </label>
        </div>

        {perda && (
          <div
            role="status"
            className={`flex items-center gap-3 rounded-xl px-4 py-3.5 ${
              perda.acimaDoEsperado ? 'bg-terracota-fundo text-[#8c3a2f]' : 'bg-salvia-fundo text-[#3f5838]'
            }`}
          >
            <Icon name={perda.acimaDoEsperado ? 'alerta' : 'check'} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold tabular-nums">
                Perda de {formatarPercentual(perda.percentual)} ({perda.gramas} g)
              </span>
              <span className="text-[13px] tabular-nums">
                {perda.acimaDoEsperado ? `Acima dos ${esperado}% esperados` : 'Dentro do esperado'}
                {tamanho && tamanhoEntrada > 0 && tamanhoNumero <= tamanhoEntrada
                  ? ` · perdeu ${tamanhoEntrada - tamanhoNumero} cm no comprimento`
                  : ''}
              </span>
            </div>
          </div>
        )}

        {erro && <p role="alert" className="-mt-2 text-sm font-medium text-terracota">{erro}</p>}

        <div className="flex items-center justify-between gap-3 pt-1.5">
          {podeInformarDepois ? (
            <button
              type="button"
              disabled={salvando}
              onClick={() => executar(onInformarDepois!)}
              className="flex flex-col items-start gap-0.5 text-left"
            >
              <span className="text-sm font-semibold text-tinta-suave hover:text-tinta">Informar depois</span>
              <span className="text-[11.5px] text-pedra-claro">Só para OS criadas antes do controle de perdas</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={salvando}
            className="flex h-[46px] items-center gap-2 rounded-[11px] bg-tinta px-[22px] text-[15px] font-semibold text-papel transition-colors hover:bg-black disabled:opacity-60"
          >
            <span className="text-areia"><Icon name="check" /></span>
            {salvando ? 'Salvando...' : modo === 'finalizar' ? 'Finalizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};
