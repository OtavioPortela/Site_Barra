import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { clienteService } from '../../services/api';
import type { Cliente } from '../../types';

interface CreateClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clienteNome: string) => void;
  clienteToEdit?: Cliente | null;
}

export const CreateClienteModal = ({ isOpen, onClose, onSuccess, clienteToEdit }: CreateClienteModalProps) => {
  const isEditing = !!clienteToEdit;

  const [formData, setFormData] = useState({
    nome: '',
    cnpj_cpf: '',
    email: '',
    telefone: '',
    endereco: '',
    eh_parceiro: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (clienteToEdit) {
      setFormData({
        nome: clienteToEdit.nome || '',
        cnpj_cpf: clienteToEdit.cnpj_cpf || '',
        email: clienteToEdit.email || '',
        telefone: clienteToEdit.telefone || '',
        endereco: clienteToEdit.endereco || '',
        eh_parceiro: clienteToEdit.eh_parceiro || false,
      });
    } else {
      setFormData({ nome: '', cnpj_cpf: '', email: '', telefone: '', endereco: '', eh_parceiro: false });
    }
    setErrors({});
  }, [clienteToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        nome: formData.nome,
        cnpj_cpf: formData.cnpj_cpf || undefined,
        email: formData.email || undefined,
        telefone: formData.telefone,
        endereco: formData.endereco || undefined,
        eh_parceiro: formData.eh_parceiro,
      };

      if (isEditing && clienteToEdit) {
        await clienteService.update(clienteToEdit.id, payload);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await clienteService.create(payload);
        toast.success('Cliente criado com sucesso!');
      }

      onSuccess(formData.nome);
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || (isEditing ? 'Erro ao atualizar cliente' : 'Erro ao criar cliente');
      toast.error(errorMessage);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => { setFormData({ ...formData, nome: e.target.value }); setErrors({ ...errors, nome: '' }); }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.nome ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nome completo ou razão social"
            />
            {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
          </div>

          <div>
            <label htmlFor="cnpj_cpf" className="block text-sm font-medium text-gray-700 mb-2">CNPJ/CPF (opcional)</label>
            <input
              id="cnpj_cpf"
              type="text"
              value={formData.cnpj_cpf}
              onChange={(e) => { setFormData({ ...formData, cnpj_cpf: e.target.value }); setErrors({ ...errors, cnpj_cpf: '' }); }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.cnpj_cpf ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
            {errors.cnpj_cpf && <p className="mt-1 text-sm text-red-600">{errors.cnpj_cpf}</p>}
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
            <input
              id="telefone"
              type="text"
              value={formData.telefone}
              onChange={(e) => { setFormData({ ...formData, telefone: e.target.value }); setErrors({ ...errors, telefone: '' }); }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.telefone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="(00) 00000-0000"
            />
            {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email (opcional)</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-2">Endereço (opcional)</label>
            <textarea
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Endereço completo"
            />
          </div>

          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="eh_parceiro"
              checked={formData.eh_parceiro}
              onChange={(e) => setFormData({ ...formData, eh_parceiro: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="eh_parceiro" className="text-sm font-medium text-gray-700 cursor-pointer">
              📋 É parceiro (pode deixar pendurado na conta)
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
