#!/bin/bash

set -e

echo "Aguardando PostgreSQL..."

# Aguardar até o PostgreSQL estar pronto
until nc -z db 5432; do
  echo "PostgreSQL não está disponível ainda - aguardando..."
  sleep 1
done

echo "PostgreSQL iniciado!"

# Executar migrações
echo "Executando migrações..."
python manage.py makemigrations --noinput || true
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

# Executar comando passado como argumento
exec "$@"

