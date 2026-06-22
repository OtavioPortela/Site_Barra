import { useState, useEffect, useCallback } from 'react';
import { saidaCaixaService, ordemServicoService } from '../services/api';
import toast from 'react-hot-toast';
import type { SaidaCaixa, OrdemServico } from '../types';

const CATEGORIAS = [
  { value: 'outro', label: 'Outro' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'material', label: 'Material' },
  { value: 'salario', label: 'Salário' },
  { value: 'energia', label: 'Energia/Água' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'marketing', label: 'Marketing' },
];

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
};

const emptyForm = {
  tipo: 'saida' as 'saida' | 'entrada',
  descricao: '',
  valor: '',
  categoria: 'outro',
  data: new Date().toISOString().split('T')[0],
  observacoes: '',
};

const today = () => new Date().toISOString().split('T')[0];

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateBR = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');

export const Caixa = () => {
  const [lancamentos, setLancamentos] = useState<SaidaCaixa[]>([]);
  const [osFaturadas, setOsFaturadas] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dataInicio, setDataInicio] = useState(today());
  const [dataFim, setDataFim] = useState(today());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [lancamentosData, osData] = await Promise.all([
        saidaCaixaService.getAll({ data_inicio: dataInicio, data_fim: dataFim }),
        ordemServicoService.getAll({
          faturada: 'true',
          data_faturamento_inicio: dataInicio,
          data_faturamento_fim: dataFim,
        }),
      ]);
      setLancamentos(lancamentosData);
      setOsFaturadas(osData);
    } catch {
      toast.error('Erro ao carregar dados do caixa');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.valor || !form.data) {
      toast.error('Preencha descrição, valor e data.');
      return;
    }
    const valor = parseFloat(form.valor);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor deve ser maior que zero.');
      return;
    }
    try {
      setSaving(true);
      await saidaCaixaService.create({
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        valor,
        categoria: form.categoria,
        data: form.data,
        observacoes: form.observacoes.trim(),
      });
      toast.success(`${form.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      setForm(emptyForm);
      setShowForm(false);
      loadData();
    } catch {
      toast.error('Erro ao registrar lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: SaidaCaixa) => {
    if (!window.confirm(`Excluir "${item.descricao}"?`)) return;
    try {
      await saidaCaixaService.delete(item.id);
      toast.success('Lançamento excluído.');
      setLancamentos((prev) => prev.filter((l) => l.id !== item.id));
    } catch {
      toast.error('Erro ao excluir lançamento.');
    }
  };

  // Totais OS faturadas por forma de pagamento
  const totaisPorForma = osFaturadas.reduce<Record<string, number>>((acc, os) => {
    const forma = os.forma_pagamento || 'sem_forma';
    // Para pagamento dividido, somar cada parte
    if (os.forma_pagamento_2 && os.valor_pagamento_1 != null && os.valor_pagamento_2 != null) {
      acc[forma] = (acc[forma] || 0) + Number(os.valor_pagamento_1);
      const forma2 = os.forma_pagamento_2;
      acc[forma2] = (acc[forma2] || 0) + Number(os.valor_pagamento_2);
    } else {
      acc[forma] = (acc[forma] || 0) + Number(os.valor);
    }
    return acc;
  }, {});

  const totalTroco = osFaturadas.reduce((s, os) => s + (os.troco ? Number(os.troco) : 0), 0);
  const totalOS = osFaturadas.reduce((s, os) => s + Number(os.valor), 0);

  const totalEntradas = lancamentos.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0);
  const totalSaidas = lancamentos.filter((l) => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0);

  // Saldo: OS faturadas + entradas manuais - saídas manuais - troco devolvido
  const saldoFinal = totalOS + totalEntradas - totalSaidas - totalTroco;

  const isPeriodoUmDia = dataInicio === dataFim;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caixa</h1>
          <p className="text-sm text-gray-500 mt-1">Fechamento e controle de entradas e saídas</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          {showForm ? 'Cancelar' : '+ Novo Lançamento'}
        </button>
      </div>

      {/* Filtro de data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => { setDataInicio(today()); setDataFim(today()); }}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Hoje
          </button>
        </div>
        {!loading && (
          <p className="text-xs text-gray-400 mt-2">
            {isPeriodoUmDia
              ? `Exibindo: ${formatDateBR(dataInicio)}`
              : `Exibindo: ${formatDateBR(dataInicio)} até ${formatDateBR(dataFim)}`}
            {' · '}{osFaturadas.length} OS faturada{osFaturadas.length !== 1 ? 's' : ''} · {lancamentos.length} lançamento{lancamentos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">OS Faturadas</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(totalOS)}</p>
          <p className="text-xs text-gray-400 mt-1">{osFaturadas.length} ordem{osFaturadas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Entradas manuais</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Saídas manuais</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
        </div>
        <div className={`rounded-lg shadow-sm border p-4 ${saldoFinal >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Saldo</p>
          <p className={`text-xl font-bold ${saldoFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(saldoFinal)}
          </p>
          {totalTroco > 0 && (
            <p className="text-xs text-gray-400 mt-1">Troco: −{formatCurrency(totalTroco)}</p>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Novo Lançamento</h2>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleChange('tipo', 'saida')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm border transition-colors ${
                form.tipo === 'saida'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
              }`}
            >
              Saída (despesa)
            </button>
            <button
              type="button"
              onClick={() => handleChange('tipo', 'entrada')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm border transition-colors ${
                form.tipo === 'entrada'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
            >
              Entrada (recebimento)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Pagamento de fornecedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => handleChange('data', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <input
                type="text"
                value={form.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                form.tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {saving ? 'Salvando...' : `Salvar ${form.tipo === 'entrada' ? 'Entrada' : 'Saída'}`}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
      ) : (
        <>
          {/* OS Faturadas no período */}
          {osFaturadas.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">OS Faturadas no Período</h2>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(totaisPorForma).map(([forma, total]) => (
                    <span key={forma} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                      {FORMA_LABELS[forma] ?? forma}: {formatCurrency(total)}
                    </span>
                  ))}
                  {totalTroco > 0 && (
                    <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full font-medium">
                      Troco devolvido: −{formatCurrency(totalTroco)}
                    </span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Troco</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {osFaturadas.map((os) => (
                      <tr key={os.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{os.numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{os.cliente}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {os.forma_pagamento_2 && os.valor_pagamento_1 != null && os.valor_pagamento_2 != null ? (
                            <span>
                              {FORMA_LABELS[os.forma_pagamento!] ?? os.forma_pagamento} {formatCurrency(Number(os.valor_pagamento_1))}
                              {' + '}
                              {FORMA_LABELS[os.forma_pagamento_2] ?? os.forma_pagamento_2} {formatCurrency(Number(os.valor_pagamento_2))}
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              os.forma_pagamento === 'dinheiro' ? 'bg-green-100 text-green-700' :
                              os.forma_pagamento === 'pix' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {FORMA_LABELS[os.forma_pagamento!] ?? os.forma_pagamento ?? 'Conta parceiro'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                          {formatCurrency(Number(os.valor))}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {os.troco != null && os.troco > 0 ? (
                            <span className="text-orange-600 font-medium">−{formatCurrency(Number(os.troco))}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {osFaturadas.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-400 text-sm mb-6">
              Nenhuma OS faturada no período selecionado.
            </div>
          )}

          {/* Lançamentos manuais */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">Lançamentos Manuais</h2>
            </div>
            {lancamentos.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Nenhum lançamento no período.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lancamentos.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {item.tipo === 'entrada' ? '+ Entrada' : '− Saída'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDateBR(item.data)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.descricao}
                          {item.observacoes && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.observacoes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                            {CATEGORIAS.find((c) => c.value === item.categoria)?.label ?? item.categoria}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${
                          item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.tipo === 'entrada' ? '+' : '−'} {formatCurrency(Number(item.valor))}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-gray-400 hover:text-red-600 transition-colors text-xs"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
