#!/bin/bash

set -e

echo "Aguardando PostgreSQL..."

# Função para extrair host da DATABASE_URL
extract_db_host() {
    if [ -n "$DATABASE_URL" ]; then
        # Extrair host da URL: postgres://user:pass@HOST:port/db
        echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p'
    else
        echo "${PGHOST:-${DATABASE_HOST:-db}}"
    fi
}

# Função para extrair porta da DATABASE_URL
extract_db_port() {
    if [ -n "$DATABASE_URL" ]; then
        # Extrair porta da URL: postgres://user:pass@host:PORT/db
        # Se não tiver porta explícita, assume 5432
        port=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
        echo "${port:-5432}"
    else
        echo "${PGPORT:-${DATABASE_PORT:-5432}}"
    fi
}

DB_HOST=$(extract_db_host)
DB_PORT=$(extract_db_port)

echo "Tentando conectar ao banco em ${DB_HOST}:${DB_PORT}..."

# Aguardar até o PostgreSQL estar pronto
until nc -z ${DB_HOST} ${DB_PORT}; do
  echo "PostgreSQL não está disponível ainda - aguardando... (${DB_HOST}:${DB_PORT})"
  sleep 1
done

echo "PostgreSQL iniciado!"

# Executar migrações
echo "Executando migrações..."
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# Criar superusuário se não existir
echo "Verificando superusuário..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
import os

User = get_user_model()
email = os.environ.get('SUPERUSER_EMAIL', 'admin@barraconfeccoes.com')
password = os.environ.get('SUPERUSER_PASSWORD', 'admin123')

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        username='admin',
        email=email,
        password=password,
        nome_completo='Administrador'
    )
    print(f'Superusuário criado: {email}')
else:
    print(f'Superusuário já existe: {email}')
EOF

echo "Iniciando servidor..."

# Obter porta do Railway (padrão 8000)
PORT_VALUE="${PORT:-8000}"
echo "=========================================="
echo "PORT VARIABLE: ${PORT:-not set}"
echo "USING PORT: $PORT_VALUE"
echo "=========================================="

# Se recebeu argumentos, usar eles, senão usar padrão
if [ $# -gt 0 ]; then
    # Substituir $PORT no comando se existir
    CMD="$@"
    CMD=$(echo "$CMD" | sed "s/\$PORT/$PORT_VALUE/g")
    echo "Executando: $CMD"
    exec bash -c "$CMD"
else
    # Sem argumentos, usar comando padrão
    echo "Executando gunicorn padrão na porta $PORT_VALUE"
    # Aumentar timeout e adicionar configurações para Railway
    exec gunicorn \
        --bind 0.0.0.0:$PORT_VALUE \
        --workers 3 \
        --timeout 120 \
        --keep-alive 5 \
        --max-requests 1000 \
        --max-requests-jitter 100 \
        --access-logfile - \
        --error-logfile - \
        --log-level info \
        core.wsgi:application
fi
