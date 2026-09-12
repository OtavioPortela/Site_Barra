"""
Painel Material: perdas de cabelo, volume processado e custo de material.

Definições usadas em todos os números:
- Cabelo recebido: OS (não canceladas) criadas no período, pelo peso de entrada.
- Perda de uma OS: (peso de entrada - peso final) / peso de entrada, medida ao finalizar.
  As médias são ponderadas pelo peso (gramas perdidas / gramas de entrada), para uma OS
  de 400 g pesar mais que uma de 50 g.
- Perda esperada: 20%, ou 40% quando a limpeza/mesclagem foi autorizada. OS com limpeza
  ficam fora dos gráficos de perda "normal" e têm média própria.
- Custo de material: saídas de caixa da categoria Material no período.
- Faturamento: mesma regra do painel de Faturamento (OS faturadas, pela data de finalização).
"""
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.ordens_servico.models import EstadoCabelo, OrdemServico
from apps.ordens_servico.permissions import IsStaffOnly
from .models import SaidaCaixa

PERDA_ESPERADA = 0.20
PERDA_ESPERADA_LIMPEZA = 0.40
LIMITE_LISTAS = 50

ORIGEM_LABEL = dict(OrdemServico.ORIGEM_CABELO_CHOICES)
TIPO_MATERIAL_LABEL = dict(SaidaCaixa.TIPO_MATERIAL_CHOICES)


def _periodo(request):
    hoje = timezone.localdate()
    inicio_txt = request.query_params.get('data_inicio')
    fim_txt = request.query_params.get('data_fim')
    inicio = datetime.strptime(inicio_txt, '%Y-%m-%d').date() if inicio_txt else hoje.replace(day=1)
    fim = datetime.strptime(fim_txt, '%Y-%m-%d').date() if fim_txt else hoje
    if inicio > fim:
        raise ValueError('A data inicial não pode ser depois da final.')
    return inicio, fim


def _dinheiro(valor):
    return round(float(valor or 0), 2)


def _pct(parte, total):
    return round(parte / total * 100, 1) if total else None


def _inicio_semana(dt):
    dia = timezone.localtime(dt).date() if isinstance(dt, datetime) else dt
    return dia - timedelta(days=dia.weekday())


def _perda(os):
    return (os.peso_gramas - os.peso_final_gramas) / os.peso_gramas


def _perda_ponderada(ordens):
    entrada = sum(o.peso_gramas for o in ordens)
    perdido = sum(o.peso_gramas - o.peso_final_gramas for o in ordens)
    return _pct(perdido, entrada), entrada, perdido


def _agrupar_perda(ordens, chave):
    grupos = defaultdict(list)
    for o in ordens:
        grupos[chave(o)].append(o)
    linhas = []
    for nome, itens in grupos.items():
        perda, entrada, perdido = _perda_ponderada(itens)
        linhas.append({'nome': nome, 'perda': perda, 'os': len(itens), 'gramas_entrada': entrada, 'gramas_perdidas': perdido})
    return sorted(linhas, key=lambda linha: linha['perda'] or 0, reverse=True)


