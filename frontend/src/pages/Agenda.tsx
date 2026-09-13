import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { agendaService, ordemServicoService } from '../services/api';
import type { ItemAgenda, RespostaAgenda } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/common/Icon';
import { GradeAgenda } from '../components/agenda/GradeAgenda';
import { MesAgenda } from '../components/agenda/MesAgenda';
import { CartaoOSAgenda } from '../components/agenda/CartaoOSAgenda';
import { SeletorProfissional } from '../components/agenda/SeletorProfissional';
import { NewOSModal } from '../components/dashboard/NewOSModal';
import { OSDetailsModal } from '../components/dashboard/OSDetailsModal';
import { FinalizarOSModal, type MedidasFinais, type OSParaFinalizar } from '../components/dashboard/FinalizarOSModal';
import { dataLocalIso } from '../utils/helpers';
import { TODOS, diasDaVisao, navegar, tituloPeriodo, valorDatetimeLocal, type VisaoAgenda } from '../utils/agenda';

const VISOES: { value: VisaoAgenda; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
];

const mensagemDeErro = (error: unknown, padrao: string) =>
  (error as { response?: { data?: { error?: string } } })?.response?.data?.error || padrao;

export const Agenda = () => {
  const { isPatrao } = useAuth();
  const [visao, setVisao] = useState<VisaoAgenda>(() => (window.innerWidth < 768 ? 'dia' : 'semana'));
  const [referencia, setReferencia] = useState(() => new Date());
  const [profissional, setProfissional] = useState(TODOS);
  const [dados, setDados] = useState<RespostaAgenda | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<ItemAgenda | null>(null);
  const [osDetalhe, setOsDetalhe] = useState<number | null>(null);
  const [paraFinalizar, setParaFinalizar] = useState<OSParaFinalizar | null>(null);
  const [novaOS, setNovaOS] = useState<string | null>(null);

  const dias = useMemo(() => diasDaVisao(visao, referencia), [visao, referencia]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setDados(await agendaService.get({ inicio: dataLocalIso(dias[0]), fim: dataLocalIso(dias[dias.length - 1]), responsavel: profissional }));
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao carregar a agenda'));
    } finally {
      setCarregando(false);
    }
  }, [dias, profissional]);

  useEffect(() => { carregar(); }, [carregar]);

  const agora = dados ? new Date(dados.agora) : new Date();

  const mover = async (item: ItemAgenda, novoPrazo: Date) => {
    if (!item.pode_mover) {
      toast.error('Só o patrão ou quem criou a OS pode mudar o prazo.');
      return;
    }
    try {
      await ordemServicoService.mudarPrazo(item.id, novoPrazo.toISOString());
      toast.success(`Prazo da ${item.numero} alterado.`);
      carregar();
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Não foi possível mudar o prazo.'));
    }
  };

  const comecar = async (item: ItemAgenda) => {
    try {
      await ordemServicoService.updateStatus(item.id, 'em_desenvolvimento');
      toast.success(`${item.numero} em andamento com você.`);
      setAberto(null);
      carregar();
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Não foi possível começar a OS.'));
    }
  };

  const trocarResponsavel = async (item: ItemAgenda, responsavelId: number) => {
    try {
      await ordemServicoService.trocarResponsavel(item.id, responsavelId);
      toast.success('Responsável alterado.');
      setAberto(null);
      carregar();
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Não foi possível trocar o responsável.'));
    }
  };

  const finalizar = async (medidas?: MedidasFinais) => {
    if (!paraFinalizar) return;
    await ordemServicoService.updateStatus(paraFinalizar.id, 'finalizada', medidas);
    setParaFinalizar(null);
    toast.success('OS finalizada!');
    carregar();
  };

  const abrirNovaOS = (prazo?: Date) => {
    const base = prazo ?? new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate(), 18, 0);
    setNovaOS(valorDatetimeLocal(base));
  };

  const hojeVisivel = dias.some((d) => dataLocalIso(d) === dataLocalIso(new Date()));

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:px-8 lg:py-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-serif text-[34px] font-medium leading-none text-tinta sm:text-[42px]">Agenda</h1>
          <div className="h-0.5 w-14 rounded-full bg-areia" />
        </div>
        <button type="button" onClick={() => abrirNovaOS()} className="hidden h-11 items-center gap-2 rounded-[11px] bg-tinta pl-4 pr-5 text-sm font-semibold text-papel hover:bg-black sm:flex">
          <Icon name="mais" />
          Nova OS
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <SeletorProfissional profissionais={dados?.profissionais ?? []} valor={profissional} onChange={setProfissional} />
          <div role="tablist" aria-label="Visão" className="flex rounded-[11px] bg-[#e3e1da] p-[3px]">
            {VISOES.map((v) => (
              <button
                key={v.value}
                type="button"
                role="tab"
                aria-selected={visao === v.value}
                onClick={() => setVisao(v.value)}
                className={`h-[34px] rounded-lg px-3.5 text-[13px] transition-colors ${visao === v.value ? 'bg-papel font-semibold text-tinta shadow-[0_1px_2px_rgba(31,30,27,0.08)]' : 'font-medium text-tinta-suave hover:text-tinta'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setReferencia(new Date())} disabled={hojeVisivel} className="h-9 rounded-[10px] border border-borda bg-papel px-3.5 text-[13px] font-semibold text-tinta disabled:opacity-50">Hoje</button>
          <button type="button" aria-label="Período anterior" onClick={() => setReferencia((r) => navegar(visao, r, -1))} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-borda bg-papel">
            <Icon name="chevronEsquerda" className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <span className="min-w-[150px] text-center font-serif text-xl font-semibold tabular-nums text-tinta sm:min-w-[210px] sm:text-[22px]">{tituloPeriodo(visao, referencia)}</span>
          <button type="button" aria-label="Próximo período" onClick={() => setReferencia((r) => navegar(visao, r, 1))} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-borda bg-papel">
            <Icon name="chevron" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {carregando && !dados ? (
        <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-2 border-borda border-t-tinta" /></div>
      ) : dados && (
        <div className={`transition-opacity ${carregando ? 'opacity-60' : ''}`}>
          {visao === 'mes' ? (
            <MesAgenda
              dias={dias}
              mesReferencia={referencia.getMonth()}
              aFazer={dados.a_fazer}
              blocos={dados.blocos}
              agora={agora}
              onEscolherDia={(dia) => { setReferencia(dia); setVisao('dia'); }}
            />
          ) : (
            <GradeAgenda
              dias={dias}
              aFazer={dados.a_fazer}
              blocos={dados.blocos}
              agora={agora}
              compacta={visao === 'dia'}
              onAbrir={setAberto}
              onMover={mover}
              onCriar={abrirNovaOS}
            />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[#6f6b62]">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-borda bg-[#f4f2ed]" />A fazer</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-[#e3d0a8] bg-ocre-fundo" />Em andamento</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-[#c9d3c3] bg-salvia-fundo" />Finalizada</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-[#e5bdb5] bg-terracota-fundo" />Atrasada</span>
            <span className="hidden sm:inline">· Arraste uma OS a fazer ou em andamento para mudar o prazo · Clique duas vezes num horário vazio para criar uma OS</span>
          </div>
        </div>
      )}

      <button type="button" aria-label="Nova OS" onClick={() => abrirNovaOS()} className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-tinta text-papel shadow-[0_12px_24px_-8px_rgba(31,30,27,0.5)] sm:hidden">
        <Icon name="mais" className="h-6 w-6" />
      </button>

      {aberto && (
        <CartaoOSAgenda
          item={aberto}
          profissionais={dados?.profissionais ?? []}
          ehPatrao={isPatrao()}
          onFechar={() => setAberto(null)}
          onAbrirOS={(item) => { setAberto(null); setOsDetalhe(item.id); }}
          onComecar={comecar}
          onFinalizar={(item) => {
            setAberto(null);
            setParaFinalizar({
              id: item.id, numero: item.numero, cliente: item.cliente, servico: item.servico,
              peso_gramas: item.peso_gramas, tamanho_cabelo_cm: item.tamanho_cabelo_cm,
              limpeza_mesclagem: item.limpeza_mesclagem, exige_peso_final: item.exige_peso_final,
            });
          }}
          onTrocarResponsavel={trocarResponsavel}
        />
      )}

      <FinalizarOSModal ordem={paraFinalizar} onConfirm={finalizar} onInformarDepois={() => finalizar()} onClose={() => setParaFinalizar(null)} />
      <OSDetailsModal isOpen={osDetalhe !== null} ordemId={osDetalhe} onClose={() => setOsDetalhe(null)} onUpdated={carregar} />
      <NewOSModal isOpen={novaOS !== null} prazoInicial={novaOS ?? undefined} onClose={() => setNovaOS(null)} onSuccess={() => { setNovaOS(null); carregar(); }} />
    </div>
  );
};
