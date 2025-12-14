import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class WhatsAppService:
    def __init__(self):
        """Serviço de WhatsApp usando Twilio API"""
        self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
        self.auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
        self.whatsapp_from = getattr(settings, 'TWILIO_WHATSAPP_FROM', None)

        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio não configurado. Configure TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN no settings.py")

    def enviar_texto(self, numero, mensagem):
        """
        Envia mensagem de texto via Twilio WhatsApp API

        Args:
            numero: Número do telefone (com ou sem formatação)
            mensagem: Texto da mensagem

        Returns:
            dict: Resposta da API Twilio
        """
        if not self.account_sid or not self.auth_token:
            raise ValueError("Twilio não configurado. Configure TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN")

        # Formatar número (remover caracteres especiais)
        numero_limpo = ''.join(filter(str.isdigit, numero))

        # Adicionar código do Brasil apenas se for número brasileiro (não começar com código de país)
        # Números internacionais (ex: EUA começam com 1, outros países têm códigos de 1-3 dígitos)
        if not numero_limpo.startswith('55') and not numero_limpo.startswith('1'):
            # Se parece com número brasileiro (10-11 dígitos sem código de país), adiciona 55
            if len(numero_limpo) >= 10 and len(numero_limpo) <= 11:
                numero_limpo = '55' + numero_limpo

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        auth = (self.account_sid, self.auth_token)

        payload = {
            'From': self.whatsapp_from or f'whatsapp:+{numero_limpo}',
            'To': f'whatsapp:+{numero_limpo}',
            'Body': mensagem
        }

        try:
            response = requests.post(
                url,
                data=payload,
                auth=auth,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao enviar mensagem via Twilio: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Resposta do Twilio: {e.response.text}")
            raise

    def verificar_status_mensagem(self, message_sid):
        """
        Verifica o status de uma mensagem enviada usando o SID

        Args:
            message_sid: SID da mensagem retornado pelo Twilio

        Returns:
            dict: Status da mensagem
        """
        if not self.account_sid or not self.auth_token:
            raise ValueError("Twilio não configurado. Configure TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN")

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages/{message_sid}.json"
        auth = (self.account_sid, self.auth_token)

        try:
            response = requests.get(url, auth=auth)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao verificar status da mensagem: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Resposta do Twilio: {e.response.text}")
            raise

    def enviar_imagem(self, numero, url_imagem, legenda=""):
        """
        Envia imagem via Twilio WhatsApp API

        Args:
            numero: Número do telefone
            url_imagem: URL pública da imagem
            legenda: Legenda opcional da imagem

        Returns:
            dict: Resposta da API Twilio
        """
        if not self.account_sid or not self.auth_token:
            raise ValueError("Twilio não configurado. Configure TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN")

        # Formatar número (remover caracteres especiais)
        numero_limpo = ''.join(filter(str.isdigit, numero))

        # Adicionar código do Brasil apenas se for número brasileiro (não começar com código de país)
        if not numero_limpo.startswith('55') and not numero_limpo.startswith('1'):
            # Se parece com número brasileiro (10-11 dígitos sem código de país), adiciona 55
            if len(numero_limpo) >= 10 and len(numero_limpo) <= 11:
                numero_limpo = '55' + numero_limpo

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        auth = (self.account_sid, self.auth_token)

        payload = {
            'From': self.whatsapp_from or f'whatsapp:+{numero_limpo}',
            'To': f'whatsapp:+{numero_limpo}',
            'MediaUrl': url_imagem
        }

        if legenda:
            payload['Body'] = legenda

        try:
            response = requests.post(
                url,
                data=payload,
                auth=auth,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao enviar imagem via Twilio: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Resposta do Twilio: {e.response.text}")
            raise
