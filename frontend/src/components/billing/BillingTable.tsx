import type { BillingData } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface BillingTableProps {
  data: BillingData;
  onDevolver?: (id: number) => void;
  onExcluir?: (id: number) => void;
}

export const BillingTable = ({ data, onDevolver, onExcluir }: BillingTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Ordens de Serviço Finalizadas</h3>
      </div>
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
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Finalização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.ordens_finalizadas.map((ordem) => (
              <tr key={ordem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{ordem.numero}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ordem.cliente}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {ordem.descricao}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ordem.data_finalizacao ? formatDate(ordem.data_finalizacao) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                  {formatCurrency(ordem.valor)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {onDevolver && (
                      <button
                        onClick={() => onDevolver(ordem.id)}
                        className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors font-medium"
                        title="Devolver ao dashboard"
                      >
                        ↶ Devolução
                      </button>
                    )}
                    {onExcluir && (
                      <button
                        onClick={() => onExcluir(ordem.id)}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                        title="Excluir ordem de serviço"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.ordens_finalizadas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma ordem de serviço finalizada encontrada
          </div>
        )}
      </div>
    </div>
  );
};

