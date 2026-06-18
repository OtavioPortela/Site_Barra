import { useEffect, useState } from 'react';
import { faturadosDiaService } from '../../services/api';
import type { FaturadosDia as FaturadosDiaData, FaturadosDiaItem } from '../../services/api';

const FORMA_CORES: Record<string, { bg: string; text: string }> = {
  dinheiro:       { bg: 'bg-green-100',  text: 'text-green-700' },
  pix:            { bg: 'bg-blue-100',   text: 'text-blue-700' },
  cartao_credito: { bg: 'bg-purple-100', text: 'text-purple-700' },
  cartao_debito:  { bg: 'bg-orange-100', text: 'text-orange-700' },
  parceiro:       { bg: 'bg-gray-100',   text: 'text-gray-600' },
};

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatHora = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const FormaTag = ({ forma, label }: { forma: string | null; label?: string }) => {
  const key = forma ?? 'parceiro';
  const cor = FORMA_CORES[key] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
  const texto = label ?? key;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cor.bg} ${cor.text}`}>
      {texto}
    </span>
  );
};

export const FaturadosDia = () => {
  const hoje = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(hoje);
  const [resultado, setResultado] = useState<FaturadosDiaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [formaFiltro, setFormaFiltro] = useState<string>('');

  const carregar = async (d: string) => {
    setLoading(true);
    try {
      const res = await faturadosDiaService.get(d);
      setResultado(res);
    } catch {
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(hoje); }, []);

  const handleDataChange = (d: string) => {
    setData(d);
    setFormaFiltro('');
    carregar(d);
  };

  const ordensFiltradas: FaturadosDiaItem[] = resultado
    ? (formaFiltro
        ? resultado.ordens.filter(o => {
            const k1 = o.forma_pagamento ?? 'parceiro';
            const k2 = o.forma_pagamento_2 ?? null;
            return k1 === formaFiltro || k2 === formaFiltro;
          })
        : resultado.ordens)
    : [];

  return (
    <div className="space-y-6">
      {/* Seletor de data */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input
            type="date"
            value={data}
            onChange={e => handleDataChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {resultado && (
          <div className="mt-5 text-sm text-gray-500">
            {resultado.quantidade} OS faturada{resultado.quantidade !== 1 ? 's' : ''} —{' '}
            <span className="font-semibold text-gray-800">{formatCurrency(resultado.total)}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      )}

      {!loading && resultado && resultado.quantidade === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhuma OS faturada em {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}.
        </div>
      )}

      {!loading && resultado && resultado.quantidade > 0 && (
        <>
          {/* Cards por forma de pagamento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {resultado.por_forma_pagamento.map(fp => {
              const cor = FORMA_CORES[fp.forma] ?? { bg: 'bg-gray-50', text: 'text-gray-700' };
              const ativo = formaFiltro === fp.forma;
              return (
                <button
                  key={fp.forma}
                  onClick={() => setFormaFiltro(ativo ? '' : fp.forma)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    ativo
                      ? 'border-blue-500 shadow-md'
                      : 'border-transparent hover:border-gray-200'
                  } ${cor.bg}`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${cor.text}`}>
                    {fp.label}
                  </p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(fp.total)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fp.quantidade} OS
                  </p>
                </button>
              );
            })}
          </div>

          {formaFiltro && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <span>Filtrando por:</span>
              <FormaTag
                forma={formaFiltro === 'parceiro' ? null : formaFiltro}
                label={resultado.por_forma_pagamento.find(f => f.forma === formaFiltro)?.label}
              />
              <button
                onClick={() => setFormaFiltro('')}
                className="ml-1 text-gray-400 hover:text-gray-600 font-bold"
              >
                × limpar
              </button>
            </div>
          )}

          {/* Tabela de OS */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordensFiltradas.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{o.numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{o.cliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{o.servico || '—'}</td>
                    <td className="px-4 py-3">
                      {o.forma_pagamento_2 && o.valor_pagamento_1 != null && o.valor_pagamento_2 != null ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <FormaTag forma={o.forma_pagamento}
                              label={resultado.por_forma_pagamento.find(f => f.forma === (o.forma_pagamento ?? 'parceiro'))?.label} />
                            <span className="text-xs text-gray-500">{formatCurrency(o.valor_pagamento_1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FormaTag forma={o.forma_pagamento_2}
                              label={resultado.por_forma_pagamento.find(f => f.forma === o.forma_pagamento_2)?.label} />
                            <span className="text-xs text-gray-500">{formatCurrency(o.valor_pagamento_2)}</span>
                          </div>
                        </div>
                      ) : (
                        <FormaTag
                          forma={o.forma_pagamento}
                          label={resultado.por_forma_pagamento.find(f => f.forma === (o.forma_pagamento ?? 'parceiro'))?.label}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatHora(o.data_faturamento)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right whitespace-nowrap">
                      {formatCurrency(o.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                    Total {formaFiltro ? `(${resultado.por_forma_pagamento.find(f => f.forma === formaFiltro)?.label})` : 'do dia'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                    {formatCurrency(
                      formaFiltro
                        ? ordensFiltradas.reduce((s, o) => s + o.valor, 0)
                        : resultado.total
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
