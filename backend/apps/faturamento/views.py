from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta, date
from apps.ordens_servico.models import OrdemServico
from apps.ordens_servico.serializers import OrdemServicoListSerializer
from apps.ordens_servico.permissions import IsStaffOnly
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffOnly])
def dashboard_view(request):
    """Endpoint para métricas gerais do dashboard."""

    # Filtrar apenas OS faturadas para cálculos de faturamento
    os_finalizadas = OrdemServico.objects.filter(status='finalizada', faturada=True)

    # Filtros opcionais (conforme especificação do frontend)
    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')
    cliente_param = request.query_params.get('cliente')  # Pode ser nome do cliente

    if data_inicio:
        try:
            if 'T' in data_inicio:
                data_inicio_dt = datetime.fromisoformat(data_inicio.replace('Z', '+00:00'))
                data_inicio = data_inicio_dt.date()
            else:
                data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            os_finalizadas = os_finalizadas.filter(data_finalizacao__date__gte=data_inicio)
        except (ValueError, AttributeError) as e:
            logger.warning(f"data_inicio inválida ignorada: '{request.query_params.get('data_inicio')}' — {e}")

    if data_fim:
        try:
            if 'T' in data_fim:
                data_fim_dt = datetime.fromisoformat(data_fim.replace('Z', '+00:00'))
                data_fim = data_fim_dt.date()
            else:
                data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
            os_finalizadas = os_finalizadas.filter(data_finalizacao__date__lte=data_fim)
        except (ValueError, AttributeError) as e:
            logger.warning(f"data_fim inválida ignorada: '{request.query_params.get('data_fim')}' — {e}")

    if cliente_param:
        # Filtrar por nome do cliente (string)
        os_finalizadas = os_finalizadas.filter(cliente__nome__icontains=cliente_param)

    # Cálculos gerais
    faturamento_total = os_finalizadas.aggregate(Sum('valor'))['valor__sum'] or 0

    # Faturamento mensal (últimos 30 dias)
    data_30_dias = timezone.now() - timedelta(days=30)
    os_mensal = os_finalizadas.filter(data_finalizacao__gte=data_30_dias)
    faturamento_mensal = os_mensal.aggregate(Sum('valor'))['valor__sum'] or 0

    # Faturamento semanal (últimos 7 dias)
    data_7_dias = timezone.now() - timedelta(days=7)
    os_semanal = os_finalizadas.filter(data_finalizacao__gte=data_7_dias)
    faturamento_semanal = os_semanal.aggregate(Sum('valor'))['valor__sum'] or 0

    # Quantidade de OS finalizadas
    quantidade_finalizadas = os_finalizadas.count()

    # Ticket médio
    ticket_medio = os_finalizadas.aggregate(Avg('valor'))['valor__avg'] or 0

    # Faturamento por período (últimos 12 meses)
    faturamento_por_periodo = []
    hoje = timezone.now().date()

    for i in range(11, -1, -1):  # 11 meses atrás até agora
        # Calcular data do primeiro dia do mês
        if hoje.month - i <= 0:
            ano = hoje.year - 1
            mes = hoje.month - i + 12
        else:
            ano = hoje.year
            mes = hoje.month - i

        data_inicio_periodo = date(ano, mes, 1)

        # Calcular último dia do mês
        if mes == 12:
            data_fim_periodo = date(ano + 1, 1, 1) - timedelta(days=1)
        else:
            data_fim_periodo = date(ano, mes + 1, 1) - timedelta(days=1)

        os_periodo = os_finalizadas.filter(
            data_finalizacao__date__gte=data_inicio_periodo,
            data_finalizacao__date__lte=data_fim_periodo
        )
        valor_periodo = os_periodo.aggregate(Sum('valor'))['valor__sum'] or 0

        faturamento_por_periodo.append({
            'periodo': data_inicio_periodo.strftime('%Y-%m'),
            'valor': float(valor_periodo)
        })

    # Distribuição por status (apenas OS não faturadas)
    distribuicao_status = []
    todos_status = OrdemServico.objects.filter(faturada=False).values('status').annotate(
        quantidade=Count('id')
    )

    for item in todos_status:
        distribuicao_status.append({
            'status': item['status'],
            'quantidade': item['quantidade']
        })

    # Top clientes (por faturamento)
    top_clientes = os_finalizadas.values('cliente__nome').annotate(
        faturamento=Sum('valor')
    ).order_by('-faturamento')[:10]

    top_clientes_list = [
        {
            'cliente': item['cliente__nome'],
            'faturamento': float(item['faturamento'])
        }
        for item in top_clientes
    ]

    # OS finalizadas (para tabela)
    ordens_finalizadas = os_finalizadas.order_by('-data_finalizacao')[:50]
    serializer = OrdemServicoListSerializer(ordens_finalizadas, many=True)

    return Response({
        'faturamento_total': float(faturamento_total),
        'faturamento_mensal': float(faturamento_mensal),
        'faturamento_semanal': float(faturamento_semanal),
        'quantidade_finalizadas': quantidade_finalizadas,
        'ticket_medio': float(ticket_medio),
        'faturamento_por_periodo': faturamento_por_periodo,
        'distribuicao_status': distribuicao_status,
        'top_clientes': top_clientes_list,
        'ordens_finalizadas': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffOnly])
def por_periodo_view(request):
    """Endpoint para faturamento filtrado por período."""
    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')

    if not data_inicio or not data_fim:
        return Response(
            {'error': 'Os parâmetros data_inicio e data_fim são obrigatórios.'},
            status=400
        )

    try:
        data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
        data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Formato de data inválido. Use YYYY-MM-DD.'},
            status=400
        )

    os_finalizadas = OrdemServico.objects.filter(
        status='finalizada',
        faturada=True,
        data_finalizacao__date__gte=data_inicio,
        data_finalizacao__date__lte=data_fim
    )

    faturamento = os_finalizadas.aggregate(Sum('valor'))['valor__sum'] or 0
    quantidade = os_finalizadas.count()

    return Response({
        'periodo_inicio': str(data_inicio),
        'periodo_fim': str(data_fim),
        'faturamento': float(faturamento),
        'quantidade_os': quantidade
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffOnly])
def por_cliente_view(request):
    """Endpoint para faturamento por cliente."""
    os_finalizadas = OrdemServico.objects.filter(status='finalizada', faturada=True)

    faturamento_por_cliente = os_finalizadas.values(
        'cliente__id', 'cliente__nome'
    ).annotate(
        faturamento=Sum('valor'),
        quantidade_os=Count('id')
    ).order_by('-faturamento')

    resultado = [
        {
            'cliente_id': item['cliente__id'],
            'cliente_nome': item['cliente__nome'],
            'faturamento': float(item['faturamento']),
            'quantidade_os': item['quantidade_os']
        }
        for item in faturamento_por_cliente
    ]

    return Response(resultado)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffOnly])
def relatorio_view(request):
    """Endpoint para relatório completo."""
    # Similar ao dashboard, mas com mais detalhes
    return dashboard_view(request)

