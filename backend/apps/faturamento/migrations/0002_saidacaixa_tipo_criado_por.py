from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('faturamento', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='saidacaixa',
            name='tipo',
            field=models.CharField(
                choices=[('saida', 'Saída'), ('entrada', 'Entrada')],
                default='saida',
                max_length=10,
                verbose_name='Tipo',
            ),
        ),
        migrations.AddField(
            model_name='saidacaixa',
            name='criado_por',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='lancamentos_caixa',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Registrado por',
            ),
        ),
    ]
