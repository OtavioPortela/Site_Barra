#!/bin/bash
# Script para corrigir permissões e criar migration idempotente

echo "Corrigindo permissões das migrations..."
sudo chown -R $USER:$USER backend/apps/ordens_servico/migrations/

echo "Criando migration idempotente..."
cat > backend/apps/ordens_servico/migrations/0012_ensure_eh_parceiro_field.py << 'EOFMIGRATION'
# Generated manually - Migration idempotente para garantir que o campo eh_parceiro existe

from django.db import migrations


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

    # Se o campo não existe, adiciona
    if not exists:
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(f"""
                ALTER TABLE {db_table}
                ADD COLUMN {field_name} BOOLEAN DEFAULT FALSE NOT NULL;
                ALTER TABLE {db_table}
                ALTER COLUMN {field_name} DROP DEFAULT;
            """)
            # Adiciona comentário na coluna (PostgreSQL)
            try:
                cursor.execute(f"""
                    COMMENT ON COLUMN {db_table}.{field_name} IS
                    'Indica se o cliente tem vínculo de parceiro (pode deixar pendurado na conta)';
                """)
            except:
                pass  # Ignora se não conseguir adicionar comentário


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
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(f"ALTER TABLE {db_table} DROP COLUMN {field_name};")


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
EOFMIGRATION

echo "Migration criada! Agora você pode fazer commit e push."
echo "Execute: git add backend/apps/ordens_servico/migrations/0012_*.py"
echo "Execute: git commit -m 'Adiciona migration idempotente para campo eh_parceiro'"
echo "Execute: git push origin main"

