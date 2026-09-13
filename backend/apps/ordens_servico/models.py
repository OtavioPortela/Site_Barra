from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Cliente(models.Model):
    """Modelo para armazenar informações dos clientes."""
    nome = models.CharField(max_length=200)
    cnpj_cpf = models.CharField(max_length=18, blank=True, null=True)
    email = models.EmailField(blank=True)
    telefone = models.CharField(max_length=20)
    endereco = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    eh_parceiro = models.BooleanField(
        default=False,
        verbose_name='É Parceiro',
        help_text='Indica se o cliente tem vínculo de parceiro (pode deixar pendurado na conta)'
    )
    data_cadastro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['-data_cadastro']

    def __str__(self):
        return f"{self.nome} ({self.cnpj_cpf})"


class OrdemServico(models.Model):
    """Modelo para armazenar ordens de serviço."""
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('em_desenvolvimento', 'Em Desenvolvimento'),
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
    ]

    TIPO_CABELO_CHOICES = [
    ('liso', 'Liso'),
    ('ondulado', 'Ondulado'),
    ('cacheado', 'Cacheado'),
    ('crespo', 'Crespo'),
    ]
    ESTADO_CABELO_CHOICES = [
    ('novo', 'Novo'),
    ('descolorido', 'Descolorido'),
    ('branco', 'Branco'),
    ('preto', 'Preto'),
    ('castanho', 'Castanho'),
    ('rubro', 'Rubro'),
    ('loiro', 'Loiro'),
    ('pintado', 'Pintado'),
    ]
    numero = models.CharField(max_length=20, unique=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='ordens_servico')
    descricao = models.TextField(blank=True, default='')
    descricao_cliente = models.CharField(max_length=500, blank=True, default='', verbose_name='Cliente-Descrição')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    estado_cabelo = models.CharField(
    max_length=20,
    choices=ESTADO_CABELO_CHOICES,
    default='novo',
    verbose_name='Estado do Cabelo'
    )
    tipo_cabelo = models.CharField(
        max_length=20,
        choices=TIPO_CABELO_CHOICES,
        default='liso',
        verbose_name='Tipo de Cabelo'
    )
    cor_cabelo = models.CharField(
        max_length=50,
        default='',
        verbose_name='Cor do Cabelo'
    )
    peso_gramas = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name='Peso (em gramas)'
    )
    tamanho_cabelo_cm = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name='Tamanho do Cabelo (cm)'
    )
    cor_linha = models.CharField(
        max_length=50,
        default='',
        verbose_name='Cor da Linha'
    )
    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    servico = models.ForeignKey(
        'Servico',  # Usa string porque Servico está definido depois
        on_delete=models.PROTECT,
        related_name='ordens_servico',
        verbose_name='Serviço',
        null=True,
        blank=True
    )
    valor_metro = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name='Valor por Metro (R$)',
        help_text='Valor em reais por metro'
    )
    # Agenda: quem está com a OS e quando começou/terminou
    responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='os_responsavel',
        verbose_name='Responsável',
        help_text='Funcionário que assumiu a OS ao movê-la para Em Desenvolvimento',
    )
    inicio_trabalho = models.DateTimeField(null=True, blank=True, verbose_name='Início do trabalho')
    finalizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='os_finalizadas_por',
        verbose_name='Finalizado por',
    )

    # Controle de material/perdas (painel Material)
    ORIGEM_CABELO_CHOICES = [
        ('cliente', 'Da cliente'),
        ('proprio', 'Nosso'),
    ]
    origem_cabelo = models.CharField(
        max_length=10,
        choices=ORIGEM_CABELO_CHOICES,
        default='cliente',
        verbose_name='Origem do cabelo',
    )
    custo_cabelo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        verbose_name='Custo do cabelo (R$)',
        help_text='Quanto a Barra pagou pelo cabelo quando a origem é própria',
    )
    limpeza_mesclagem = models.BooleanField(
        default=False,
        verbose_name='Limpeza/mesclagem autorizada',
        help_text='Com limpeza/mesclagem a perda esperada é de até 40% (sem, 20%)',
    )
    peso_final_gramas = models.IntegerField(
        validators=[MinValueValidator(1)],
        null=True,
        blank=True,
        verbose_name='Peso final (g)',
    )
    tamanho_final_cm = models.IntegerField(
        validators=[MinValueValidator(1)],
        null=True,
        blank=True,
        verbose_name='Tamanho final (cm)',
    )
    exige_peso_final = models.BooleanField(
        default=True,
        verbose_name='Exige peso final ao finalizar',
        help_text='Falso nas OS criadas antes do controle de perdas (podem informar depois)',
    )

    data_criacao = models.DateTimeField(auto_now_add=True)
    prazo_entrega = models.DateTimeField()
    data_finalizacao = models.DateTimeField(null=True, blank=True)
    faturada = models.BooleanField(default=False, verbose_name='Faturada')
    data_faturamento = models.DateTimeField(null=True, blank=True, verbose_name='Data de Faturamento')
    observacoes = models.TextField(blank=True)
    entregue = models.BooleanField(default=False, verbose_name='Entregue')
    pago_na_entrega = models.BooleanField(
        default=False,
        verbose_name='Pago na Entrega',
        help_text='Indica se a OS já foi paga na entrega'
    )
    FORMA_PAGAMENTO_CHOICES = [
        ('dinheiro', 'Dinheiro'),
        ('pix', 'PIX'),
        ('cartao_credito', 'Cartão de Crédito'),
        ('cartao_debito', 'Cartão de Débito'),
    ]
    forma_pagamento = models.CharField(
        max_length=20,
        choices=FORMA_PAGAMENTO_CHOICES,
        blank=True,
        null=True,
        verbose_name='Forma de Pagamento',
        help_text='Forma de pagamento utilizada na OS'
    )
    forma_pagamento_2 = models.CharField(
        max_length=20,
        choices=FORMA_PAGAMENTO_CHOICES,
        blank=True,
        null=True,
        verbose_name='Segunda Forma de Pagamento',
    )
    valor_pagamento_1 = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name='Valor — Forma 1',
    )
    valor_pagamento_2 = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name='Valor — Forma 2',
    )
    valor_recebido = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name='Valor Recebido',
        help_text='Valor em dinheiro entregue pelo cliente (para cálculo de troco)',
    )
    foto_entrega = models.ImageField(
        upload_to='fotos_entrega/',
        blank=True,
        null=True,
        verbose_name='Foto da Entrega',
        help_text='Foto comprovando a entrega da ordem de serviço'
    )
    usuario_criacao = models.ForeignKey(
        'authentication.Usuario',
        on_delete=models.PROTECT,
        related_name='ordens_criadas'
    )

    class Meta:
        ordering = ['-data_criacao']
        verbose_name = 'Ordem de Serviço'
        verbose_name_plural = 'Ordens de Serviço'

    def __str__(self):
        return f"OS {self.numero} - {self.cliente.nome}"

    @property
    def cliente_nome(self):
        """Retorna o nome do cliente para serialização."""
        return self.cliente.nome

