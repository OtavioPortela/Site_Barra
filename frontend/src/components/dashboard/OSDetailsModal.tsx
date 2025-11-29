import { useEffect, useState } from 'react';
import { ordemServicoService } from '../../services/api';
import type { OrdemServico } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

interface OSDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordemId: number | null;
}

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
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    em_desenvolvimento: 'bg-blue-100 text-blue-800 border-blue-300',
    finalizada: 'bg-green-100 text-green-800 border-green-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getEstadoCabeloLabel = (estado: string) => {
  const labels: Record<string, string> = {
    novo: 'Novo',
    descolorido: 'Descolorido',
    branco: 'Branco',
    preto: 'Preto',
    castanho: 'Castanho',
    rubro: 'Rubro',
    loiro: 'Loiro',
    pintado: 'Pintado',
  };
  return labels[estado] || estado;
};

const getTipoCabeloLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    liso: 'Liso',
    ondulado: 'Ondulado',
    cacheado: 'Cacheado',
    crespo: 'Crespo',
  };
  return labels[tipo] || tipo;
};

export const OSDetailsModal = ({ isOpen, onClose, ordemId }: OSDetailsModalProps) => {
  const { isPatrao } = useAuth();
  const [ordem, setOrdem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ordemId) {
      loadOrdemDetails();
    } else {
      setOrdem(null);
    }
  }, [isOpen, ordemId]);

  const loadOrdemDetails = async () => {
    if (!ordemId) return;

    try {
      setLoading(true);
      const data = await ordemServicoService.getById(ordemId);
      setOrdem(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da OS:', error);
      setOrdem(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Detalhes da Ordem de Serviço
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Carregando detalhes...</div>
            </div>
          ) : ordem ? (
            <div className="space-y-6">
              {/* Cabeçalho */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">OS #{ordem.numero}</h3>
                    <p className="text-sm text-gray-600 mt-1">Cliente: {ordem.cliente}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(ordem.status)}`}>
                    {getStatusLabel(ordem.status)}
                  </span>
                </div>
                {ordem.faturada && (
                  <div className="mt-2">
                    <span className="px-3 py-1 text-sm font-medium rounded bg-green-100 text-green-800">
                      ✓ Faturada
                    </span>
                  </div>
                )}
              </div>

              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <p className="text-sm text-gray-900">{ordem.numero}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <p className="text-sm text-gray-900">{ordem.cliente}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <p className="text-sm text-gray-900">{getStatusLabel(ordem.status)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
                    <p className="text-sm text-gray-900">{ordem.servico || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                    <p className="text-sm text-gray-900">{formatDate(ordem.data_criacao)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
                    <p className="text-sm text-gray-900">{formatDate(ordem.prazo_entrega)}</p>
                  </div>
                  {ordem.data_finalizacao && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Finalização</label>
                      <p className="text-sm text-gray-900">{formatDate(ordem.data_finalizacao)}</p>
                    </div>
                  )}
                  {ordem.data_faturamento && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Faturamento</label>
                      <p className="text-sm text-gray-900">{formatDate(ordem.data_faturamento)}</p>
                    </div>
                  )}
                </div>
                {ordem.descricao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{ordem.descricao}</p>
                  </div>
                )}
              </div>

              {/* Detalhes do Cabelo */}
              {(ordem.estado_cabelo || ordem.tipo_cabelo || ordem.cor_cabelo || ordem.peso_gramas || ordem.tamanho_cabelo_cm || ordem.cor_linha) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Detalhes do Cabelo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {ordem.estado_cabelo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado do Cabelo</label>
                        <p className="text-sm text-gray-900">{getEstadoCabeloLabel(ordem.estado_cabelo)}</p>
                      </div>
                    )}
                    {ordem.tipo_cabelo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cabelo</label>
                        <p className="text-sm text-gray-900">{getTipoCabeloLabel(ordem.tipo_cabelo)}</p>
                      </div>
                    )}
                    {ordem.cor_cabelo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Cabelo</label>
                        <p className="text-sm text-gray-900">{ordem.cor_cabelo}</p>
                      </div>
                    )}
                    {ordem.peso_gramas !== undefined && ordem.peso_gramas !== null && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Peso (gramas)</label>
                        <p className="text-sm text-gray-900">{ordem.peso_gramas} g</p>
                      </div>
                    )}
                    {ordem.tamanho_cabelo_cm !== undefined && ordem.tamanho_cabelo_cm !== null && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho (cm)</label>
                        <p className="text-sm text-gray-900">{ordem.tamanho_cabelo_cm} cm</p>
                      </div>
                    )}
                    {ordem.cor_linha && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cor da Linha</label>
                        <p className="text-sm text-gray-900">{ordem.cor_linha}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Valores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Valores</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ordem.valor_metro !== undefined && ordem.valor_metro !== null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor por Metro</label>
                      <p className="text-sm text-gray-900 font-semibold">{formatCurrency(ordem.valor_metro)}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                    <p className="text-lg text-gray-900 font-bold">{formatCurrency(ordem.valor)}</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {ordem.observacoes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Observações</h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{ordem.observacoes}</p>
                </div>
              )}

              {/* Informações Adicionais */}
              {ordem.usuario_criacao_nome && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações Adicionais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Criado por</label>
                      <p className="text-sm text-gray-900">{ordem.usuario_criacao_nome}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Erro ao carregar detalhes da OS</div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end space-x-4 pt-4 px-6 pb-6 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

