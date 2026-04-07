import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ordemServicoService, estadoCabeloService, tipoCabeloService, corCabeloService, corLinhaService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { imprimirNota } from '../../utils/printHelpers';
import * as apiModule from '../../services/api';
const servicoService = (apiModule as any).servicoService;

interface OSDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordemId: number | null;
  onUpdated?: () => void;
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = { pendente: 'Pendente', em_desenvolvimento: 'Em Desenvolvimento', finalizada: 'Finalizada' };
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

export const OSDetailsModal = ({ isOpen, onClose, ordemId, onUpdated }: OSDetailsModalProps) => {
  const [ordem, setOrdem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Opções dos dropdowns
  const [estadosCabelo, setEstadosCabelo] = useState<Array<{ id: number; nome: string; valor: string }>>([]);
  const [tiposCabelo, setTiposCabelo] = useState<Array<{ id: number; nome: string; valor: string }>>([]);
  const [coresCabelo, setCoresCabelo] = useState<Array<{ id: number; nome: string }>>([]);
  const [coresLinha, setCoresLinha] = useState<Array<{ id: number; nome: string }>>([]);
  const [servicos, setServicos] = useState<Array<{ id: number; nome: string }>>([]);

  useEffect(() => {
    if (isOpen && ordemId) {
      loadOrdemDetails();
      loadDropdowns();
    } else {
      setOrdem(null);
      setIsEditing(false);
    }
  }, [isOpen, ordemId]);

  // Auto-calcular valor quando tamanho ou valor_metro mudar
  useEffect(() => {
    if (!isEditing) return;
    const tamanho = parseFloat(editData.tamanho_cabelo_cm);
    const valorMetro = parseFloat(editData.valor_metro);
    if (tamanho > 0 && valorMetro > 0) {
      setEditData((prev: any) => ({ ...prev, valor: (tamanho / 100 * valorMetro).toFixed(2) }));
    }
  }, [editData.tamanho_cabelo_cm, editData.valor_metro]);

  const loadOrdemDetails = async () => {
    if (!ordemId) return;
    try {
      setLoading(true);
      const data = await ordemServicoService.getById(ordemId);
      setOrdem(data);
    } catch {
      setOrdem(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [estados, tipos, cores, linhas, svcs] = await Promise.all([
        estadoCabeloService.getAll({ ativo: true }),
        tipoCabeloService.getAll({ ativo: true }),
        corCabeloService.getAll({ ativo: true }),
        corLinhaService.getAll({ ativo: true }),
        servicoService.getAll({ ativo: true }),
      ]);
      setEstadosCabelo(estados);
      setTiposCabelo(tipos);
      setCoresCabelo(cores);
      setCoresLinha(linhas);
      setServicos(svcs);
    } catch {}
  };

  const startEditing = () => {
    setEditData({
      status: ordem.status,
      prazo_entrega: ordem.prazo_entrega,
      estado_cabelo: ordem.estado_cabelo || '',
      tipo_cabelo: ordem.tipo_cabelo || '',
      cor_cabelo: ordem.cor_cabelo || '',
      cor_linha: ordem.cor_linha || '',
      peso_gramas: String(ordem.peso_gramas ?? ''),
      tamanho_cabelo_cm: String(ordem.tamanho_cabelo_cm ?? ''),
      valor_metro: String(ordem.valor_metro ?? ''),
      valor: String(ordem.valor ?? ''),
      descricao: ordem.descricao || '',
      observacoes: ordem.observacoes || '',
      servico_id: ordem.servico_id || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        status: editData.status,
        prazo_entrega: editData.prazo_entrega,
        estado_cabelo: editData.estado_cabelo,
        tipo_cabelo: editData.tipo_cabelo,
        cor_cabelo: editData.cor_cabelo,
        cor_linha: editData.cor_linha,
        peso_gramas: parseInt(editData.peso_gramas) || 0,
        tamanho_cabelo_cm: parseInt(editData.tamanho_cabelo_cm) || 0,
        valor_metro: parseFloat(editData.valor_metro) || 0,
        valor: parseFloat(editData.valor) || 0,
        descricao: editData.descricao,
        observacoes: editData.observacoes,
      };
      if (editData.servico_id) payload.servico_id = editData.servico_id;

      const updated = await ordemServicoService.update(ordemId!, payload);
      setOrdem(updated);
      setIsEditing(false);
      toast.success('OS atualizada com sucesso!');
      onUpdated?.();
    } catch {
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, value: any) => setEditData((prev: any) => ({ ...prev, [field]: value }));

  const inputClass = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">Detalhes da OS</h2>
            {isEditing && <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">Modo edição</span>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">Carregando detalhes...</div>
          ) : ordem ? (
            <div className="space-y-6">
              {/* Cabeçalho OS */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">OS #{ordem.numero}</h3>
                  <p className="text-sm text-gray-600 mt-1">Cliente: {ordem.cliente}</p>
                  {ordem.faturada && <span className="mt-2 inline-block px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-800">✓ Faturada</span>}
                </div>
                {!isEditing && (
                  <span className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(ordem.status)}`}>
                    {getStatusLabel(ordem.status)}
                  </span>
                )}
              </div>

              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditing ? (
                      <select value={editData.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                        <option value="pendente">Pendente</option>
                        <option value="em_desenvolvimento">Em Desenvolvimento</option>
                        <option value="finalizada">Finalizada</option>
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">{getStatusLabel(ordem.status)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
                    {isEditing ? (
                      <select value={editData.servico_id} onChange={e => set('servico_id', e.target.value)} className={inputClass}>
                        <option value="">— Nenhum —</option>
                        {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">{ordem.servico || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                    <p className="text-sm text-gray-900">{formatDate(ordem.data_criacao)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
                    {isEditing ? (
                      <input type="date" value={editData.prazo_entrega} onChange={e => set('prazo_entrega', e.target.value)} className={inputClass} />
                    ) : (
                      <p className="text-sm text-gray-900">{formatDate(ordem.prazo_entrega)}</p>
                    )}
                  </div>
                  {ordem.data_finalizacao && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Finalização</label>
                      <p className="text-sm text-gray-900">{formatDate(ordem.data_finalizacao)}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  {isEditing ? (
                    <textarea value={editData.descricao} onChange={e => set('descricao', e.target.value)} rows={2} className={inputClass} />
                  ) : (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{ordem.descricao || '-'}</p>
                  )}
                </div>
              </div>

              {/* Detalhes do Cabelo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Detalhes do Cabelo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado do Cabelo</label>
                    {isEditing ? (
                      <select value={editData.estado_cabelo} onChange={e => set('estado_cabelo', e.target.value)} className={inputClass}>
                        <option value="">—</option>
                        {estadosCabelo.map(e => <option key={e.id} value={e.valor}>{e.nome}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">{ordem.estado_cabelo || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cabelo</label>
                    {isEditing ? (
                      <select value={editData.tipo_cabelo} onChange={e => set('tipo_cabelo', e.target.value)} className={inputClass}>
                        <option value="">—</option>
                        {tiposCabelo.map(t => <option key={t.id} value={t.valor}>{t.nome}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">{ordem.tipo_cabelo || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Cabelo</label>
                    {isEditing ? (
                      <select value={editData.cor_cabelo} onChange={e => set('cor_cabelo', e.target.value)} className={inputClass}>
                        <option value="">—</option>
                        {coresCabelo.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">{ordem.cor_cabelo || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor da Linha</label>
                    {isEditing ? (
                      <select value={editData.cor_linha} onChange={e => set('cor_linha', e.target.value)} className={inputClass}>
                        <option value="">—</option>
                        {coresLinha.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">{ordem.cor_linha || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (gramas)</label>
                    {isEditing ? (
                      <input type="number" value={editData.peso_gramas} onChange={e => set('peso_gramas', e.target.value)} className={inputClass} min="0" />
                    ) : (
                      <p className="text-sm text-gray-900">{ordem.peso_gramas ?? 0} g</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho (cm)</label>
                    {isEditing ? (
                      <input type="number" value={editData.tamanho_cabelo_cm} onChange={e => set('tamanho_cabelo_cm', e.target.value)} className={inputClass} min="0" />
                    ) : (
                      <p className="text-sm text-gray-900">{ordem.tamanho_cabelo_cm ?? 0} cm</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Valores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor por Metro</label>
                    {isEditing ? (
                      <input type="number" value={editData.valor_metro} onChange={e => set('valor_metro', e.target.value)} className={inputClass} min="0" step="0.01" />
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(ordem.valor_metro)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total {isEditing && <span className="text-xs text-blue-500">(auto-calculado)</span>}</label>
                    {isEditing ? (
                      <input type="number" value={editData.valor} onChange={e => set('valor', e.target.value)} className={inputClass} min="0" step="0.01" />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(ordem.valor)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Foto */}
              {ordem.foto_entrega && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Foto da OS</h3>
                  <div className="flex justify-center">
                    <img src={ordem.foto_entrega} alt="Foto da OS" className="max-w-full h-auto rounded-lg border border-gray-300 shadow-md max-h-96 object-contain" />
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Observações</h3>
                {isEditing ? (
                  <textarea value={editData.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3} className={inputClass} placeholder="Observações..." />
                ) : (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{ordem.observacoes || '-'}</p>
                )}
              </div>

              {ordem.usuario_criacao_nome && (
                <div className="text-xs text-gray-400">Criado por: {ordem.usuario_criacao_nome}</div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">Erro ao carregar detalhes da OS</div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            {!isEditing && ordem && (
              <button onClick={startEditing} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                Editar
              </button>
            )}
            {!isEditing && ordem && (
              <button onClick={() => imprimirNota(ordem)} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                Imprimir
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={cancelEditing} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm">
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
