from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordens_servico', '0014_add_descricao_cliente_to_ordemservico'),
    ]

    operations = [
        migrations.AddField(
            model_name='ordemservico',
            name='forma_pagamento_2',
            field=models.CharField(
                blank=True, null=True, max_length=20,
                choices=[
                    ('dinheiro', 'Dinheiro'),
                    ('pix', 'PIX'),
                    ('cartao_credito', 'Cartão de Crédito'),
                    ('cartao_debito', 'Cartão de Débito'),
                ],
                verbose_name='Segunda Forma de Pagamento',
            ),
        ),
        migrations.AddField(
            model_name='ordemservico',
            name='valor_pagamento_1',
            field=models.DecimalField(
                blank=True, null=True, max_digits=10, decimal_places=2,
                verbose_name='Valor — Forma 1',
            ),
        ),
        migrations.AddField(
            model_name='ordemservico',
            name='valor_pagamento_2',
            field=models.DecimalField(
                blank=True, null=True, max_digits=10, decimal_places=2,
                verbose_name='Valor — Forma 2',
            ),
        ),
    ]
