import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BillingChart } from '../components/billing/BillingChart';
import { BillingMetrics } from '../components/billing/BillingMetrics';
import { Loading } from '../components/common/Loading';
import { billingService, clienteService, saidaCaixaService } from '../services/api';
import type { BillingData, SaidaCaixa } from '../types';

const CATEGORIAS = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'material', label: 'Material' },
  { value: 'salario', label: 'Salário' },
  { value: 'energia', label: 'Energia/Água' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'outro', label: 'Outro' },
];

const emptyForm = {
  descricao: '',
  valor: '',
  categoria: 'outro',
  data: new Date().toISOString().split('T')[0],
  observacoes: '',
};

export const Billing = () => {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Array<{ id: number; nome: string }>>([]);
  const [filters, setFilters] = useState({
    data_inicio: '',
    data_fim: '',
    cliente: '',
  });

  const [saidas, setSaidas] = useState<SaidaCaixa[]>([]);
  const [loadingSaidas, setLoadingSaidas] = useState(false);
  const [showSaidaForm, setShowSaidaForm] = useState(false);
  const [formSaida, setFormSaida] = useState(emptyForm);
  const [savingSaida, setSavingSaida] = useState(false);

  useEffect(() => {
    loadBillingData();
    loadClientes();
    loadSaidas();
  }, []);

  const loadClientes = async () => {
    try {
      const result = await clienteService.getAll({ ativo: true });
      setClientes(result);
    } catch {
      setClientes([]);
    }
  };

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const billingData = await billingService.getBillingData(filters);
      setData(billingData);
    } catch (error: any) {
      toast.error('Erro ao carregar dados de faturamento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSaidas = async () => {
    try {
      setLoadingSaidas(true);
      const result = await saidaCaixaService.getAll();
      setSaidas(result);
    } catch {
      toast.error('Erro ao carregar saídas de caixa');
    } finally {
      setLoadingSaidas(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadBillingData();
  };

  const handleSaidaChange = (field: string, value: string) => {
    setFormSaida((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSaida = async () => {
    if (!formSaida.descricao || !formSaida.valor || !formSaida.data) {
      toast.error('Preencha descrição, valor e data.');
      return;
    }
    const valor = parseFloat(formSaida.valor);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor inválido.');
      return;
    }
    try {
      setSavingSaida(true);
      await saidaCaixaService.create({
        descricao: formSaida.descricao,
        valor,
        categoria: formSaida.categoria,
        data: formSaida.data,
        observacoes: formSaida.observacoes,
      });
      toast.success('Saída registrada com sucesso!');
      setFormSaida(emptyForm);
      setShowSaidaForm(false);
      loadSaidas();
      loadBillingData(); // Recarrega métricas
    } catch {
      toast.error('Erro ao registrar saída.');
    } finally {
      setSavingSaida(false);
    }
  };

  const handleDeleteSaida = async (saida: SaidaCaixa) => {
    if (!window.confirm(`Excluir a saída "${saida.descricao}"?`)) return;
    try {
      await saidaCaixaService.delete(saida.id);
      toast.success('Saída excluída.');
      setSaidas((prev) => prev.filter((s) => s.id !== saida.id));
      loadBillingData();
    } catch {
      toast.error('Erro ao excluir saída.');
    }
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return <Loading />;
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Nenhum dado disponível</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Faturamento</h1>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
              <input
                type="date"
                value={filters.data_inicio}
                onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
              <input
                type="date"
                value={filters.data_fim}
                onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <select
                value={filters.cliente}
                onChange={(e) => handleFilterChange('cliente', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">Todos os clientes</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.nome}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <BillingMetrics data={data} />
      <BillingChart data={data} />

      {/* Seção de Saídas de Caixa */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Saídas de Caixa</h2>
          <button
            onClick={() => setShowSaidaForm((v) => !v)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            {showSaidaForm ? 'Cancelar' : '+ Nova Saída'}
          </button>
        </div>

        {showSaidaForm && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Registrar Saída</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formSaida.descricao}
                  onChange={(e) => handleSaidaChange('descricao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: Aluguel do mês"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formSaida.valor}
                  onChange={(e) => handleSaidaChange('valor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formSaida.categoria}
                  onChange={(e) => handleSaidaChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  value={formSaida.data}
                  onChange={(e) => handleSaidaChange('data', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <input
                  type="text"
                  value={formSaida.observacoes}
                  onChange={(e) => handleSaidaChange('observacoes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveSaida}
                disabled={savingSaida}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {savingSaida ? 'Salvando...' : 'Salvar Saída'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingSaidas ? (
            <div className="p-8 text-center text-gray-500">Carregando saídas...</div>
          ) : saidas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhuma saída registrada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {saidas.map((saida) => (
                    <tr key={saida.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(saida.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {saida.descricao}
                        {saida.observacoes && (
                          <p className="text-xs text-gray-400 mt-0.5">{saida.observacoes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                          {CATEGORIAS.find((c) => c.value === saida.categoria)?.label ?? saida.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600 whitespace-nowrap">
                        {formatCurrency(Number(saida.valor))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteSaida(saida)}
                          className="text-red-500 hover:text-red-700 font-medium transition-colors"
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
    </div>
  );
};
