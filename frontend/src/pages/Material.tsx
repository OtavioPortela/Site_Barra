import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { materialService, ordemServicoService } from '../services/api';
import type { PainelMaterial } from '../types';
import { Icon } from '../components/common/Icon';
import { BarrasPerda, ColunasVolume, PerdaSemanalChart } from '../components/material/Graficos';
import { FinalizarOSModal, type MedidasFinais, type OSParaFinalizar } from '../components/dashboard/FinalizarOSModal';
import { formatCurrency } from '../utils/helpers';
import { formatarPercentual, formatarPeso, periodoDoPreset, type PresetPeriodo } from '../utils/material';

type Preset = PresetPeriodo | 'personalizado';

const PRESETS: { value: PresetPeriodo; label: string }[] = [
  { value: 'mes', label: 'Este mês' },
  { value: 'mes_passado', label: 'Mês passado' },
  { value: '90_dias', label: '90 dias' },
];

const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-[14px] border border-[#e2dfd7] bg-papel ${className}`}>{children}</div>
);

const TituloCard = ({ titulo, subtitulo, direita }: { titulo: string; subtitulo?: string; direita?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex flex-col gap-0.5">
      <span className="text-[15px] font-bold text-tinta">{titulo}</span>
      {subtitulo && <span className="text-[12.5px] text-[#8f8a80]">{subtitulo}</span>}
    </div>
    {direita}
  </div>
);

const Vazio = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d6d3ca] px-4 py-8 text-center text-[13.5px] text-pedra">
    <span className="text-areia"><Icon name="linha" className="h-[22px] w-[22px]" /></span>
    {children}
  </div>
);

const Secao = ({ children }: { children: React.ReactNode }) => (
  <h2 className="-mb-2 mt-2 font-serif text-[30px] font-semibold text-tinta">{children}</h2>
);

const Th = ({ children, direita = false }: { children: React.ReactNode; direita?: boolean }) => (
  <th className={`pb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#8f8a80] ${direita ? 'text-right' : 'text-left'}`}>
    {children}
  </th>
);

