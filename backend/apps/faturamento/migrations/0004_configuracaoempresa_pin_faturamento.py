from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('faturamento', '0003_alter_saidacaixa_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracaoempresa',
            name='pin_faturamento',
            field=models.CharField(blank=True, default='', max_length=6, verbose_name='PIN do Faturamento'),
        ),
    ]
