import { useState, useEffect } from 'react';
import { clienteService } from '../services/api';
import { CreateClienteModal } from '../components/dashboard/CreateClienteModal';
import toast from 'react-hot-toast';

interface Cliente {
  id: number;
  nome: string;
  cnpj_cpf: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  data_cadastro: string;
}

export const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleClienteCreated = (clienteNome: string) => {
    toast.success(`Cliente "${clienteNome}" criado com sucesso!`);
    loadClientes();
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cnpj_cpf.includes(searchTerm) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando clientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie seus clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
        >
          <span>+</span>
          <span>Adicionar Cliente</span>
        </button>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ/CPF ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabela de clientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredClientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'Nenhum cliente encontrado com os filtros aplicados.' : 'Nenhum cliente cadastrado ainda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{cliente.cnpj_cpf}</div>
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
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cliente.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informação de total */}
      {filteredClientes.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total de clientes: {filteredClientes.length}
          {searchTerm && ` (filtrados de ${clientes.length})`}
        </div>
      )}

      <CreateClienteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleClienteCreated}
      />
    </div>
  );
};

