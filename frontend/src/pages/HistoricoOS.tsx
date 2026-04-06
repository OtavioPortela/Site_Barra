import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordemServicoService } from '../services/api';
import type { OrdemServico } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

export const HistoricoOS = () => {
  const { isAdmin } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    status: '',
    faturada: '',
    data_inicio: '',
    data_fim: '',
    cliente_nome: '',
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
      if (filters.cliente_nome) params.search = filters.cliente_nome;

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
    setCurrentPage(1); // Resetar para primeira página ao aplicar filtros
    loadOrdens();
  };

  // Calcular paginação
  const totalPages = Math.ceil(ordens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const ordensPaginadas = ordens.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll para o topo da lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.faturada !== '') params.append('faturada', filters.faturada);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      if (filters.cliente_nome) params.append('search', filters.cliente_nome);

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

  const handleDelete = async (ordem: OrdemServico) => {
    if (!window.confirm(`Excluir OS #${ordem.numero} (${ordem.cliente})? Esta ação não pode ser desfeita.`)) return;
    try {
      await ordemServicoService.delete(ordem.id);
      toast.success(`OS #${ordem.numero} excluída com sucesso`);
      setOrdens(prev => prev.filter(o => o.id !== ordem.id));
    } catch (error: any) {
      toast.error('Erro ao excluir ordem de serviço');
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
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando histórico...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Histórico de Ordens de Serviço</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Visualize e exporte todo o histórico de OS</p>
          </div>
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <span>📊</span>
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={filters.cliente_nome}
              onChange={(e) => handleFilterChange('cliente_nome', e.target.value)}
              placeholder="Buscar por nome"
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Todos</option>
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
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
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
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end pb-0 sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              🔍 Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Cards para Mobile / Tabela para Desktop */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cards para Mobile */}
        <div className="md:hidden divide-y divide-gray-200">
          {ordens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma ordem de serviço encontrada com os filtros aplicados
            </div>
          ) : (
            ordensPaginadas.map((ordem) => (
              <div key={ordem.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">#{ordem.numero}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ordem.cliente}</p>
                  </div>
                  <div className="ml-2">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ordem.status)}`}>
                      {getStatusLabel(ordem.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 mb-2">
                  <span className="text-xl font-bold text-primary-600">{formatCurrency(ordem.valor)}</span>
                  <span className="text-xs text-gray-500">{formatDate(ordem.data_criacao)}</span>
                </div>

                {isAdmin() && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleDelete(ordem)}
                      className="w-full py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Excluir OS
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Faturada:</span>
                    <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                      ordem.faturada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ordem.faturada ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Entregue:</span>
                    <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                      ordem.entregue ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ordem.entregue ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  {ordem.forma_pagamento && (
                    <div className="col-span-2 flex items-center space-x-1 mt-1">
                      <span className="text-xs text-gray-500">Pagamento:</span>
                      <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {ordem.forma_pagamento === 'dinheiro' ? 'Dinheiro' :
                         ordem.forma_pagamento === 'pix' ? 'PIX' :
                         ordem.forma_pagamento === 'cartao_credito' ? 'Cartão de Crédito' :
                         ordem.forma_pagamento === 'cartao_debito' ? 'Cartão de Débito' : '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tabela para Desktop */}
        <div className="hidden md:block overflow-x-auto">
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
                  Entregue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma de Pagamento
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
                {isAdmin() && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordensPaginadas.map((ordem) => (
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
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ordem.faturada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ordem.faturada ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ordem.entregue ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ordem.entregue ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {ordem.forma_pagamento === 'dinheiro' ? 'Dinheiro' :
                       ordem.forma_pagamento === 'pix' ? 'PIX' :
                       ordem.forma_pagamento === 'cartao_credito' ? 'Cartão de Crédito' :
                       ordem.forma_pagamento === 'cartao_debito' ? 'Cartão de Débito' : '-'}
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
                  {isAdmin() && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(ordem)}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  )}
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

      {/* Informação de total e paginação */}
      {ordens.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Mostrando <span className="font-semibold">{startIndex + 1}</span> a <span className="font-semibold">{Math.min(endIndex, ordens.length)}</span> de <span className="font-semibold">{ordens.length}</span> ordens
          </div>

          {/* Controles de paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>

                {/* Números de página */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar apenas algumas páginas ao redor da atual
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima →
                </button>
              </div>

              <div className="text-xs text-gray-500">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

