from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .service import WhatsAppService
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_instancia(request):
    """Verifica se a instância Z-API está conectada."""
    try:
        service = WhatsAppService()
        resultado = service.verificar_status()
        return Response({'connected': True, 'detalhes': resultado})
    except ValueError as e:
        return Response({'connected': False, 'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.error(f"Erro ao verificar status Z-API: {e}")
        return Response({'connected': False, 'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_mensagem(request):
    """
    Envia mensagem de texto via WhatsApp (Z-API)
    Body: {
        "numero": "31999999999",
        "mensagem": "Olá, teste!"
    }
    """
    numero = request.data.get('numero')
    mensagem = request.data.get('mensagem')

    if not numero or not mensagem:
        return Response(
            {'error': 'Número e mensagem são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        service = WhatsAppService()
        resultado = service.enviar_texto(numero, mensagem)
        return Response({
            'success': True,
            'mensagem': 'WhatsApp enviado com sucesso!',
            'detalhes': resultado
        })
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Erro ao enviar WhatsApp: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_imagem(request):
    """
    Envia imagem via WhatsApp (Twilio)
    Body: {
        "numero": "31999999999",
        "url_imagem": "https://exemplo.com/imagem.jpg",
        "legenda": "Legenda opcional"
    }
    """
    numero = request.data.get('numero')
    url_imagem = request.data.get('url_imagem')
    legenda = request.data.get('legenda', '')

    if not numero or not url_imagem:
        return Response(
            {'error': 'Número e URL da imagem são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        service = WhatsAppService()
        resultado = service.enviar_imagem(numero, url_imagem, legenda)
        return Response({
            'success': True,
            'mensagem': 'Imagem enviada com sucesso!',
            'detalhes': resultado
        })
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Erro ao enviar imagem: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_nota_os(request):
    """
    Envia mensagem simples de OS finalizada para WhatsApp via Twilio
    Body: {
        "numero": "31999999999",
        "ordem_servico_id": 1
    }
    """
    from apps.ordens_servico.models import OrdemServico

    numero = request.data.get('numero')
    ordem_servico_id = request.data.get('ordem_servico_id')

    if not numero or not ordem_servico_id:
        return Response(
            {'error': 'Número e ordem_servico_id são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        ordem_servico = OrdemServico.objects.get(id=ordem_servico_id)
    except OrdemServico.DoesNotExist:
        return Response(
            {'error': 'Ordem de serviço não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Mensagem simples informando que o pedido está pronto
    mensagem = f"Olá {ordem_servico.cliente.nome if ordem_servico.cliente else 'Cliente'}!\n\n"
    mensagem += f"Seu pedido *{ordem_servico.numero}* já está pronto para retirada! 🎉\n\n"
    mensagem += "Aguardamos você em nossa loja.\n\n"
    mensagem += "Obrigado pela preferência! 🙏\n\n"
    mensagem += "💬 *Ajude-nos a melhorar!*\n"
    mensagem += "Avalie nossa loja no Google Maps:\n"
    mensagem += "https://www.google.com/maps/place/Barra+confec%C3%A7%C3%B5es/data=!4m2!3m1!1s0x0:0x867cefdc13357c1d?sa=X&ved=1t:2428&ictx=111\n\n"
    mensagem += "📱 *Não esqueça de seguir nossa página no Instagram:*\n"
    mensagem += "https://www.instagram.com/barraconfeccoes?igsh=MWprYml1aGx0b3duMg=="

    try:
        service = WhatsAppService()
        resultado = service.enviar_texto(numero, mensagem)

        # Log do status para debug
        message_sid = resultado.get('sid')
        if message_sid:
            logger.info(f"Mensagem de OS finalizada enviada com SID: {message_sid}, Status: {resultado.get('status')}")

        return Response({
            'success': True,
            'mensagem': 'Mensagem enviada com sucesso!',
            'detalhes': resultado,
            'message_sid': message_sid,
            'status_info': f"Status: {resultado.get('status')}. Verifique em: https://www.twilio.com/console/sms/logs"
        })
    except ValueError as e:
        logger.error(f"Erro de configuração Twilio: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem de OS finalizada: {e}", exc_info=True)
        error_msg = str(e)
        # Se for erro do Twilio, tentar extrair mensagem mais clara
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            try:
                import json
                error_data = json.loads(e.response.text)
                error_msg = error_data.get('message', error_data.get('error', error_msg))
            except:
                pass
        return Response(
            {'error': error_msg},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_os_criada(request):
    """
    Envia mensagem de OS recém criada para WhatsApp via Twilio
    Inclui imagem se disponível
    Body: {
        "numero": "31999999999",
        "ordem_servico_id": 1
    }
    """
    from apps.ordens_servico.models import OrdemServico
    from django.conf import settings

    numero = request.data.get('numero')
    ordem_servico_id = request.data.get('ordem_servico_id')

    if not numero or not ordem_servico_id:
        return Response(
            {'error': 'Número e ordem_servico_id são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        ordem_servico = OrdemServico.objects.get(id=ordem_servico_id)
    except OrdemServico.DoesNotExist:
        return Response(
            {'error': 'Ordem de serviço não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Formatar mensagem
    mensagem = formatar_nota_whatsapp(ordem_servico)

    try:
        service = WhatsAppService()

        # Twilio requer URLs públicas acessíveis via HTTPS para enviar imagens
        # Se a imagem estiver em localhost, enviar apenas texto
        # Se tiver foto e URL for pública, tentar enviar imagem
        com_imagem = False
        if ordem_servico.foto_entrega:
            import os as _os
            media_path = ordem_servico.foto_entrega.url
            railway_domain = _os.environ.get('RAILWAY_PUBLIC_DOMAIN', '')
            if railway_domain:
                url_imagem = f"https://{railway_domain}{media_path}"
            else:
                url_imagem = request.build_absolute_uri(media_path)

            eh_publica = 'localhost' not in url_imagem and '127.0.0.1' not in url_imagem and url_imagem.startswith('https://')

            if not eh_publica:
                logger.info(f"Imagem em URL não pública ({url_imagem}), enviando apenas texto")
                resultado = service.enviar_texto(numero, mensagem)
            else:
                try:
                    logger.info(f"Enviando OS com imagem: {url_imagem}")
                    resultado = service.enviar_imagem(numero, url_imagem, mensagem)
                    com_imagem = True
                except Exception as img_error:
                    logger.warning(f"Falha ao enviar imagem, enviando texto: {img_error}")
                    resultado = service.enviar_texto(numero, mensagem)
        else:
            # Enviar apenas texto
            resultado = service.enviar_texto(numero, mensagem)
            logger.info(f"OS criada enviada (sem imagem). SID: {resultado.get('sid')}")

        return Response({
            'success': True,
            'mensagem': 'OS enviada para WhatsApp com sucesso!',
            'detalhes': resultado,
            'message_sid': resultado.get('sid'),
            'com_imagem': com_imagem,
            'observacao': 'Imagem não enviada (URL não pública)' if ordem_servico.foto_entrega and not com_imagem else None
        })
    except ValueError as e:
        logger.error(f"Erro de configuração Twilio: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Erro ao enviar OS criada: {e}", exc_info=True)
        error_msg = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            try:
                import json
                error_data = json.loads(e.response.text)
                error_msg = error_data.get('message', error_data.get('error', error_msg))
            except:
                pass
        return Response(
            {'error': error_msg},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def formatar_nota_whatsapp(ordem_servico):
    """Formata a nota da OS para envio via WhatsApp (mesmo formato da impressão)"""
    from decimal import Decimal

    def get_estado_cabelo_label(estado):
        labels = {
            'novo': 'Novo',
            'descolorido': 'Descolorido',
            'branco': 'Branco',
            'preto': 'Preto',
            'castanho': 'Castanho',
            'rubro': 'Rubro',
            'loiro': 'Loiro',
            'pintado': 'Pintado',
        }
        return labels.get(estado, estado or '-')

    def get_tipo_cabelo_label(tipo):
        labels = {
            'liso': 'Liso',
            'ondulado': 'Ondulado',
            'cacheado': 'Cacheado',
            'crespo': 'Crespo',
        }
        return labels.get(tipo, tipo or '-')

    def format_currency(value):
        if value is None:
            return '-'
        # Converter para Decimal se necessário
        if isinstance(value, (int, float)):
            value = Decimal(str(value))
        elif isinstance(value, Decimal):
            pass
        else:
            return str(value)
        # Formatar como moeda brasileira: 45.00 -> 45,00
        valor_str = f"{value:.2f}"
        return valor_str.replace('.', ',')

    # Formatar datas
    data_criacao = ordem_servico.data_criacao.strftime('%d/%m/%Y') if ordem_servico.data_criacao else '-'
    prazo_entrega = ordem_servico.prazo_entrega.strftime('%d/%m/%Y') if ordem_servico.prazo_entrega else '-'

    # Formatar valores
    valor_metro = format_currency(ordem_servico.valor_metro) if ordem_servico.valor_metro else '-'

    # Obter telefone do cliente
    telefone_cliente = ordem_servico.cliente.telefone if ordem_servico.cliente and ordem_servico.cliente.telefone else '-'

    # Montar mensagem
    mensagem = f"""*Barra Confecções*
Ordem de Serviço

Data: {data_criacao}
Data de Entrega: {prazo_entrega}

*Cliente:* {ordem_servico.cliente.nome if ordem_servico.cliente else '-'}
*Telefone:* {telefone_cliente}

*Estado do cabelo:* {get_estado_cabelo_label(ordem_servico.estado_cabelo)}
*Tipo de Cabelo:* {get_tipo_cabelo_label(ordem_servico.tipo_cabelo)}
*Cor do Cabelo:* {ordem_servico.cor_cabelo or '-'}
*Peso:* {ordem_servico.peso_gramas or 0} gramas
*Tamanho:* {ordem_servico.tamanho_cabelo_cm or 0} cm
*Cor da linha:* {ordem_servico.cor_linha or '-'}
*Serviço:* {ordem_servico.servico.nome if ordem_servico.servico else '-'}
*Valor por metro:* R$ {valor_metro}

*Observação:* {ordem_servico.observacoes or '(O cliente está ciente da perda de 20% na quantidade e 7 cm no comprimento.)'}

_Limpeza e mesclagem poderão perder até 40% da quantidade. Qualquer metragem inferior a 1 metro será cobrada ao valor do metro._"""

    return mensagem
