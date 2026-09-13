"""
Agenda: quem está com cada OS e em que horário trabalhou nela.

Regras de responsabilidade (aplicadas em toda mudança de status):
- Pendente -> Em desenvolvimento: quem moveu assume (se ainda não houver responsável) e o início é gravado.
- Qualquer status -> Pendente: a OS volta para "A fazer", sem responsável e sem início.
- -> Finalizada: grava quem finalizou; se ninguém tinha assumido, quem finalizou vira o responsável.
- Finalizada -> Em desenvolvimento: desfaz o "finalizado por", mantendo responsável e início.
"""
from datetime import datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import OrdemServico

DURACAO_SEM_INICIO = timedelta(minutes=30)
MAX_DIAS = 62


def aplicar_transicao(ordem, anterior, novo, usuario):
    if anterior == novo:
        return
    agora = timezone.now()
    if novo == 'pendente':
        ordem.responsavel = None
        ordem.inicio_trabalho = None
        ordem.finalizado_por = None
    elif novo == 'em_desenvolvimento':
        if anterior == 'finalizada':
            ordem.finalizado_por = None
        else:
            if ordem.responsavel_id is None:
                ordem.responsavel = usuario
            if ordem.inicio_trabalho is None:
                ordem.inicio_trabalho = agora
    elif novo == 'finalizada':
        ordem.finalizado_por = usuario
        if ordem.responsavel_id is None:
            ordem.responsavel = usuario


def pode_mover_prazo(ordem, usuario):
    """Mesma regra de edição da OS: patrão, ou quem criou; nunca faturada/finalizada/cancelada."""
    if ordem.faturada or ordem.status not in ('pendente', 'em_desenvolvimento'):
        return False
    return bool(usuario.is_staff or ordem.usuario_criacao_id == usuario.id)


def iniciais(nome):
    partes = [p for p in (nome or '').replace('@', ' ').replace('.', ' ').split() if p]
    return ''.join(p[0].upper() for p in partes[:2]) or '?'


def _pessoa(usuario):
    if usuario is None:
        return None
    nome = usuario.nome_completo or usuario.email
    return {'id': usuario.id, 'nome': nome, 'iniciais': iniciais(nome)}


def _iso(dt):
    return timezone.localtime(dt).isoformat() if dt else None


def _item(ordem, usuario, agora):
    atrasada = ordem.status in ('pendente', 'em_desenvolvimento') and ordem.prazo_entrega < agora
    item = {
        'id': ordem.id,
        'numero': ordem.numero,
        'cliente': ordem.cliente.nome if ordem.cliente else '',
        'servico': ordem.servico.nome if ordem.servico else '',
        'descricao': ordem.descricao,
        'status': ordem.status,
        'faturada': ordem.faturada,
        'atrasada': atrasada,
        'prazo': _iso(ordem.prazo_entrega),
        'responsavel': _pessoa(ordem.responsavel),
        'finalizado_por': _pessoa(ordem.finalizado_por),
        'criado_por': _pessoa(ordem.usuario_criacao),
        'data_criacao': _iso(ordem.data_criacao),
        'inicio': None,
        'fim': None,
        'peso_gramas': ordem.peso_gramas,
        'exige_peso_final': ordem.exige_peso_final,
        'limpeza_mesclagem': ordem.limpeza_mesclagem,
        'tamanho_cabelo_cm': ordem.tamanho_cabelo_cm,
        'pode_mover': pode_mover_prazo(ordem, usuario),
    }
    # Valores só para o patrão (funcionário vê as faturadas, mas sem dinheiro)
    if usuario.is_staff:
        item['valor'] = float(ordem.valor)
    return item


