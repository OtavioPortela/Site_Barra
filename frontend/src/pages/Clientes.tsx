import { useState, useEffect } from 'react';
import { clienteService } from '../services/api';
import { CreateClienteModal } from '../components/dashboard/CreateClienteModal';
import toast from 'react-hot-toast';
import type { Cliente } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const Clientes = () => {
  const { isPatrao } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAll({ ativo: true });
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar lista de clientes');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClienteCreated = () => {
    loadClientes();
  };

  const handleExportarConta = async (cliente: Cliente) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/ordens-servico/exportar-excel/?cliente_id=${cliente.id}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `conta_${cliente.nome.replace(/\s+/g, '_')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      toast.success(`Conta de ${cliente.nome} exportada!`);
    } catch {
      toast.error('Erro ao exportar conta do cliente');
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    if (!window.confirm(`Excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await clienteService.delete(cliente.id);
      toast.success(`Cliente "${cliente.nome}" excluído.`);
      setClientes(prev => prev.filter(c => c.id !== cliente.id));
    } catch {
      toast.error('Erro ao excluir cliente');
    }
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.cnpj_cpf && cliente.cnpj_cpf.includes(searchTerm)) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calcular paginação
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const clientesPaginados = filteredClientes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetar página quando busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando clientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Clientes</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie seus clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <span>+</span>
          <span>Adicionar Cliente</span>
        </button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ/CPF ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Cards para Mobile / Tabela para Desktop */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredClientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'Nenhum cliente encontrado com os filtros aplicados.' : 'Nenhum cliente cadastrado ainda.'}
          </div>
        ) : (
          <>
            {/* Cards para Mobile */}
            <div className="md:hidden divide-y divide-gray-200">
              {clientesPaginados.map((cliente) => (
                <div key={cliente.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{cliente.nome}</h3>
                      <p className="text-sm text-gray-500 mt-1">{cliente.cnpj_cpf || '-'}</p>
                    </div>
                    <span
                      className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cliente.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setClienteToEdit(cliente)} className="flex-1 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                      Editar
                    </button>
                    {isPatrao() && (
                      <button onClick={() => handleExportarConta(cliente)} className="flex-1 py-1.5 text-sm font-medium text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors">
                        Exportar
                      </button>
                    )}
                    <button onClick={() => handleDelete(cliente)} className="flex-1 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                      Excluir
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {cliente.email && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Email:</span>
                        <span className="text-xs text-gray-900">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.telefone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Telefone:</span>
                        <span className="text-xs text-gray-900">{cliente.telefone}</span>
                      </div>
                    )}
                    {cliente.eh_parceiro && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">É Parceiro:</span>
                        <span className="text-xs font-semibold text-blue-600">Sim</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Cadastro:</span>
                      <span className="text-xs text-gray-900">{formatDate(cliente.data_cadastro)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabela para Desktop */}
            <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CNPJ/CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      É Parceiro
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {clientesPaginados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{cliente.cnpj_cpf || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{cliente.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{cliente.telefone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(cliente.data_cadastro)}</div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cliente.eh_parceiro ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Sim
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cliente.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button onClick={() => setClienteToEdit(cliente)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        Editar
                      </button>
                      {isPatrao() && (
                        <button onClick={() => handleExportarConta(cliente)} className="text-green-600 hover:text-green-800 font-medium transition-colors">
                          Exportar
                        </button>
                      )}
                      <button onClick={() => handleDelete(cliente)} className="text-red-600 hover:text-red-800 font-medium transition-colors">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Informação de total e paginação */}
      {filteredClientes.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Mostrando <span className="font-semibold">{startIndex + 1}</span> a <span className="font-semibold">{Math.min(endIndex, filteredClientes.length)}</span> de <span className="font-semibold">{filteredClientes.length}</span> clientes
            {searchTerm && <span> (filtrados de {clientes.length})</span>}
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

      <CreateClienteModal
        isOpen={showCreateModal || !!clienteToEdit}
        onClose={() => { setShowCreateModal(false); setClienteToEdit(null); }}
        onSuccess={handleClienteCreated}
        clienteToEdit={clienteToEdit}
      />
    </div>
  );
};

