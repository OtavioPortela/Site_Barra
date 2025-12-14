#!/bin/bash

set -e

echo "Aguardando PostgreSQL..."

# Aguardar até o PostgreSQL estar pronto
# Usar variáveis de ambiente do Railway
until nc -z ${DATABASE_HOST} ${DATABASE_PORT:-5432}; do
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

# Obter porta do Railway (padrão 8000)
PORT_VALUE="${PORT:-8000}"
echo "Usando porta: $PORT_VALUE"

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
    exec gunicorn --bind 0.0.0.0:$PORT_VALUE --workers 3 core.wsgi:application
fi

