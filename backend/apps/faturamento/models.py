from django.db import models
from django.core.validators import MinValueValidator


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

    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='outro')
    data = models.DateField()
    observacoes = models.TextField(blank=True, default='')
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data', '-data_criacao']
        verbose_name = 'Saída de Caixa'
        verbose_name_plural = 'Saídas de Caixa'

    def __str__(self):
        return f"{self.descricao} — R$ {self.valor} ({self.data})"
