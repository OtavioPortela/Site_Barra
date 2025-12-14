#!/bin/bash

# Script para iniciar o túnel ngrok para o backend
# Uso: ./start-ngrok-backend.sh

echo "🚀 Iniciando túnel ngrok para o backend (porta 8000)..."
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Copie a URL HTTPS que aparecer (ex: https://abc123.ngrok.io)"
echo "2. Adicione essa URL ao arquivo backend/.env na variável ALLOWED_HOSTS"
echo "3. Adicione a URL do frontend ngrok em CORS_ALLOWED_ORIGINS"
echo "4. Reinicie o backend com: docker-compose restart web"
echo ""
echo "Pressione Ctrl+C para parar o túnel"
echo ""

ngrok http 8000

