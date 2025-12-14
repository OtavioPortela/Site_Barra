import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { clienteService, ordemServicoService } from '../../services/api';
import { whatsappService } from '../../services/whatsappService';
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
    pago_na_entrega: false,
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
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [showFotoOptions, setShowFotoOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

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

  // Limpar foto quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setFotoFile(null);
      setFotoPreview(null);
      setShowFotoOptions(false);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
  }, [isOpen, cameraStream]);

  // Gerenciar stream de vídeo
  useEffect(() => {
    if (showFotoOptions && videoRef.current && cameraStream) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      video.onloadedmetadata = () => {
        video.play().catch((error) => {
          console.error('Erro ao reproduzir vídeo:', error);
          toast.error('Erro ao iniciar a câmera');
        });
      };
    }

    return () => {
      if (cameraStream && !showFotoOptions) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showFotoOptions, cameraStream]);

  const handleFotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setShowFotoOptions(false);
      } else {
        toast.error('Por favor, selecione um arquivo de imagem');
      }
    }
  };

  const handleStartCamera = async () => {
    try {
      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (error) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      if (mediaStream) {
        setCameraStream(mediaStream);
      }
    } catch (error: any) {
      console.error('Erro ao acessar câmera:', error);
      let errorMessage = 'Não foi possível acessar a câmera.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada.';
      }
      toast.error(errorMessage);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        toast.error('Aguarde a câmera carregar completamente');
        return;
      }

      const context = canvas.getContext('2d');
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `foto_os_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFotoFile(file);
            setFotoPreview(canvas.toDataURL('image/jpeg'));

            if (cameraStream) {
              cameraStream.getTracks().forEach(track => track.stop());
              setCameraStream(null);
            }
            setShowFotoOptions(false);
            toast.success('Foto capturada com sucesso!');
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowFotoOptions(false);
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
      // Se tiver foto, usar FormData, senão usar JSON normal
      if (fotoFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('cliente', formData.cliente);
        formDataToSend.append('valor', formData.valor);
        formDataToSend.append('valor_metro', formData.valor_metro);
        formDataToSend.append('prazo_entrega', formData.prazo_entrega);
        formDataToSend.append('status', 'pendente');
        formDataToSend.append('pago_na_entrega', formData.pago_na_entrega ? 'true' : 'false');
        formDataToSend.append('estado_cabelo', formData.estado_cabelo);
        formDataToSend.append('tipo_cabelo', formData.tipo_cabelo);
        formDataToSend.append('cor_cabelo', formData.cor_cabelo);
        formDataToSend.append('peso_gramas', formData.peso_gramas);
        formDataToSend.append('tamanho_cabelo_cm', formData.tamanho_cabelo_cm);
        formDataToSend.append('cor_linha', formData.cor_linha);
        formDataToSend.append('servico', formData.servico);
        if (formData.descricao) formDataToSend.append('descricao', formData.descricao);
        if (formData.observacoes) formDataToSend.append('observacoes', formData.observacoes);
        formDataToSend.append('foto_entrega', fotoFile);

        var ordemCriada = await ordemServicoService.create(formDataToSend);
      } else {
        const createData: any = {
          cliente: formData.cliente,
          valor: parseFloat(formData.valor),
          valor_metro: parseFloat(formData.valor_metro),
          prazo_entrega: formData.prazo_entrega,
          status: 'pendente',
          pago_na_entrega: formData.pago_na_entrega,
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

        var ordemCriada = await ordemServicoService.create(createData);
      }

      // Buscar OS completa para obter telefone do cliente se não veio na resposta
      if (ordemCriada && ordemCriada.id) {
        try {
          ordemCriada = await ordemServicoService.getById(ordemCriada.id);
        } catch (error) {
          console.error('Erro ao buscar OS completa:', error);
        }
      }

      // Enviar para WhatsApp automaticamente se tiver telefone
      if (ordemCriada && ordemCriada.cliente_telefone) {
        try {
          await whatsappService.enviarOSCriada(ordemCriada.cliente_telefone, ordemCriada.id);
          toast.success('Ordem de serviço criada e enviada para WhatsApp!');
        } catch (error: any) {
          // Não bloquear criação se falhar envio WhatsApp
          console.error('Erro ao enviar para WhatsApp:', error);
          toast.success('Ordem de serviço criada com sucesso! (WhatsApp não enviado)');
        }
      } else {
        toast.success('Ordem de serviço criada com sucesso!');
      }

      setFormData({
        cliente: '',
        descricao: '',
        valor: '',
        valor_metro: '',
        prazo_entrega: '',
        observacoes: '',
        pago_na_entrega: false,
        estado_cabelo: 'novo',
        tipo_cabelo: 'liso',
        cor_cabelo: '',
        peso_gramas: '',
        tamanho_cabelo_cm: '',
        cor_linha: '',
        servico: '',
      });
      setFotoFile(null);
      setFotoPreview(null);
      setShowFotoOptions(false);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
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

            {/* Seção: Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto (opcional)
              </label>

              {!fotoPreview && !showFotoOptions && (
                <button
                  type="button"
                  onClick={() => setShowFotoOptions(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  📷 Adicionar Foto
                </button>
              )}

              {showFotoOptions && !cameraStream && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl">📷</span>
                      <span>Câmera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl">📎</span>
                      <span>Anexar</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFotoOptions(false)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {cameraStream && (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Capturar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (cameraStream) {
                          cameraStream.getTracks().forEach(track => track.stop());
                          setCameraStream(null);
                        }
                        setShowFotoOptions(false);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {fotoPreview && (
                <div className="mt-3">
                  <div className="relative">
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="w-full rounded-lg border border-gray-300 max-h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      title="Remover foto"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Seção: Pagamento */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pago_na_entrega}
                  onChange={(e) => setFormData({ ...formData, pago_na_entrega: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Já foi pago na entrega?
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Se marcado, será possível emitir nota fiscal diretamente no card da OS
              </p>
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

