from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings


class ConfiguracaoEmpresa(models.Model):
    """Configurações gerais da empresa (singleton — sempre id=1)."""
    nome = models.CharField(max_length=200, default='Barra Confecções')
    cnpj = models.CharField(max_length=18, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    telefone = models.CharField(max_length=20, blank=True, default='')
    endereco = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Configuração da Empresa'
        verbose_name_plural = 'Configurações da Empresa'

    def __str__(self):
        return self.nome

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class SaidaCaixa(models.Model):
    CATEGORIA_CHOICES = [
        ('aluguel', 'Aluguel'),
        ('material', 'Material'),
        ('salario', 'Salário'),
        ('energia', 'Energia/Água'),
        ('equipamento', 'Equipamento'),
        ('marketing', 'Marketing'),
        ('outro', 'Outro'),
    ]

    TIPO_CHOICES = [
        ('saida', 'Saída'),
        ('entrada', 'Entrada'),
    ]

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='saida', verbose_name='Tipo')
    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='outro')
    data = models.DateField()
    observacoes = models.TextField(blank=True, default='')
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lancamentos_caixa',
        verbose_name='Registrado por',
    )
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data', '-data_criacao']
        verbose_name = 'Lançamento de Caixa'
        verbose_name_plural = 'Lançamentos de Caixa'

    def __str__(self):
        return f"[{self.get_tipo_display()}] {self.descricao} — R$ {self.valor} ({self.data})"
