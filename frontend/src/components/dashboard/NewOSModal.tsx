import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { clienteService, ordemServicoService } from '../../services/api';
import { CreateClienteModal } from './CreateClienteModal';

// Importação do servicoService - usando type assertion para evitar erro de cache do TypeScript
import * as apiModule from '../../services/api';
const servicoService = (apiModule as any).servicoService;

interface NewOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewOSModal = ({ isOpen, onClose, onSuccess }: NewOSModalProps) => {
  const [formData, setFormData] = useState({
    cliente: '',
    descricao: '',
    valor: '',
    valor_metro: '',
    prazo_entrega: '',
    observacoes: '',
    // Campos de confecções
    estado_cabelo: 'novo',
    tipo_cabelo: 'liso',
    cor_cabelo: '',
    peso_gramas: '',
    tamanho_cabelo_cm: '',
    cor_linha: '',
    servico: '',
  });
  const [clientes, setClientes] = useState<Array<{ id: number; nome: string }>>([]);
  const [servicos, setServicos] = useState<Array<{ id: number; nome: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCreateCliente, setShowCreateCliente] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClientes();
      loadServicos();
    }
  }, [isOpen]);

  const loadClientes = async () => {
    try {
      const data = await clienteService.getAll({ ativo: true });
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]); // Garantir que sempre seja um array
    }
  };

  const loadServicos = async () => {
    try {
      const data = await servicoService.getAll({ ativo: true });
      setServicos(data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setServicos([]); // Garantir que sempre seja um array
    }
  };

  const handleClienteCreated = (clienteNome: string) => {
    // Recarregar lista de clientes
    loadClientes();
    // Preencher o campo cliente com o nome do novo cliente
    setFormData({ ...formData, cliente: clienteNome });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cliente.trim()) {
      newErrors.cliente = 'Cliente é obrigatório';
    }

    if (!formData.servico) {
      newErrors.servico = 'Serviço é obrigatório';
    }

    if (!formData.tipo_cabelo) {
      newErrors.tipo_cabelo = 'Tipo de cabelo é obrigatório';
    }

    if (!formData.cor_cabelo.trim()) {
      newErrors.cor_cabelo = 'Cor do cabelo é obrigatória';
    }

    if (!formData.peso_gramas || parseInt(formData.peso_gramas) <= 0) {
      newErrors.peso_gramas = 'Peso deve ser maior que zero';
    }

    if (!formData.tamanho_cabelo_cm || parseInt(formData.tamanho_cabelo_cm) <= 0) {
      newErrors.tamanho_cabelo_cm = 'Tamanho do cabelo deve ser maior que zero';
    }

    if (!formData.cor_linha.trim()) {
      newErrors.cor_linha = 'Cor da linha é obrigatória';
    }

    if (!formData.valor_metro || parseFloat(formData.valor_metro) <= 0) {
      newErrors.valor_metro = 'Valor por metro deve ser maior que zero';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor total deve ser maior que zero';
    }

    if (!formData.prazo_entrega) {
      newErrors.prazo_entrega = 'Prazo de entrega é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const createData: any = {
        cliente: formData.cliente,
        valor: parseFloat(formData.valor),
        valor_metro: parseFloat(formData.valor_metro),
        prazo_entrega: formData.prazo_entrega,
        status: 'pendente',
        // Campos de confecções
        estado_cabelo: formData.estado_cabelo,
        tipo_cabelo: formData.tipo_cabelo,
        cor_cabelo: formData.cor_cabelo,
        peso_gramas: parseInt(formData.peso_gramas),
        tamanho_cabelo_cm: parseInt(formData.tamanho_cabelo_cm),
        cor_linha: formData.cor_linha,
        servico: formData.servico,
      };

      if (formData.descricao) createData.descricao = formData.descricao;
      if (formData.observacoes) createData.observacoes = formData.observacoes;

      await ordemServicoService.create(createData);

      toast.success('Ordem de serviço criada com sucesso!');
      setFormData({
        cliente: '',
        descricao: '',
        valor: '',
        valor_metro: '',
        prazo_entrega: '',
        observacoes: '',
        estado_cabelo: 'novo',
        tipo_cabelo: 'liso',
        cor_cabelo: '',
        peso_gramas: '',
        tamanho_cabelo_cm: '',
        cor_linha: '',
        servico: '',
      });
      setErrors({});
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          'Erro ao criar ordem de serviço';
      toast.error(errorMessage);

      // Tratar erros de validação do backend
      if (error.response?.data) {
        const backendErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach((key) => {
          const messages = error.response.data[key];
          backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(backendErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Data mínima: hoje
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Nova Ordem de Serviço</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 flex-1">
            {/* Seção: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações Básicas</h3>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
                    Cliente *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateCliente(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Novo Cliente
                  </button>
                </div>
                <input
                  id="cliente"
                  type="text"
                  list="clientes-list"
                  value={formData.cliente}
                  onChange={(e) => {
                    setFormData({ ...formData, cliente: e.target.value });
                    setErrors({ ...errors, cliente: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome do cliente"
                />
                <datalist id="clientes-list">
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.nome} />
                  ))}
                </datalist>
                {errors.cliente && (
                  <p className="mt-1 text-sm text-red-600">{errors.cliente}</p>
                )}
              </div>

              <div>
                <label htmlFor="servico" className="block text-sm font-medium text-gray-700 mb-2">
                  Serviço *
                </label>
                <select
                  id="servico"
                  value={formData.servico}
                  onChange={(e) => {
                    setFormData({ ...formData, servico: e.target.value });
                    setErrors({ ...errors, servico: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.servico ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map((servico) => (
                    <option key={servico.id} value={servico.nome}>
                      {servico.nome}
                    </option>
                  ))}
                </select>
                {errors.servico && (
                  <p className="mt-1 text-sm text-red-600">{errors.servico}</p>
                )}
              </div>

              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => {
                    setFormData({ ...formData, descricao: e.target.value });
                    setErrors({ ...errors, descricao: '' });
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descreva a ordem de serviço (opcional)"
                />
              </div>

              <div>
                <label htmlFor="prazo_entrega" className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo de Entrega *
                </label>
                <input
                  id="prazo_entrega"
                  type="date"
                  min={today}
                  value={formData.prazo_entrega}
                  onChange={(e) => {
                    setFormData({ ...formData, prazo_entrega: e.target.value });
                    setErrors({ ...errors, prazo_entrega: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.prazo_entrega ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.prazo_entrega && (
                  <p className="mt-1 text-sm text-red-600">{errors.prazo_entrega}</p>
                )}
              </div>
            </div>

            {/* Seção: Detalhes do Cabelo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Detalhes do Cabelo</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="estado_cabelo" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado do Cabelo *
                  </label>
                  <select
                    id="estado_cabelo"
                    value={formData.estado_cabelo}
                    onChange={(e) => setFormData({ ...formData, estado_cabelo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="novo">Novo</option>
                    <option value="descolorido">Descolorido</option>
                    <option value="branco">Branco</option>
                    <option value="preto">Preto</option>
                    <option value="castanho">Castanho</option>
                    <option value="rubro">Rubro</option>
                    <option value="loiro">Loiro</option>
                    <option value="pintado">Pintado</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tipo_cabelo" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cabelo *
                  </label>
                  <select
                    id="tipo_cabelo"
                    value={formData.tipo_cabelo}
                    onChange={(e) => {
                      setFormData({ ...formData, tipo_cabelo: e.target.value });
                      setErrors({ ...errors, tipo_cabelo: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.tipo_cabelo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="liso">Liso</option>
                    <option value="ondulado">Ondulado</option>
                    <option value="cacheado">Cacheado</option>
                    <option value="crespo">Crespo</option>
                  </select>
                  {errors.tipo_cabelo && (
                    <p className="mt-1 text-sm text-red-600">{errors.tipo_cabelo}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="cor_cabelo" className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Cabelo *
                </label>
                <input
                  id="cor_cabelo"
                  type="text"
                  value={formData.cor_cabelo}
                  onChange={(e) => {
                    setFormData({ ...formData, cor_cabelo: e.target.value });
                    setErrors({ ...errors, cor_cabelo: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.cor_cabelo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Castanho, Preto, Loiro..."
                />
                {errors.cor_cabelo && (
                  <p className="mt-1 text-sm text-red-600">{errors.cor_cabelo}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="peso_gramas" className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (gramas) *
                  </label>
                  <input
                    id="peso_gramas"
                    type="number"
                    min="0"
                    value={formData.peso_gramas}
                    onChange={(e) => {
                      setFormData({ ...formData, peso_gramas: e.target.value });
                      setErrors({ ...errors, peso_gramas: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.peso_gramas ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.peso_gramas && (
                    <p className="mt-1 text-sm text-red-600">{errors.peso_gramas}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tamanho_cabelo_cm" className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho (cm) *
                  </label>
                  <input
                    id="tamanho_cabelo_cm"
                    type="number"
                    min="0"
                    value={formData.tamanho_cabelo_cm}
                    onChange={(e) => {
                      setFormData({ ...formData, tamanho_cabelo_cm: e.target.value });
                      setErrors({ ...errors, tamanho_cabelo_cm: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.tamanho_cabelo_cm ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.tamanho_cabelo_cm && (
                    <p className="mt-1 text-sm text-red-600">{errors.tamanho_cabelo_cm}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="cor_linha" className="block text-sm font-medium text-gray-700 mb-2">
                  Cor da Linha *
                </label>
                <input
                  id="cor_linha"
                  type="text"
                  value={formData.cor_linha}
                  onChange={(e) => {
                    setFormData({ ...formData, cor_linha: e.target.value });
                    setErrors({ ...errors, cor_linha: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.cor_linha ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Preta, Branca, Vermelha..."
                />
                {errors.cor_linha && (
                  <p className="mt-1 text-sm text-red-600">{errors.cor_linha}</p>
                )}
              </div>
            </div>

            {/* Seção: Valores */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Valores</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="valor_metro" className="block text-sm font-medium text-gray-700 mb-2">
                    Valor por Metro (R$) *
                  </label>
                  <input
                    id="valor_metro"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_metro}
                    onChange={(e) => {
                      setFormData({ ...formData, valor_metro: e.target.value });
                      setErrors({ ...errors, valor_metro: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.valor_metro ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.valor_metro && (
                    <p className="mt-1 text-sm text-red-600">{errors.valor_metro}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total (R$) *
                  </label>
                  <input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => {
                      setFormData({ ...formData, valor: e.target.value });
                      setErrors({ ...errors, valor: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.valor ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.valor && (
                    <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção: Observações */}
            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Observações adicionais"
              />
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end space-x-4 pt-4 px-6 pb-6 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Criando...' : 'Criar OS'}
            </button>
          </div>
        </form>
      </div>
      <CreateClienteModal
        isOpen={showCreateCliente}
        onClose={() => setShowCreateCliente(false)}
        onSuccess={handleClienteCreated}
      />
    </div>
  );
};

