from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ConfiguracaoEmpresa',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(default='Barra Confecções', max_length=200)),
                ('cnpj', models.CharField(blank=True, default='', max_length=18)),
                ('email', models.EmailField(blank=True, default='', max_length=254)),
                ('telefone', models.CharField(blank=True, default='', max_length=20)),
                ('endereco', models.TextField(blank=True, default='')),
            ],
            options={
                'verbose_name': 'Configuração da Empresa',
                'verbose_name_plural': 'Configurações da Empresa',
            },
        ),
        migrations.CreateModel(
            name='SaidaCaixa',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descricao', models.CharField(max_length=255)),
                ('valor', models.DecimalField(
                    decimal_places=2,
                    max_digits=10,
                    validators=[django.core.validators.MinValueValidator(0)],
                )),
                ('categoria', models.CharField(
                    choices=[
                        ('aluguel', 'Aluguel'),
                        ('material', 'Material'),
                        ('salario', 'Salário'),
                        ('energia', 'Energia/Água'),
                        ('equipamento', 'Equipamento'),
                        ('marketing', 'Marketing'),
                        ('outro', 'Outro'),
                    ],
                    default='outro',
                    max_length=20,
                )),
                ('data', models.DateField()),
                ('observacoes', models.TextField(blank=True, default='')),
                ('data_criacao', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Saída de Caixa',
                'verbose_name_plural': 'Saídas de Caixa',
                'ordering': ['-data', '-data_criacao'],
            },
        ),
    ]
