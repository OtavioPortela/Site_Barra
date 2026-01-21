# Generated manually - Migration idempotente para garantir que o campo eh_parceiro existe

from django.db import migrations, models


def add_field_if_not_exists(apps, schema_editor):
    """Adiciona o campo eh_parceiro se ele não existir na tabela"""
    db_table = 'ordens_servico_cliente'
    field_name = 'eh_parceiro'

    # Verifica se o campo já existe
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name=%s AND column_name=%s
        """, [db_table, field_name])

        exists = cursor.fetchone() is not None

    # Se o campo não existe, adiciona usando schema_editor
    if not exists:
        Cliente = apps.get_model('ordens_servico', 'Cliente')
        field = models.BooleanField(
            default=False,
            verbose_name='É Parceiro',
            help_text='Indica se o cliente tem vínculo de parceiro (pode deixar pendurado na conta)'
        )
        field.set_attributes_from_name('eh_parceiro')
        schema_editor.add_field(Cliente, field)


def remove_field_if_exists(apps, schema_editor):
    """Remove o campo eh_parceiro se ele existir (para reversão)"""
    db_table = 'ordens_servico_cliente'
    field_name = 'eh_parceiro'

    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name=%s AND column_name=%s
        """, [db_table, field_name])

        exists = cursor.fetchone() is not None

    if exists:
        Cliente = apps.get_model('ordens_servico', 'Cliente')
        field = Cliente._meta.get_field('eh_parceiro')
        schema_editor.remove_field(Cliente, field)


class Migration(migrations.Migration):

    dependencies = [
        ('ordens_servico', '0011_add_eh_parceiro_to_cliente'),
    ]

    operations = [
        migrations.RunPython(
            add_field_if_not_exists,
            reverse_code=remove_field_if_exists,
            atomic=True,
        ),
    ]

