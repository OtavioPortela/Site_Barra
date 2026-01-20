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
    data_criacao = models.DateTimeField(auto_now_add=True)
    prazo_entrega = models.DateField()
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


class ItemOrdemServico(models.Model):
    """Modelo opcional para itens de uma ordem de serviço."""
    ordem_servico = models.ForeignKey(
        OrdemServico,
        related_name='itens',
        on_delete=models.CASCADE
    )
    descricao = models.CharField(max_length=200)
    quantidade = models.IntegerField(validators=[MinValueValidator(1)])
    valor_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    valor_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        verbose_name = 'Item de Ordem de Serviço'
        verbose_name_plural = 'Itens de Ordens de Serviço'

    def __str__(self):
        return f"{self.descricao} - OS {self.ordem_servico.numero}"

    def save(self, *args, **kwargs):
        """Calcula valor_total automaticamente."""
        self.valor_total = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)


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

