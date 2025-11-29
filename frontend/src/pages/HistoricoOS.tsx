import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordemServicoService } from '../services/api';
import type { OrdemServico } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

export const HistoricoOS = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    faturada: '',
    data_inicio: '',
    data_fim: '',
  });

  useEffect(() => {
    loadOrdens();
  }, []);

  const loadOrdens = async () => {
    try {
      setLoading(true);
      const params: any = { historico: 'true' };

      if (filters.status) params.status = filters.status;
      if (filters.faturada !== '') params.faturada = filters.faturada;
      if (filters.data_inicio) params.data_inicio = filters.data_inicio;
      if (filters.data_fim) params.data_fim = filters.data_fim;

      const data = await ordemServicoService.getAll(Object.keys(params).length > 0 ? params : undefined);
      setOrdens(data);
    } catch (error: any) {
      toast.error('Erro ao carregar histórico de ordens de serviço');
      console.error(error);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadOrdens();
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.faturada !== '') params.append('faturada', filters.faturada);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);

      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/ordens-servico/exportar-excel/?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar Excel');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ordens_servico_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Excel exportado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar Excel');
      console.error(error);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      em_desenvolvimento: 'Em Desenvolvimento',
      finalizada: 'Finalizada',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      em_desenvolvimento: 'bg-blue-100 text-blue-800',
      finalizada: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando histórico...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Histórico de Ordens de Serviço</h1>
          <p className="text-gray-600 mt-1">Visualize e exporte todo o histórico de OS</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
        >
          <span>📊</span>
          <span>Exportar Excel</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_desenvolvimento">Em Desenvolvimento</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faturada
            </label>
            <select
              value={filters.faturada}
              onChange={(e) => handleFilterChange('faturada', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Todas</option>
              <option value="true">Faturadas</option>
              <option value="false">Não Faturadas</option>
            </select>
          </div>
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
          <div className="flex items-end pb-0">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔍 Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faturada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Criação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Finalização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordens.map((ordem) => (
                <tr key={ordem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{ordem.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ordem.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ordem.status)}`}>
                      {getStatusLabel(ordem.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ordem.faturada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ordem.faturada ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {ordem.descricao || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ordem.data_criacao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ordem.data_finalizacao ? formatDate(ordem.data_finalizacao) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                    {formatCurrency(ordem.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ordens.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma ordem de serviço encontrada com os filtros aplicados
            </div>
          )}
        </div>
      </div>

      {/* Informação de total */}
      {ordens.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total de ordens: {ordens.length}
        </div>
      )}
    </div>
  );
};

