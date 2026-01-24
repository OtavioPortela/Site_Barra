#!/bin/sh
set -e

# Usar a porta do Railway ou padrão 3000
PORT=${PORT:-3000}

# Garantir que PORT seja um número válido
if [ -z "$PORT" ] || [ "$PORT" = "undefined" ]; then
  PORT=3000
fi

# Debug: mostrar a porta que será usada
echo "Iniciando servidor na porta: $PORT"

# Iniciar o servidor serve com formato host:port
# O serve precisa do formato 0.0.0.0:PORT ou tcp://0.0.0.0:PORT
exec serve -s dist -l "0.0.0.0:${PORT}"

