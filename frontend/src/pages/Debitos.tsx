import { useState, useEffect } from 'react';
import { debitoService, clienteService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import type { Debito, Cliente } from '../types';

export const Debitos = () => {
  const { isPatrao } = useAuth();
  const [parceiroSelecionado, setParceiroSelecionado] = useState<number | null>(null);
  const [debitos, setDebitos] = useState<Debito[]>([]);
  const [clientesParceiros, setClientesParceiros] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParceiros, setLoadingParceiros] = useState(true);
  const [showMarcarPagoModal, setShowMarcarPagoModal] = useState(false);
  const [debitoSelecionado, setDebitoSelecionado] = useState<Debito | null>(null);

  useEffect(() => {
    loadClientesParceiros();
  }, []);

  useEffect(() => {
    if (parceiroSelecionado) {
      loadDebitos(parceiroSelecionado);
    } else {
      setDebitos([]);
    }
  }, [parceiroSelecionado]);

  const loadClientesParceiros = async () => {
    try {
      setLoadingParceiros(true);
      const allClientes = await clienteService.getAll({ ativo: true });
      const parceiros = allClientes.filter((c: Cliente) => c.eh_parceiro === true);
      setClientesParceiros(parceiros);
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      toast.error('Erro ao carregar lista de parceiros');
      setClientesParceiros([]);
    } finally {
      setLoadingParceiros(false);
    }
  };

  const loadDebitos = async (parceiroId: number) => {
    try {
      setLoading(true);
      const data = await debitoService.getAll(parceiroId);
      setDebitos(data);
    } catch (error) {
      console.error('Erro ao carregar débitos:', error);
      toast.error('Erro ao carregar débitos');
      setDebitos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarNota = async () => {
    if (!parceiroSelecionado) {
      toast.error('Selecione um parceiro primeiro');
      return;
    }

    try {
      const blob = await debitoService.exportarNota(parceiroSelecionado, 'excel');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const parceiro = clientesParceiros.find(c => c.id === parceiroSelecionado);
      const nomeArquivo = `nota_debitos_${parceiro?.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = nomeArquivo;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Nota exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar nota:', error);
      toast.error('Erro ao exportar nota');
    }
  };

  const handleMarcarComoPago = async (debitoId: number, formaPagamento: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito') => {
    try {
      await debitoService.marcarComoPago(debitoId, formaPagamento);
      toast.success('Débito marcado como pago!');
      if (parceiroSelecionado) {
        loadDebitos(parceiroSelecionado);
      }
      setShowMarcarPagoModal(false);
      setDebitoSelecionado(null);
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toast.error('Erro ao marcar débito como pago');
    }
  };

  const handleAbrirMarcarPago = (debito: Debito) => {
    setDebitoSelecionado(debito);
    setShowMarcarPagoModal(true);
  };

  const handleExportacaoCompleta = async () => {
    if (!parceiroSelecionado) {
      toast.error('Selecione um parceiro primeiro');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('cliente_id', parceiroSelecionado.toString());
      params.append('apenas_debitos', 'true');

      const url = `${import.meta.env.VITE_API_URL}/ordens-servico/exportar-excel/?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const parceiro = clientesParceiros.find(c => c.id === parceiroSelecionado);
      const nomeArquivo = `exportacao_completa_${parceiro?.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = nomeArquivo;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Exportação completa realizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao realizar exportação completa');
    }
  };

  const handleReverterPagamento = async (debito: Debito) => {
    if (!window.confirm(`Reverter pagamento de "${debito.numero}"?`)) return;
    try {
      await debitoService.reverterPagamento(debito.id);
      toast.success('Pagamento revertido.');
      if (parceiroSelecionado) loadDebitos(parceiroSelecionado);
    } catch {
      toast.error('Erro ao reverter pagamento');
    }
  };

  // Calcular resumo
  const totalPendente = debitos.reduce((sum, debito) => sum + (Number(debito.valor) || 0), 0);
  const quantidadeOS = debitos.length;
  const parceiroAtual = clientesParceiros.find(c => c.id === parceiroSelecionado);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestão de Débitos</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Visualize e gerencie os débitos dos parceiros</p>
      </div>

      {/* Filtro por Parceiro */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Parceiro
        </label>
        <select
          value={parceiroSelecionado || ''}
          onChange={(e) => setParceiroSelecionado(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full sm:w-auto min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loadingParceiros}
        >
          <option value="">Selecione um parceiro</option>
          {clientesParceiros.map((parceiro) => (
            <option key={parceiro.id} value={parceiro.id}>
              {parceiro.nome} {parceiro.cnpj_cpf ? `(${parceiro.cnpj_cpf})` : ''}
            </option>
          ))}
        </select>
        {clientesParceiros.length === 0 && !loadingParceiros && (
          <p className="text-sm text-gray-500 mt-2">Nenhum parceiro cadastrado</p>
        )}
      </div>

      {/* Resumo */}
      {parceiroSelecionado && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Pendente</div>
            <div className="text-2xl font-bold text-gray-800">{formatCurrency(totalPendente)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Quantidade de OS</div>
            <div className="text-2xl font-bold text-gray-800">{quantidadeOS}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Parceiro</div>
            <div className="text-lg font-semibold text-gray-800">{parceiroAtual?.nome || ''}</div>
          </div>
        </div>
      )}

      {/* Botões Exportar */}
      {parceiroSelecionado && debitos.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={handleExportarNota}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
          >
            <span>📄</span>
            <span>Exportar Nota</span>
          </button>
          <button
            onClick={handleExportacaoCompleta}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Exportação Completa</span>
          </button>
        </div>
      )}

      {/* Tabela de Débitos */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-500">Carregando débitos...</div>
        </div>
      ) : parceiroSelecionado && debitos.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-500">Nenhum débito pendente para este parceiro</div>
        </div>
      ) : parceiroSelecionado ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição/Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
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
                {debitos.map((debito) => (
                  <tr key={debito.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(debito.data_criacao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {debito.numero}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {debito.servico || debito.descricao || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(debito.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        debito.status === 'finalizada' ? 'bg-green-100 text-green-800' :
                        debito.status === 'em_desenvolvimento' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {debito.status === 'finalizada' ? 'Finalizada' :
                         debito.status === 'em_desenvolvimento' ? 'Em Desenvolvimento' :
                         'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleAbrirMarcarPago(debito)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Marcar como Pago
                      </button>
                      {isPatrao() && (
                        <button
                          onClick={() => handleReverterPagamento(debito)}
                          className="text-orange-500 hover:text-orange-700"
                        >
                          Reverter
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-500">Selecione um parceiro para visualizar os débitos</div>
        </div>
      )}

      {/* Modal Marcar como Pago */}
      {showMarcarPagoModal && debitoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Marcar como Pago</h2>
              <button
                onClick={() => {
                  setShowMarcarPagoModal(false);
                  setDebitoSelecionado(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Selecione a forma de pagamento para a OS <strong>#{debitoSelecionado.numero}</strong>
              </p>
              <div className="space-y-3">
                {['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'].map((forma) => (
                  <button
                    key={forma}
                    onClick={() => handleMarcarComoPago(
                      debitoSelecionado.id,
                      forma as 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito'
                    )}
                    className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {forma === 'dinheiro' ? 'Dinheiro' :
                     forma === 'pix' ? 'PIX' :
                     forma === 'cartao_credito' ? 'Cartão de Crédito' :
                     'Cartão de Débito'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

