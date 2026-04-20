from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.viewsets import ModelViewSet
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta, date
from apps.ordens_servico.models import OrdemServico
from apps.ordens_servico.serializers import OrdemServicoListSerializer
from apps.ordens_servico.permissions import IsStaffOnly
from .models import SaidaCaixa, ConfiguracaoEmpresa
from .serializers import SaidaCaixaSerializer, ConfiguracaoEmpresaSerializer
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
            data_inicio = None

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
            data_fim = None

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

    # Faturamento por período (últimos 12 meses) — query única com TruncMonth
    hoje = timezone.now().date()
    mes_atual = hoje.replace(day=1)
    ano_inicio = mes_atual.year
    mes_inicio = mes_atual.month - 11
    if mes_inicio <= 0:
        mes_inicio += 12
        ano_inicio -= 1
    data_inicio_12m = date(ano_inicio, mes_inicio, 1)

    faturamento_por_mes = {}
    for row in (
        os_finalizadas
        .filter(data_finalizacao__date__gte=data_inicio_12m)
        .annotate(mes=TruncMonth('data_finalizacao'))
        .values('mes')
        .annotate(valor=Sum('valor'))
    ):
        if row['mes']:
            faturamento_por_mes[row['mes'].strftime('%Y-%m')] = row['valor']

    faturamento_por_periodo = []
    for i in range(11, -1, -1):
        ano = mes_atual.year
        mes = mes_atual.month - i
        if mes <= 0:
            mes += 12
            ano -= 1
        key = f'{ano:04d}-{mes:02d}'
        faturamento_por_periodo.append({
            'periodo': key,
            'valor': float(faturamento_por_mes.get(key, 0) or 0)
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
    ordens_finalizadas = os_finalizadas.select_related('cliente', 'servico').order_by('-data_finalizacao')[:50]
    serializer = OrdemServicoListSerializer(ordens_finalizadas, many=True)

    # Saídas de caixa (apenas tipo='saida' impacta o lucro)
    saidas_qs = SaidaCaixa.objects.filter(tipo='saida')
    if data_inicio:
        saidas_qs = saidas_qs.filter(data__gte=data_inicio)
    if data_fim:
        saidas_qs = saidas_qs.filter(data__lte=data_fim)
    total_saidas = saidas_qs.aggregate(Sum('valor'))['valor__sum'] or 0

    saidas_mensal = SaidaCaixa.objects.filter(tipo='saida', data__gte=timezone.now().date() - timedelta(days=30))
    total_saidas_mensal = saidas_mensal.aggregate(Sum('valor'))['valor__sum'] or 0

    return Response({
        'faturamento_total': float(faturamento_total),
        'faturamento_mensal': float(faturamento_mensal),
        'faturamento_semanal': float(faturamento_semanal),
        'quantidade_finalizadas': quantidade_finalizadas,
        'ticket_medio': float(ticket_medio),
        'faturamento_por_periodo': faturamento_por_periodo,
        'distribuicao_status': distribuicao_status,
        'top_clientes': top_clientes_list,
        'ordens_finalizadas': serializer.data,
        'total_saidas': float(total_saidas),
        'total_saidas_mensal': float(total_saidas_mensal),
        'lucro_liquido': float(faturamento_total) - float(total_saidas),
        'lucro_liquido_mensal': float(faturamento_mensal) - float(total_saidas_mensal),
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


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsStaffOnly])
def configuracao_empresa_view(request):
    """GET retorna config atual; PATCH atualiza."""
    config = ConfiguracaoEmpresa.get()
    if request.method == 'PATCH':
        serializer = ConfiguracaoEmpresaSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(ConfiguracaoEmpresaSerializer(config).data)


class SaidaCaixaViewSet(ModelViewSet):
    serializer_class = SaidaCaixaSerializer
    queryset = SaidaCaixa.objects.all()

    def get_permissions(self):
        # Qualquer autenticado pode criar e listar (lista filtrada por get_queryset)
        if self.action in ('create', 'list', 'retrieve'):
            return [IsAuthenticated()]
        # Funcionário pode excluir apenas o próprio registro (verificado em destroy)
        if self.action == 'destroy':
            return [IsAuthenticated()]
        # Edição (update/partial_update) restrita ao staff
        return [IsAuthenticated(), IsStaffOnly()]

    def get_queryset(self):
        qs = SaidaCaixa.objects.select_related('criado_por')
        # Funcionários veem apenas os próprios lançamentos
        if not self.request.user.is_staff:
            qs = qs.filter(criado_por=self.request.user)
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        categoria = self.request.query_params.get('categoria')
        tipo = self.request.query_params.get('tipo')
        if data_inicio:
            qs = qs.filter(data__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data__lte=data_fim)
        if categoria:
            qs = qs.filter(categoria=categoria)
        if tipo:
            qs = qs.filter(tipo=tipo)
        return qs

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Funcionários só podem excluir os próprios lançamentos
        if not request.user.is_staff and instance.criado_por != request.user:
            return Response(
                {'erro': 'Você só pode excluir lançamentos que você mesmo registrou.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

