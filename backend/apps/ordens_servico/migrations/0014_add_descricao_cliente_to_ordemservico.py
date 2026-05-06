from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordens_servico', '0013_add_status_cancelada'),
    ]

    operations = [
        migrations.AddField(
            model_name='ordemservico',
            name='descricao_cliente',
            field=models.CharField(blank=True, default='', max_length=500, verbose_name='Cliente-Descrição'),
        ),
    ]
