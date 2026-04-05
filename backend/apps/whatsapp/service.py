import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class WhatsAppService:
    """
    Serviço de WhatsApp usando Z-API.
    Documentação: https://developer.z-api.io
    """

    BASE_URL = 'https://api.z-api.io/instances/{instance_id}/token/{token}'

    def __init__(self):
        self.instance_id = getattr(settings, 'ZAPI_INSTANCE_ID', None)
        self.token = getattr(settings, 'ZAPI_TOKEN', None)
        self.client_token = getattr(settings, 'ZAPI_CLIENT_TOKEN', None)

        if not self.instance_id or not self.token:
            logger.warning(
                "Z-API não configurada. Defina ZAPI_INSTANCE_ID e ZAPI_TOKEN nas variáveis de ambiente."
            )

    def _base_url(self):
        return self.BASE_URL.format(instance_id=self.instance_id, token=self.token)

    def _headers(self):
        headers = {'Content-Type': 'application/json'}
        if self.client_token:
            headers['Client-Token'] = self.client_token
        return headers

    def _formatar_numero(self, numero):
        """
        Formata o número para o padrão Z-API: apenas dígitos com DDI.
        Ex: (31) 9 9999-0000 → 5531999990000
        """
        numero_limpo = ''.join(filter(str.isdigit, numero))

        # Adiciona DDI 55 (Brasil) se não tiver
        if not numero_limpo.startswith('55'):
            if len(numero_limpo) in (10, 11):
                numero_limpo = '55' + numero_limpo

        return numero_limpo

    def _checar_configuracao(self):
        if not self.instance_id or not self.token:
            raise ValueError(
                "Z-API não configurada. Defina ZAPI_INSTANCE_ID e ZAPI_TOKEN nas variáveis de ambiente."
            )

    def enviar_texto(self, numero, mensagem):
        """
        Envia mensagem de texto via Z-API.

        Args:
            numero: Telefone do destinatário (qualquer formato)
            mensagem: Texto da mensagem

        Returns:
            dict: Resposta da Z-API
        """
        self._checar_configuracao()

        numero_formatado = self._formatar_numero(numero)
        url = f'{self._base_url()}/send-text'

        payload = {
            'phone': numero_formatado,
            'message': mensagem,
        }

        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=15)
            response.raise_for_status()
            resultado = response.json()
            logger.info(f"Mensagem enviada via Z-API para {numero_formatado}. Resposta: {resultado}")
            return resultado
        except requests.exceptions.HTTPError as e:
            logger.error(f"Erro HTTP ao enviar mensagem Z-API: {e.response.status_code} — {e.response.text}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro de conexão com Z-API: {e}")
            raise

    def enviar_imagem(self, numero, url_imagem, legenda=''):
        """
        Envia imagem via Z-API.

        Args:
            numero: Telefone do destinatário
            url_imagem: URL pública da imagem
            legenda: Legenda opcional

        Returns:
            dict: Resposta da Z-API
        """
        self._checar_configuracao()

        numero_formatado = self._formatar_numero(numero)
        url = f'{self._base_url()}/send-image'

        payload = {
            'phone': numero_formatado,
            'image': url_imagem,
            'caption': legenda,
        }

        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=15)
            response.raise_for_status()
            resultado = response.json()
            logger.info(f"Imagem enviada via Z-API para {numero_formatado}. Resposta: {resultado}")
            return resultado
        except requests.exceptions.HTTPError as e:
            logger.error(f"Erro HTTP ao enviar imagem Z-API: {e.response.status_code} — {e.response.text}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro de conexão com Z-API: {e}")
            raise

    def verificar_status(self):
        """
        Verifica se a instância Z-API está conectada.

        Returns:
            dict: Status da instância
        """
        self._checar_configuracao()

        url = f'{self._base_url()}/status'

        try:
            response = requests.get(url, headers=self._headers(), timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao verificar status da instância Z-API: {e}")
            raise
