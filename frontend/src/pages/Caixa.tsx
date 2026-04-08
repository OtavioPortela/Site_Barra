import { useState, useEffect } from 'react';
import { saidaCaixaService } from '../services/api';
import toast from 'react-hot-toast';
import type { SaidaCaixa } from '../types';

const CATEGORIAS = [
  { value: 'outro', label: 'Outro' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'material', label: 'Material' },
  { value: 'salario', label: 'Salário' },
  { value: 'energia', label: 'Energia/Água' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'marketing', label: 'Marketing' },
];

const emptyForm = {
  tipo: 'saida' as 'saida' | 'entrada',
  descricao: '',
  valor: '',
  categoria: 'outro',
  data: new Date().toISOString().split('T')[0],
  observacoes: '',
};

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const Caixa = () => {
  const [lancamentos, setLancamentos] = useState<SaidaCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLancamentos();
  }, []);

  const loadLancamentos = async () => {
    try {
      setLoading(true);
      const data = await saidaCaixaService.getAll();
      setLancamentos(data);
    } catch {
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  };

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
      loadLancamentos();
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

  const totalEntradas = lancamentos.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0);
  const totalSaidas = lancamentos.filter((l) => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caixa</h1>
          <p className="text-sm text-gray-500 mt-1">Registre entradas e saídas de dinheiro</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          {showForm ? 'Cancelar' : '+ Novo Lançamento'}
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">+</div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Entradas</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalEntradas)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-lg">−</div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Saídas</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Novo Lançamento</h2>

          {/* Toggle Tipo */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <input
                type="text"
                value={form.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Lista de lançamentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Meus lançamentos</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : lancamentos.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum lançamento registrado ainda.</div>
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.tipo === 'entrada'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.tipo === 'entrada' ? '+ Entrada' : '− Saída'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
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
    </div>
  );
};
