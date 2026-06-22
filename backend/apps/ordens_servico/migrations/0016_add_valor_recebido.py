from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordens_servico', '0015_ordemservico_pagamento_dividido'),
    ]

    operations = [
        migrations.AddField(
            model_name='ordemservico',
            name='valor_recebido',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Valor em dinheiro entregue pelo cliente (para cálculo de troco)',
                max_digits=10,
                null=True,
                verbose_name='Valor Recebido',
            ),
        ),
    ]