export const Material = () => {
  const [preset, setPreset] = useState<Preset>('mes');
  const [periodo, setPeriodo] = useState(periodoDoPreset('mes'));
  const [dados, setDados] = useState<PainelMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarSemPeso, setMostrarSemPeso] = useState(false);
  const [ordemParaPesar, setOrdemParaPesar] = useState<OSParaFinalizar | null>(null);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setDados(await materialService.getPainel(periodo));
    } catch (error) {
      const mensagem = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(mensagem || 'Erro ao carregar o painel Material');
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const escolherPreset = (valor: PresetPeriodo) => {
    setPreset(valor);
    setPeriodo(periodoDoPreset(valor));
  };

  const mudarData = (campo: 'data_inicio' | 'data_fim', valor: string) => {
    if (!valor) return;
    setPreset('personalizado');
    setPeriodo((atual) => ({ ...atual, [campo]: valor }));
  };

  const salvarPeso = async (medidas: MedidasFinais) => {
    if (!ordemParaPesar) return;
    await ordemServicoService.update(ordemParaPesar.id, medidas);
    setOrdemParaPesar(null);
    toast.success('Peso final registrado!');
    await carregar();
  };

  const r = dados?.resumo;

  return (
    <div className="flex flex-col gap-7 p-6 lg:px-9 lg:py-8">
      {/* Cabeçalho e período */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-serif text-[34px] font-medium leading-none text-tinta sm:text-[42px]">Material</h1>
          <div className="h-0.5 w-14 rounded-full bg-areia" />
          <p className="text-sm text-[#6f6b62]">Perdas, volume de cabelo e custo de material</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div role="radiogroup" aria-label="Período" className="flex rounded-[11px] bg-[#e3e1da] p-[3px]">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={preset === p.value}
                onClick={() => escolherPreset(p.value)}
                className={`h-[34px] rounded-lg px-3.5 text-[13px] transition-colors ${
                  preset === p.value ? 'bg-papel font-semibold text-tinta shadow-[0_1px_2px_rgba(31,30,27,0.08)]' : 'font-medium text-tinta-suave hover:text-tinta'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex h-10 items-center gap-2 rounded-[11px] border border-borda bg-papel px-3 text-[13px] text-tinta-suave">
            <Icon name="calendario" className="h-3.5 w-3.5" />
            <input type="date" aria-label="Data inicial" value={periodo.data_inicio} max={periodo.data_fim} onChange={(e) => mudarData('data_inicio', e.target.value)} className="bg-transparent tabular-nums focus:outline-none" />
            <span>–</span>
            <input type="date" aria-label="Data final" value={periodo.data_fim} min={periodo.data_inicio} onChange={(e) => mudarData('data_fim', e.target.value)} className="bg-transparent tabular-nums focus:outline-none" />
          </div>
        </div>
      </div>

      {loading && !dados ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-borda border-t-tinta" />
        </div>
      ) : dados && r ? (
        <div className={`flex flex-col gap-7 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* Aviso: OS sem peso final */}
          {r.os_sem_peso_final > 0 && (
            <div className="rounded-xl bg-ocre-fundo text-[#6e4b12]">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Icon name="alerta" />
                <span className="text-sm">
                  <strong className="font-bold">{r.os_sem_peso_final} OS finalizada{r.os_sem_peso_final > 1 ? 's' : ''} sem peso final</strong> neste período — fora do cálculo de perda.
                </span>
                <button type="button" onClick={() => setMostrarSemPeso((v) => !v)} className="ml-auto text-[13.5px] font-bold hover:underline">
                  {mostrarSemPeso ? 'Ocultar' : 'Ver OS'}
                </button>
              </div>
              {mostrarSemPeso && (
                <ul className="flex flex-col border-t border-[#e3d3b1] px-4 py-2">
                  {dados.perdas.sem_peso_final.map((os) => (
                    <li key={os.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#eadcbf] py-2 last:border-b-0">
                      <span className="w-20 text-[12.5px] font-semibold tabular-nums">{os.numero}</span>
                      <span className="min-w-0 flex-1 text-[13.5px]">{os.cliente} · {os.servico}</span>
                      <span className="text-[12.5px] tabular-nums">{os.peso_entrada} g na entrada</span>
                      <button
                        type="button"
                        onClick={() => setOrdemParaPesar({
                          id: os.id, numero: os.numero, cliente: os.cliente, servico: os.servico,
                          peso_gramas: os.peso_entrada, tamanho_cabelo_cm: os.tamanho_entrada, limpeza_mesclagem: os.limpeza_mesclagem,
                        })}
                        className="h-8 rounded-[9px] bg-tinta px-3 text-[12.5px] font-semibold text-papel hover:bg-black"
                      >
                        Informar peso
                      </button>
                    </li>
                  ))}
                  {r.os_sem_peso_final > dados.perdas.sem_peso_final.length && (
                    <li className="py-2 text-[12.5px]">Mostrando as {dados.perdas.sem_peso_final.length} mais recentes.</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Indicadores */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="flex flex-col gap-2.5 px-5 py-[18px]">
              <span className="text-[13px] font-semibold text-[#6f6b62]">Cabelo recebido</span>
              <span className="font-serif text-[40px] font-semibold leading-none tabular-nums">{formatarPeso(r.gramas_recebidas)}</span>
              <span className="text-[12.5px] tabular-nums text-[#8f8a80]">
                {r.os_recebidas} OS{r.media_gramas ? ` · média de ${r.media_gramas} g` : ''}
              </span>
            </Card>
            <Card className="flex flex-col gap-2.5 px-5 py-[18px]">
              <span className="text-[13px] font-semibold text-[#6f6b62]">Perda média real</span>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-serif text-[40px] font-semibold leading-none tabular-nums">{formatarPercentual(r.perda_media)}</span>
                {r.perda_media !== null && (
                  <span className={`inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-xs font-bold ${
                    r.perda_media > r.perda_esperada ? 'bg-terracota-fundo text-terracota' : 'bg-salvia-fundo text-salvia'
                  }`}>
                    <Icon name={r.perda_media > r.perda_esperada ? 'alerta' : 'check'} className="h-3 w-3" strokeWidth={1.8} />
                    meta {r.perda_esperada}%
                  </span>
                )}
              </div>
              <span className="text-[12.5px] tabular-nums text-[#8f8a80]">
                {r.perda_media_limpeza !== null
                  ? `Com limpeza/mesclagem: ${formatarPercentual(r.perda_media_limpeza)} (meta ${r.perda_esperada_limpeza}%)`
                  : `${r.os_pesadas} OS pesadas no período`}
              </span>
            </Card>
            <Card className="flex flex-col gap-2.5 px-5 py-[18px]">
              <span className="text-[13px] font-semibold text-[#6f6b62]">Material por 100 g</span>
              <span className="font-serif text-[40px] font-semibold leading-none tabular-nums">
                {r.material_por_100g !== null ? formatCurrency(r.material_por_100g) : '—'}
              </span>
              <span className="text-[12.5px] tabular-nums text-[#8f8a80]">{formatCurrency(r.gasto_material)} gastos em material</span>
            </Card>
            <Card className="flex flex-col gap-2.5 px-5 py-[18px]">
              <span className="text-[13px] font-semibold text-[#6f6b62]">Material no faturamento</span>
              <span className="font-serif text-[40px] font-semibold leading-none tabular-nums">{formatarPercentual(r.material_pct_faturamento)}</span>
              <span className="text-[12.5px] tabular-nums text-[#8f8a80]">de {formatCurrency(r.faturamento)} faturados</span>
            </Card>
          </div>

          {/* Perdas */}
          <Secao>Perdas</Secao>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="flex flex-col gap-3.5 px-[22px] py-5 xl:col-span-7">
              <TituloCard titulo="Perda média por semana" subtitulo="OS pesadas na finalização, sem limpeza/mesclagem" />
              {dados.perdas.semanal.length ? (
                <PerdaSemanalChart dados={dados.perdas.semanal} meta={r.perda_esperada} />
              ) : (
                <Vazio>A perda aparece aqui conforme as OS forem finalizadas com peso final.</Vazio>
              )}
            </Card>
            <Card className="flex flex-col gap-3.5 px-[22px] py-5 xl:col-span-5">
              <TituloCard titulo="Perda por serviço" subtitulo={`A linha vertical marca a meta de ${r.perda_esperada}%`} />
              {dados.perdas.por_servico.length ? (
                <BarrasPerda linhas={dados.perdas.por_servico} meta={r.perda_esperada} />
              ) : (
                <Vazio>Sem OS pesadas neste período.</Vazio>
              )}
            </Card>
            <Card className="flex flex-col gap-4 px-[22px] py-5 xl:col-span-4">
              <TituloCard titulo="Perda por estado e origem" />
              {dados.perdas.por_estado.length ? (
                <>
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#8f8a80]">Estado do cabelo</span>
                    <BarrasPerda linhas={dados.perdas.por_estado} meta={r.perda_esperada} compacto />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#8f8a80]">Origem</span>
                    <BarrasPerda linhas={dados.perdas.por_origem} meta={r.perda_esperada} compacto />
                  </div>
                </>
              ) : (
                <Vazio>Sem OS pesadas neste período.</Vazio>
              )}
            </Card>
            <Card className="flex flex-col gap-2 px-[22px] pb-2.5 pt-5 xl:col-span-8">
              <TituloCard
                titulo="OS acima do esperado"
                direita={dados.perdas.total_acima_do_esperado > 0 && (
                  <span className="text-[13px] font-semibold tabular-nums text-pedra">{dados.perdas.total_acima_do_esperado} no período</span>
                )}
              />
              {dados.perdas.acima_do_esperado.length ? (
                <div className="max-h-[360px] overflow-auto">
                  <table className="w-full min-w-[620px] border-collapse">
                    <thead className="sticky top-0 bg-papel">
                      <tr className="border-b border-borda-suave">
                        <Th>OS</Th><Th>Cliente</Th><Th>Serviço</Th><Th>Entrada → final</Th><Th direita>Perda</Th><Th direita><span className="pl-4">Esperado</span></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.perdas.acima_do_esperado.map((os) => (
                        <tr key={os.id} className="border-b border-[#f1eee8]">
                          <td className="py-3 pr-3 text-[12.5px] font-semibold tabular-nums tracking-[0.04em] text-[#6f6b62]">{os.numero}</td>
                          <td className="py-3 pr-3 text-[13.5px] font-semibold">{os.cliente}</td>
                          <td className="py-3 pr-3 text-[13px] text-tinta-suave">
                            {os.servico}
                            {os.limpeza_mesclagem && <span className="block text-[11.5px] text-[#8f8a80]">com limpeza/mesclagem</span>}
                          </td>
                          <td className="py-3 pr-3 text-[13px] tabular-nums text-tinta-suave">{os.peso_entrada} g → {os.peso_final} g</td>
                          <td className="py-3 text-right">
                            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-terracota-fundo px-2 text-[12.5px] font-bold tabular-nums text-terracota">
                              <Icon name="alerta" className="h-3 w-3" strokeWidth={1.8} />
                              {formatarPercentual(os.perda)}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-right text-[13px] tabular-nums text-[#8f8a80]">{os.esperado}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Vazio>Nenhuma OS passou da perda esperada neste período.</Vazio>
              )}
            </Card>
          </div>

          {/* Volume */}
          <Secao>Volume</Secao>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="flex flex-col gap-3.5 px-[22px] py-5 xl:col-span-5">
              <TituloCard titulo="Cabelo recebido por semana" subtitulo="Em kg, pelo peso de entrada das OS" />
              {dados.volume.semanal.length ? (
                <>
                  <ColunasVolume dados={dados.volume.semanal} />
                  <span className="text-xs text-[#8f8a80]">A coluna mais clara é a semana em andamento.</span>
                </>
              ) : (
                <Vazio>Nenhuma OS recebida neste período.</Vazio>
              )}
            </Card>
            <Card className="flex flex-col gap-2 px-[22px] pb-2.5 pt-5 xl:col-span-7">
              <TituloCard titulo="Por serviço" />
              {dados.volume.por_servico.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse">
                    <thead>
                      <tr className="border-b border-borda-suave">
                        <Th>Serviço</Th><Th direita>OS</Th><Th direita>Cabelo</Th><Th direita>Valor das OS</Th><Th direita>R$ / 100 g</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.volume.por_servico.map((linha) => (
                        <tr key={linha.nome} className="border-b border-[#f1eee8]">
                          <td className="py-2.5 pr-3 text-[13.5px] font-semibold">{linha.nome}</td>
                          <td className="py-2.5 text-right text-[13px] tabular-nums text-tinta-suave">{linha.os}</td>
                          <td className="py-2.5 text-right text-[13px] tabular-nums text-tinta-suave">{formatarPeso(linha.gramas)}</td>
                          <td className="py-2.5 text-right text-[13px] tabular-nums text-tinta-suave">{formatCurrency(linha.valor)}</td>
                          <td className="py-2.5 text-right text-[13.5px] font-bold tabular-nums">
                            {linha.valor_por_100g !== null ? formatCurrency(linha.valor_por_100g) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Vazio>Nenhuma OS recebida neste período.</Vazio>
              )}
            </Card>
            {dados.volume.top_clientes.length > 0 && (
              <Card className="flex flex-col gap-3.5 px-[22px] py-5 xl:col-span-12">
                <TituloCard titulo="Clientes que mais mandam cabelo" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {dados.volume.top_clientes.map((cliente, i) => (
                    <div key={cliente.nome} className="flex flex-col gap-2 rounded-xl bg-[#f3f1ec] px-4 py-3.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-tinta text-[11.5px] font-bold text-papel">{i + 1}</span>
                        <span className="truncate text-[13.5px] font-semibold">{cliente.nome}</span>
                      </span>
                      <span className="font-serif text-[26px] font-semibold leading-none tabular-nums">{formatarPeso(cliente.gramas)}</span>
                      <span className="text-xs tabular-nums text-[#8f8a80]">{cliente.os} OS · {formatCurrency(cliente.valor)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Custo */}
          <Secao>Custo de material</Secao>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="flex flex-col gap-3.5 px-[22px] py-5 xl:col-span-7">
              <TituloCard
                titulo="Gasto por tipo de material"
                direita={<span className="text-[13px] tabular-nums text-[#6f6b62]">Total <strong className="text-tinta">{formatCurrency(r.gasto_material)}</strong></span>}
              />
              {dados.custo.por_tipo.length ? (
                <div className="flex flex-col gap-3">
                  {dados.custo.por_tipo.map((tipo) => {
                    const maior = dados.custo.por_tipo[0].valor || 1;
                    return (
                      <div key={tipo.tipo} className="grid grid-cols-[120px_minmax(0,1fr)_140px] items-center gap-3" title={`${tipo.nome}: ${formatCurrency(tipo.valor)}`}>
                        <span className="text-[13px] text-tinta-suave">{tipo.nome}</span>
                        <div className="h-3.5">
                          <div className="h-3.5 rounded-r" style={{ width: `${(tipo.valor / maior) * 100}%`, background: '#a6742a' }} />
                        </div>
                        <span className="text-right text-[13px] tabular-nums">
                          <strong>{formatCurrency(tipo.valor)}</strong> <span className="text-[#8f8a80]">· {formatarPercentual(tipo.percentual)}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Vazio>Nenhuma saída de material neste período.</Vazio>
              )}
              {dados.custo.saidas_outro.quantidade > 0 && (
                <div className="flex items-center gap-2.5 rounded-[10px] bg-[#f3f1ec] px-3.5 py-2.5 text-[13px] text-tinta-suave">
                  <span className="text-areia-escuro"><Icon name="info" /></span>
                  <span>
                    {dados.custo.saidas_outro.quantidade} saída{dados.custo.saidas_outro.quantidade > 1 ? 's' : ''} deste período {dados.custo.saidas_outro.quantidade > 1 ? 'estão' : 'está'} em <strong>“Outro”</strong> ({formatCurrency(dados.custo.saidas_outro.valor)}) — se forem material, reclassifique para o custo ficar certo.
                  </span>
                </div>
              )}
            </Card>
            <Card className="flex flex-col gap-4 px-[22px] py-5 xl:col-span-5">
              <TituloCard titulo="Cabelo nosso" subtitulo="OS em que a Barra forneceu o cabelo" />
              {dados.custo.cabelo_proprio.os > 0 || dados.custo.cabelo_proprio.os_pesadas > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Custo do cabelo', formatCurrency(dados.custo.cabelo_proprio.custo)],
                    ['Cabelo processado', formatarPeso(dados.custo.cabelo_proprio.gramas)],
                    ['Perda média', formatarPercentual(dados.custo.cabelo_proprio.perda_media)],
                  ].map(([rotulo, valor]) => (
                    <div key={rotulo} className="flex flex-col gap-1.5 rounded-xl bg-[#f3f1ec] px-4 py-3.5">
                      <span className="text-[12.5px] text-[#6f6b62]">{rotulo}</span>
                      <span className="font-serif text-[28px] font-semibold leading-none tabular-nums">{valor}</span>
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5 rounded-xl bg-tinta px-4 py-3.5 text-papel">
                    <span className="text-[12.5px] text-[#cfcac0]">Prejuízo estimado</span>
                    <span className="font-serif text-[28px] font-semibold leading-none tabular-nums">{formatCurrency(dados.custo.cabelo_proprio.prejuizo_estimado)}</span>
                  </div>
                </div>
              ) : (
                <Vazio>Nenhuma OS com cabelo nosso neste período.</Vazio>
              )}
              <span className="text-xs text-[#8f8a80]">Prejuízo = custo do cabelo × perda real de cada OS finalizada.</span>
            </Card>
          </div>
        </div>
      ) : null}

      <FinalizarOSModal ordem={ordemParaPesar} modo="informar" onConfirm={salvarPeso} onClose={() => setOrdemParaPesar(null)} />
    </div>
  );
};