class AlteracaoOS(models.Model):
    """
    Registro permanente de cada correção feita numa OS depois de faturada:
    quem fez, quando, o que era antes, o que ficou depois e por quê.
    """
    ACAO_CHOICES = [
        ('corrigir_pagamento', 'Pagamento corrigido'),
        ('estornar_faturamento', 'Faturamento estornado'),
        ('cancelar_faturada', 'OS faturada cancelada'),
    ]

    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='alteracoes')
    acao = models.CharField(max_length=30, choices=ACAO_CHOICES)
    motivo = models.TextField()
    dados_antes = models.JSONField(default=dict)
    dados_depois = models.JSONField(default=dict)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='alteracoes_os',
    )
    data = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data', '-id']
        verbose_name = 'Alteração de OS'
        verbose_name_plural = 'Alterações de OS'

    def __str__(self):
        return f"{self.ordem_servico.numero} — {self.get_acao_display()} em {self.data:%d/%m/%Y %H:%M}"


class Servico(models.Model):
    """Modelo para armazenar serviços"""
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Serviço'
        verbose_name_plural = 'Serviços'
        ordering = ['nome']

    def __str__(self):
        return self.nome



class EstadoCabelo(models.Model):
    """Modelo para armazenar opções de estado do cabelo."""
    nome = models.CharField(max_length=50, unique=True)
    valor = models.CharField(max_length=50, unique=True, help_text='Valor usado no banco (ex: novo, descolorido)')
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição')
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Estado do Cabelo'
        verbose_name_plural = 'Estados do Cabelo'
        ordering = ['ordem', 'nome']

    def __str__(self):
        return self.nome


class TipoCabelo(models.Model):
    """Modelo para armazenar opções de tipo de cabelo."""
    nome = models.CharField(max_length=50, unique=True)
    valor = models.CharField(max_length=50, unique=True, help_text='Valor usado no banco (ex: liso, ondulado)')
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição')
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Tipo de Cabelo'
        verbose_name_plural = 'Tipos de Cabelo'
        ordering = ['ordem', 'nome']

    def __str__(self):
        return self.nome


class CorCabelo(models.Model):
    """Modelo para armazenar opções de cor do cabelo."""
    nome = models.CharField(max_length=50, unique=True)
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição')
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Cor do Cabelo'
        verbose_name_plural = 'Cores do Cabelo'
        ordering = ['ordem', 'nome']

    def __str__(self):
        return self.nome


class CorLinha(models.Model):
    """Modelo para armazenar opções de cor da linha."""
    nome = models.CharField(max_length=50, unique=True)
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição')
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Cor da Linha'
        verbose_name_plural = 'Cores da Linha'
        ordering = ['ordem', 'nome']

    def __str__(self):
        return self.nome
