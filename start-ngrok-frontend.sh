#!/bin/bash

# Script para iniciar o túnel ngrok para o frontend
# Uso: ./start-ngrok-frontend.sh [porta]
# Porta padrão: 5173 (Vite)

PORT=${1:-5173}

echo "🚀 Iniciando túnel ngrok para o frontend (porta $PORT)..."
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Copie a URL HTTPS que aparecer (ex: https://xyz789.ngrok.io)"
echo "2. Crie um arquivo frontend/.env.local com:"
echo "   VITE_API_URL=https://[URL_DO_BACKEND_NGROK]/api"
echo "3. Reinicie o frontend"
echo ""
echo "Pressione Ctrl+C para parar o túnel"
echo ""

ngrok http $PORT