def _nome_servico(os):
    return os.servico.nome if os.servico else 'Sem serviço'


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffOnly])
def material_view(request):
    try:
        inicio, fim = _periodo(request)
    except ValueError as e:
        return Response({'error': f'Período inválido: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    base = OrdemServico.objects.exclude(status='cancelada').select_related('cliente', 'servico')

    # ---------- Perdas (OS finalizadas no período) ----------
    finalizadas = list(base.filter(
        data_finalizacao__isnull=False,
        data_finalizacao__date__gte=inicio,
        data_finalizacao__date__lte=fim,
    ))
    pesadas = [o for o in finalizadas if o.peso_final_gramas is not None and o.peso_gramas]
    sem_limpeza = [o for o in pesadas if not o.limpeza_mesclagem]
    com_limpeza = [o for o in pesadas if o.limpeza_mesclagem]
    sem_peso = [o for o in finalizadas if o.peso_final_gramas is None]

    # Estados são cadastráveis em Configurações; o nome exibido vem de lá
    estado_label = {**dict(OrdemServico.ESTADO_CABELO_CHOICES), **dict(EstadoCabelo.objects.values_list('valor', 'nome'))}
    perda_media, _, _ = _perda_ponderada(sem_limpeza)
    perda_media_limpeza, _, _ = _perda_ponderada(com_limpeza)

    semanas_perda = defaultdict(list)
    for o in sem_limpeza:
        semanas_perda[_inicio_semana(o.data_finalizacao)].append(o)
    perda_semanal = []
    for semana in sorted(semanas_perda):
        perda, entrada, perdido = _perda_ponderada(semanas_perda[semana])
        perda_semanal.append({'semana': semana.isoformat(), 'perda': perda, 'os': len(semanas_perda[semana]), 'gramas_entrada': entrada, 'gramas_perdidas': perdido})

    acima = []
    for o in pesadas:
        esperado = PERDA_ESPERADA_LIMPEZA if o.limpeza_mesclagem else PERDA_ESPERADA
        perda = _perda(o)
        if perda > esperado:
            # Ordena pelo quanto passou do esperado; no empate, a maior perda primeiro
            acima.append(((round((perda - esperado) * 100, 1), perda), {
                'id': o.id,
                'numero': o.numero,
                'cliente': o.cliente.nome,
                'servico': _nome_servico(o),
                'limpeza_mesclagem': o.limpeza_mesclagem,
                'peso_entrada': o.peso_gramas,
                'peso_final': o.peso_final_gramas,
                'perda': round(perda * 100, 1),
                'esperado': round(esperado * 100),
            }))
    acima.sort(key=lambda item: item[0], reverse=True)

    # ---------- Volume (OS recebidas no período) ----------
    recebidas = list(base.filter(data_criacao__date__gte=inicio, data_criacao__date__lte=fim))
    gramas_recebidas = sum(o.peso_gramas for o in recebidas)

    semanas_volume = defaultdict(lambda: {'gramas': 0, 'os': 0})
    for o in recebidas:
        semana = semanas_volume[_inicio_semana(o.data_criacao)]
        semana['gramas'] += o.peso_gramas
        semana['os'] += 1
    volume_semanal = [{'semana': s.isoformat(), **v} for s, v in sorted(semanas_volume.items())]

    por_servico = defaultdict(lambda: {'os': 0, 'gramas': 0, 'valor': Decimal('0')})
    por_cliente = defaultdict(lambda: {'os': 0, 'gramas': 0, 'valor': Decimal('0')})
    for o in recebidas:
        for grupo, chave in ((por_servico, _nome_servico(o)), (por_cliente, o.cliente.nome)):
            grupo[chave]['os'] += 1
            grupo[chave]['gramas'] += o.peso_gramas
            grupo[chave]['valor'] += o.valor or 0

    def _linhas_volume(grupo):
        return [
            {
                'nome': nome, 'os': v['os'], 'gramas': v['gramas'], 'valor': _dinheiro(v['valor']),
                'valor_por_100g': _dinheiro(v['valor'] / v['gramas'] * 100) if v['gramas'] else None,
            }
            for nome, v in sorted(grupo.items(), key=lambda item: item[1]['gramas'], reverse=True)
        ]

    # ---------- Custo de material ----------
    saidas = SaidaCaixa.objects.filter(tipo='saida', data__gte=inicio, data__lte=fim)
    material = saidas.filter(categoria='material')
    total_material = material.aggregate(total=Sum('valor'))['total'] or Decimal('0')
    material_por_tipo = [
        {
            'tipo': linha['tipo_material'] or 'sem_tipo',
            'nome': TIPO_MATERIAL_LABEL.get(linha['tipo_material'], 'Sem tipo'),
            'valor': _dinheiro(linha['total']),
            'percentual': _pct(float(linha['total']), float(total_material)),
        }
        for linha in material.values('tipo_material').annotate(total=Sum('valor')).order_by('-total')
    ]
    outro = saidas.filter(categoria='outro').aggregate(total=Sum('valor'))
    saidas_outro = {'quantidade': saidas.filter(categoria='outro').count(), 'valor': _dinheiro(outro['total'])}

    faturamento = OrdemServico.objects.filter(
        status='finalizada', faturada=True,
        data_finalizacao__date__gte=inicio, data_finalizacao__date__lte=fim,
    ).aggregate(total=Sum('valor'))['total'] or Decimal('0')

    # ---------- Cabelo nosso ----------
    proprias_recebidas = [o for o in recebidas if o.origem_cabelo == 'proprio']
    proprias_pesadas = [o for o in pesadas if o.origem_cabelo == 'proprio']
    perda_propria, _, _ = _perda_ponderada(proprias_pesadas)
    prejuizo = sum((o.custo_cabelo or 0) * Decimal(str(_perda(o))) for o in proprias_pesadas)

    return Response({
        'periodo': {'inicio': inicio.isoformat(), 'fim': fim.isoformat()},
        'resumo': {
            'gramas_recebidas': gramas_recebidas,
            'os_recebidas': len(recebidas),
            'media_gramas': round(gramas_recebidas / len(recebidas)) if recebidas else None,
            'perda_media': perda_media,
            'perda_media_limpeza': perda_media_limpeza,
            'perda_esperada': round(PERDA_ESPERADA * 100),
            'perda_esperada_limpeza': round(PERDA_ESPERADA_LIMPEZA * 100),
            'os_pesadas': len(pesadas),
            'os_sem_peso_final': len(sem_peso),
            'gasto_material': _dinheiro(total_material),
            'material_por_100g': _dinheiro(total_material / gramas_recebidas * 100) if gramas_recebidas else None,
            'faturamento': _dinheiro(faturamento),
            'material_pct_faturamento': _pct(float(total_material), float(faturamento)),
        },
        'perdas': {
            'semanal': perda_semanal,
            'por_servico': _agrupar_perda(sem_limpeza, _nome_servico),
            'por_estado': _agrupar_perda(sem_limpeza, lambda o: estado_label.get(o.estado_cabelo, (o.estado_cabelo or 'Sem estado').capitalize())),
            'por_origem': _agrupar_perda(sem_limpeza, lambda o: ORIGEM_LABEL.get(o.origem_cabelo, o.origem_cabelo)),
            'acima_do_esperado': [item for _, item in acima[:LIMITE_LISTAS]],
            'total_acima_do_esperado': len(acima),
            'sem_peso_final': [
                {
                    'id': o.id, 'numero': o.numero, 'cliente': o.cliente.nome, 'servico': _nome_servico(o),
                    'peso_entrada': o.peso_gramas, 'tamanho_entrada': o.tamanho_cabelo_cm,
                    'limpeza_mesclagem': o.limpeza_mesclagem,
                    'data_finalizacao': timezone.localtime(o.data_finalizacao).date().isoformat(),
                }
                for o in sorted(sem_peso, key=lambda o: o.data_finalizacao, reverse=True)[:LIMITE_LISTAS]
            ],
        },
        'volume': {
            'semanal': volume_semanal,
            'por_servico': _linhas_volume(por_servico),
            'top_clientes': _linhas_volume(por_cliente)[:5],
        },
        'custo': {
            'por_tipo': material_por_tipo,
            'saidas_outro': saidas_outro,
            'cabelo_proprio': {
                'os': len(proprias_recebidas),
                'gramas': sum(o.peso_gramas for o in proprias_recebidas),
                'custo': _dinheiro(sum((o.custo_cabelo or 0) for o in proprias_recebidas)),
                'perda_media': perda_propria,
                'os_pesadas': len(proprias_pesadas),
                'prejuizo_estimado': _dinheiro(prejuizo),
            },
        },
    })
