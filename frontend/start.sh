#!/bin/sh
set -e

# Usar a porta do Railway ou padrão 3000
export PORT=${PORT:-3000}

# Garantir que PORT seja um número válido
if [ -z "$PORT" ] || [ "$PORT" = "undefined" ]; then
  export PORT=3000
fi

# Debug: mostrar a porta que será usada
echo "Iniciando servidor Node.js na porta: $PORT"

# Iniciar o servidor Node.js customizado
exec node server.js