def _periodo(request):
    hoje = timezone.localdate()
    inicio_txt = request.query_params.get('inicio')
    fim_txt = request.query_params.get('fim')
    inicio = datetime.strptime(inicio_txt, '%Y-%m-%d').date() if inicio_txt else hoje - timedelta(days=hoje.weekday())
    fim = datetime.strptime(fim_txt, '%Y-%m-%d').date() if fim_txt else inicio + timedelta(days=6)
    if fim < inicio:
        raise ValueError('A data final não pode ser antes da inicial.')
    if (fim - inicio).days > MAX_DIAS:
        raise ValueError(f'O período máximo é de {MAX_DIAS} dias.')
    return inicio, fim


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agenda_view(request):
    try:
        inicio, fim = _periodo(request)
    except ValueError as erro:
        return Response({'error': f'Período inválido: {erro}'}, status=status.HTTP_400_BAD_REQUEST)

    tz = timezone.get_current_timezone()
    comeco = timezone.make_aware(datetime.combine(inicio, time.min), tz)
    final = timezone.make_aware(datetime.combine(fim + timedelta(days=1), time.min), tz)
    agora = timezone.now()
    usuario = request.user
    filtro = request.query_params.get('responsavel', 'todos')

    base = (
        OrdemServico.objects.exclude(status='cancelada')
        .select_related('cliente', 'servico', 'responsavel', 'finalizado_por', 'usuario_criacao')
    )

    # A fazer: pendentes que vencem no período (aparecem para qualquer profissional selecionado)
    a_fazer = [
        _item(o, usuario, agora)
        for o in base.filter(status='pendente', prazo_entrega__gte=comeco, prazo_entrega__lt=final).order_by('prazo_entrega')
    ]

    # Blocos: em andamento até agora e finalizadas do início ao fim
    candidatos = base.filter(
        Q(status='em_desenvolvimento') |
        Q(status='finalizada', data_finalizacao__gte=comeco, data_finalizacao__lt=final)
    )
    if filtro == 'sem':
        candidatos = candidatos.filter(responsavel__isnull=True)
    elif filtro not in ('todos', '', None):
        try:
            candidatos = candidatos.filter(responsavel_id=int(filtro))
        except ValueError:
            return Response({'error': 'Profissional inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    blocos = []
    for ordem in candidatos:
        if ordem.status == 'em_desenvolvimento':
            if ordem.inicio_trabalho is None:
                # OS começada antes da agenda: sem horário real, entra como aviso no dia de hoje
                if comeco <= agora < final:
                    item = _item(ordem, usuario, agora)
                    item['sem_horario_inicio'] = True
                    blocos.append(item)
                continue
            bloco_inicio = ordem.inicio_trabalho
            bloco_fim = agora
        else:
            bloco_fim = ordem.data_finalizacao
            bloco_inicio = ordem.inicio_trabalho if ordem.inicio_trabalho and ordem.inicio_trabalho < bloco_fim else bloco_fim - DURACAO_SEM_INICIO
        if bloco_fim <= comeco or bloco_inicio >= final:
            continue
        item = _item(ordem, usuario, agora)
        item['inicio'] = _iso(bloco_inicio)
        item['fim'] = _iso(bloco_fim)
        item['sem_horario_inicio'] = ordem.inicio_trabalho is None
        blocos.append(item)
    blocos.sort(key=lambda b: b['inicio'] or '')

    Usuario = get_user_model()
    em_andamento = base.filter(status='em_desenvolvimento')
    profissionais = [
        {
            **_pessoa(u),
            'is_staff': u.is_staff,
            'em_andamento': em_andamento.filter(responsavel=u).count(),
            'atrasadas': em_andamento.filter(responsavel=u, prazo_entrega__lt=agora).count(),
        }
        for u in Usuario.objects.filter(is_active=True, ativo=True).order_by('-is_staff', 'nome_completo')
    ]

    return Response({
        'periodo': {'inicio': inicio.isoformat(), 'fim': fim.isoformat()},
        'agora': _iso(agora),
        'profissionais': profissionais,
        'a_fazer': a_fazer,
        'blocos': blocos,
    })
