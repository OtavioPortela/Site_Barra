"""
Correções de OS faturada (só patrão, com PIN e motivo).

Decisões de negócio:
- Só o pagamento pode ser corrigido; valor total errado se resolve estornando e faturando de novo.
- A correção mantém a OS no mesmo dia do Caixa (a data de faturamento não muda).
- O estorno apaga o pagamento: ao faturar de novo, ele é informado outra vez.
- Toda correção grava um AlteracaoOS com o antes, o depois e o motivo.
"""
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.utils import timezone

from apps.faturamento.models import ConfiguracaoEmpresa
from .models import AlteracaoOS, OrdemServico

FORMAS_VALIDAS = {valor for valor, _ in OrdemServico.FORMA_PAGAMENTO_CHOICES}
CAMPOS_PAGAMENTO = ('forma_pagamento', 'forma_pagamento_2', 'valor_pagamento_1', 'valor_pagamento_2', 'valor_recebido')


class ErroCorrecao(Exception):
    def __init__(self, mensagem, status=400, campo=None):
        super().__init__(mensagem)
        self.mensagem = mensagem
        self.status = status
        self.campo = campo


def validar_pin_e_motivo(dados):
    pin_empresa = ConfiguracaoEmpresa.get().pin_faturamento
    if pin_empresa and str(dados.get('pin') or '') != pin_empresa:
        raise ErroCorrecao('PIN incorreto.', status=403, campo='pin')
    motivo = (dados.get('motivo') or '').strip()
    if len(motivo) < 3:
        raise ErroCorrecao('Informe o motivo da correção.', campo='motivo')
    return motivo


def _texto(valor):
    return None if valor is None else str(valor)


def fotografia(ordem):
    """Estado financeiro da OS, guardado antes e depois de cada correção."""
    return {
        'status': ordem.status,
        'faturada': ordem.faturada,
        'data_faturamento': ordem.data_faturamento.isoformat() if ordem.data_faturamento else None,
        'valor': _texto(ordem.valor),
        **{campo: _texto(getattr(ordem, campo)) for campo in CAMPOS_PAGAMENTO},
    }


def _decimal(valor, campo):
    if valor in (None, ''):
        return None
    try:
        return Decimal(str(valor)).quantize(Decimal('0.01'))
    except (InvalidOperation, ValueError):
        raise ErroCorrecao('Valor inválido.', campo=campo)


def _exigir_faturada(ordem):
    if not ordem.faturada:
        raise ErroCorrecao('Esta OS não está faturada.')


def _registrar(ordem, acao, motivo, antes, usuario):
    return AlteracaoOS.objects.create(
        ordem_servico=ordem, acao=acao, motivo=motivo,
        dados_antes=antes, dados_depois=fotografia(ordem), usuario=usuario,
    )


def calcular_pagamento(ordem, dados):
    """Valida e normaliza o novo pagamento com as mesmas regras do fechamento da nota."""
    forma = dados.get('forma_pagamento') or None
    forma_2 = dados.get('forma_pagamento_2') or None
    eh_parceiro = bool(ordem.cliente and ordem.cliente.eh_parceiro)
    total = ordem.valor

    if forma is None and not eh_parceiro:
        raise ErroCorrecao('Escolha a forma de pagamento.', campo='forma_pagamento')
    if forma is not None and forma not in FORMAS_VALIDAS:
        raise ErroCorrecao('Forma de pagamento inválida.', campo='forma_pagamento')

    novo = {campo: None for campo in CAMPOS_PAGAMENTO}
    novo['forma_pagamento'] = forma

    if forma_2:
        if forma is None:
            raise ErroCorrecao('Escolha a primeira forma de pagamento.', campo='forma_pagamento')
        if forma_2 not in FORMAS_VALIDAS:
            raise ErroCorrecao('Segunda forma de pagamento inválida.', campo='forma_pagamento_2')
        if forma_2 == forma:
            raise ErroCorrecao('As duas formas de pagamento precisam ser diferentes.', campo='forma_pagamento_2')
        v1 = _decimal(dados.get('valor_pagamento_1'), 'valor_pagamento_1')
        if v1 is None or v1 <= 0 or v1 >= total:
            raise ErroCorrecao(
                f'O valor da primeira forma deve ficar entre R$ 0,01 e R$ {(total - Decimal("0.01")):.2f}.'.replace('.', ','),
                campo='valor_pagamento_1',
            )
        novo.update(forma_pagamento_2=forma_2, valor_pagamento_1=v1, valor_pagamento_2=total - v1)

    if forma == 'dinheiro':
        recebido = _decimal(dados.get('valor_recebido'), 'valor_recebido')
        if recebido is not None:
            base = novo['valor_pagamento_1'] if novo['valor_pagamento_1'] is not None else total
            if recebido < base:
                raise ErroCorrecao('O valor recebido não pode ser menor que o valor em dinheiro.', campo='valor_recebido')
            novo['valor_recebido'] = recebido
    return novo


@transaction.atomic
def corrigir_pagamento(ordem, dados, usuario):
    _exigir_faturada(ordem)
    motivo = validar_pin_e_motivo(dados)
    novo = calcular_pagamento(ordem, dados)
    antes = fotografia(ordem)
    if all(_texto(getattr(ordem, campo)) == _texto(valor) for campo, valor in novo.items()):
        raise ErroCorrecao('O pagamento informado é igual ao atual.')
    for campo, valor in novo.items():
        setattr(ordem, campo, valor)
    ordem.save(update_fields=list(novo.keys()))
    return _registrar(ordem, 'corrigir_pagamento', motivo, antes, usuario)


def _limpar_faturamento(ordem):
    ordem.faturada = False
    ordem.data_faturamento = None
    for campo in CAMPOS_PAGAMENTO:
        setattr(ordem, campo, None)


@transaction.atomic
def estornar_faturamento(ordem, dados, usuario):
    _exigir_faturada(ordem)
    motivo = validar_pin_e_motivo(dados)
    antes = fotografia(ordem)
    _limpar_faturamento(ordem)
    ordem.save(update_fields=['faturada', 'data_faturamento', *CAMPOS_PAGAMENTO])
    return _registrar(ordem, 'estornar_faturamento', motivo, antes, usuario)


@transaction.atomic
def cancelar_faturada(ordem, dados, usuario):
    _exigir_faturada(ordem)
    motivo = validar_pin_e_motivo(dados)
    antes = fotografia(ordem)
    _limpar_faturamento(ordem)
    ordem.status = 'cancelada'
    data = timezone.localtime().strftime('%d/%m/%Y')
    ordem.observacoes = f'[CANCELADA em {data}] Motivo: {motivo}' + (f'\n\n{ordem.observacoes}' if ordem.observacoes else '')
    ordem.save(update_fields=['faturada', 'data_faturamento', 'status', 'observacoes', *CAMPOS_PAGAMENTO])
    return _registrar(ordem, 'cancelar_faturada', motivo, antes, usuario)
