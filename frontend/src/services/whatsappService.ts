import api from './api';

export const whatsappService = {
  async enviarMensagem(numero: string, mensagem: string) {
    const response = await api.post('/whatsapp/enviar/', {
      numero,
      mensagem,
    });
    return response.data;
  },

  async enviarImagem(numero: string, urlImagem: string, legenda: string = '') {
    const response = await api.post('/whatsapp/enviar-imagem/', {
      numero,
      url_imagem: urlImagem,
      legenda,
    });
    return response.data;
  },

  async enviarNotaOS(numero: string, ordemServicoId: number) {
    const response = await api.post('/whatsapp/enviar-nota-os/', {
      numero,
      ordem_servico_id: ordemServicoId,
    });
    return response.data;
  },

  async enviarOSCriada(numero: string, ordemServicoId: number) {
    const response = await api.post('/whatsapp/enviar-os-criada/', {
      numero,
      ordem_servico_id: ordemServicoId,
    });
    return response.data;
  },
};
