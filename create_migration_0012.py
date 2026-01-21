#!/usr/bin/env python3
"""
Script para criar migration idempotente que garante o campo eh_parceiro
Execute este script com: python3 create_migration_0012.py
"""

migration_content = '''# Generated manually - Migration idempotente para garantir que o campo eh_parceiro existe

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
'''

import os
import sys

migration_path = 'backend/apps/ordens_servico/migrations/0012_ensure_eh_parceiro_field.py'

try:
    with open(migration_path, 'w') as f:
        f.write(migration_content)
    print(f"✅ Migration criada com sucesso em: {migration_path}")
    print("\nPróximos passos:")
    print("1. Verifique o arquivo criado")
    print("2. git add backend/apps/ordens_servico/migrations/0012_*.py")
    print("3. git commit -m 'Adiciona migration idempotente para campo eh_parceiro'")
    print("4. git push origin main")
    print("5. Faça deploy no Railway")
except PermissionError:
    print(f"❌ Erro de permissão ao criar {migration_path}")
    print("\nExecute o script com sudo ou corrija as permissões:")
    print("sudo python3 create_migration_0012.py")
    print("\nOu execute o script fix_migrations.sh:")
    print("bash fix_migrations.sh")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao criar migration: {e}")
    sys.exit(1)

