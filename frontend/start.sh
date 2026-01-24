#!/bin/sh
set -e

# Usar a porta do Railway ou padrão 3000
PORT=${PORT:-3000}

# Iniciar o servidor serve na porta especificada
exec serve -s dist -l 0.0.0.0:$PORT

