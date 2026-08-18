"""Nota de débitos de parceiro.

O mesmo PDF é usado no download pela tela de Débitos e no envio por WhatsApp,
então a montagem fica aqui em vez de dentro da view.
"""
from io import BytesIO

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from .models import OrdemServico


def formatar_moeda(valor):
    """R$ 1.234,56 — formato brasileiro."""
    return f'R$ {float(valor):,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')


def buscar_debitos(parceiro):
    """OS do parceiro que ainda não foram pagas, da mais antiga para a mais nova."""
    return OrdemServico.objects.filter(
        cliente=parceiro,
        forma_pagamento__isnull=True,
    ).select_related('servico').order_by('data_criacao')


def nome_arquivo(parceiro, extensao='pdf'):
    nome = parceiro.nome.replace(' ', '_')
    return f'nota_debitos_{nome}_{timezone.localtime().strftime("%Y%m%d")}.{extensao}'


def total_debitos(debitos):
    return sum(float(d.valor) if d.valor else 0 for d in debitos)


def gerar_pdf(parceiro, debitos):
    """Monta a nota de débitos em PDF e devolve os bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle('titulo', parent=styles['Title'], fontSize=16, alignment=TA_CENTER)
    subtitulo_style = ParagraphStyle('subtitulo', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER)

    elementos = [
        Paragraph('BARRA CONFECÇÕES LTDA', titulo_style),
        Paragraph('Nota de Débitos — Parceiro', subtitulo_style),
        Spacer(1, 0.5 * cm),
        Paragraph(f'<b>Cliente:</b> {parceiro.nome}', styles['Normal']),
    ]
    if parceiro.cnpj_cpf:
        elementos.append(Paragraph(f'<b>CNPJ/CPF:</b> {parceiro.cnpj_cpf}', styles['Normal']))
    if parceiro.telefone:
        elementos.append(Paragraph(f'<b>Telefone:</b> {parceiro.telefone}', styles['Normal']))
    if parceiro.endereco:
        elementos.append(Paragraph(f'<b>Endereço:</b> {parceiro.endereco}', styles['Normal']))
    elementos.append(Paragraph(
        f'<b>Data de Emissão:</b> {timezone.localtime().strftime("%d/%m/%Y %H:%M")}',
        styles['Normal'],
    ))
    elementos.append(Spacer(1, 0.5 * cm))

    dados = [['Data', 'OS', 'Descrição/Serviço', 'Cliente-Descrição', 'Valor (R$)']]
    total = 0
    for debito in debitos:
        data_str = timezone.localtime(debito.data_criacao).strftime('%d/%m/%Y') if debito.data_criacao else '-'
        descricao = debito.servico.nome if debito.servico else (debito.descricao or '-')
        valor = float(debito.valor) if debito.valor else 0
        total += valor
        dados.append([
            data_str, debito.numero, descricao,
            debito.descricao_cliente or '', formatar_moeda(valor),
        ])

    dados.append(['', '', 'TOTAL:', '', formatar_moeda(total)])

    tabela = Table(dados, colWidths=[2.5 * cm, 2.5 * cm, 6 * cm, 4 * cm, 2.5 * cm])
    tabela.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#366092')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 1), (3, -1), 'LEFT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f5f5f5')]),
    ]))
    elementos.append(tabela)

    doc.build(elementos)
    buffer.seek(0)
    return buffer.getvalue()
