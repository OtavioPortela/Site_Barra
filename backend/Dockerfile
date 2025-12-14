FROM python:3.11-slim

# Instalar dependências do sistema para PostgreSQL e Pillow
RUN apt-get update && apt-get install -y \
    postgresql-client \
    netcat-traditional \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Dar permissão de execução ao entrypoint.sh
RUN chmod +x entrypoint.sh

# Criar diretório para arquivos estáticos
RUN mkdir -p /app/staticfiles

# Expor porta 8000
EXPOSE 8000

# Comando padrão (será sobrescrito no docker-compose ou Railway)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "core.wsgi:application"]
