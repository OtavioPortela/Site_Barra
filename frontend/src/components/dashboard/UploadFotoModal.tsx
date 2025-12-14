import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UploadFotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onSkip: () => Promise<void>;
  ordemNumero: string;
}

type Step = 'confirm' | 'choose' | 'capture';

export const UploadFotoModal = ({ isOpen, onClose, onUpload, onSkip, ordemNumero }: UploadFotoModalProps) => {
  const [step, setStep] = useState<Step>('confirm');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Efeito para gerenciar o stream do vídeo
  useEffect(() => {
    if (step === 'capture' && videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play().catch((error) => {
          console.error('Erro ao reproduzir vídeo:', error);
          toast.error('Erro ao iniciar a câmera');
        });
      };
    }

    // Cleanup: parar stream quando o componente desmontar ou mudar de step
    return () => {
      if (stream && step !== 'capture') {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, stream]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Por favor, selecione um arquivo de imagem');
      }
    }
  };

  const handleStartCamera = async () => {
    try {
      // Tentar primeiro com câmera traseira (mobile), depois fallback para qualquer câmera
      let mediaStream: MediaStream | null = null;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (error) {
        // Fallback: tentar com qualquer câmera disponível
        console.log('Tentando câmera alternativa...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      if (mediaStream) {
        setStream(mediaStream);
        setStep('capture');
      }
    } catch (error: any) {
      console.error('Erro ao acessar câmera:', error);
      let errorMessage = 'Não foi possível acessar a câmera.';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'A câmera está sendo usada por outro aplicativo.';
      }

      toast.error(errorMessage);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Verificar se o vídeo está pronto
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
            const file = new File([blob], `foto_entrega_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreview(canvas.toDataURL('image/jpeg'));

            // Parar a câmera
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              setStream(null);
            }

            toast.success('Foto capturada com sucesso!');
          } else {
            toast.error('Erro ao processar a foto');
          }
        }, 'image/jpeg', 0.9);
      } else {
        toast.error('Aguarde a câmera inicializar completamente');
      }
    }
  };

  const handleCancelCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('choose');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione ou capture uma foto');
      return;
    }

    setLoading(true);
    try {
      await onUpload(selectedFile);
      handleClose();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Parar câmera se estiver ativa
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('confirm');
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {step === 'confirm' && 'Adicionar Foto de Entrega'}
            {step === 'choose' && 'Escolher Foto'}
            {step === 'capture' && 'Capturar Foto'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'confirm' && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Deseja adicionar uma foto para comprovar a entrega da OS <strong>#{ordemNumero}</strong>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sim
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await onSkip();
                      handleClose();
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Não'}
                </button>
              </div>
            </div>
          )}

          {step === 'choose' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleStartCamera}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">📷</span>
                  <span>Câmera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">📎</span>
                  <span>Anexar</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {preview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          )}

          {step === 'capture' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-[400px] object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Iniciando câmera...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleCapturePhoto}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Capturar
                </button>
                <button
                  onClick={handleCancelCamera}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
              {preview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Foto capturada:</p>
                  <img
                    src={preview}
                    alt="Foto capturada"
                    className="w-full rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {(step === 'choose' || step === 'capture') && selectedFile && (
          <div className="flex-shrink-0 flex justify-end space-x-4 pt-4 px-6 pb-6 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

