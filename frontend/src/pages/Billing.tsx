import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BillingChart } from '../components/billing/BillingChart';
import { BillingMetrics } from '../components/billing/BillingMetrics';
import { Loading } from '../components/common/Loading';
import { billingService, clienteService } from '../services/api';
import type { BillingData } from '../types';

export const Billing = () => {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Array<{ id: number; nome: string }>>([]);
  const [filters, setFilters] = useState({
    data_inicio: '',
    data_fim: '',
    cliente: '',
  });

  useEffect(() => {
    loadBillingData();
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const data = await clienteService.getAll({ ativo: true });
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
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

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadBillingData();
  };


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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.data_inicio}
                onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.data_fim}
                onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={filters.cliente}
                onChange={(e) => handleFilterChange('cliente', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Todos os clientes</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.nome}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-0">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                🔍 Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <BillingMetrics data={data} />
      <BillingChart data={data} />
    </div>
  );
};

