#!/bin/bash

echo "🔐 Configuração do Ngrok"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "O ngrok precisa de autenticação para funcionar."
echo ""
echo "📋 Passos:"
echo "1. Acesse: https://dashboard.ngrok.com/signup (crie uma conta gratuita)"
echo "2. Depois acesse: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "3. Copie o authtoken que aparece"
echo ""
read -p "Cole seu authtoken aqui: " AUTHTOKEN

if [ -z "$AUTHTOKEN" ]; then
    echo "❌ Authtoken não fornecido. Saindo..."
    exit 1
fi

echo ""
echo "⚙️  Configurando ngrok..."
ngrok config add-authtoken "$AUTHTOKEN"

if [ $? -eq 0 ]; then
    echo "✅ Ngrok configurado com sucesso!"
    echo ""
    echo "Agora você pode executar: ./setup-ngrok.sh"
else
    echo "❌ Erro ao configurar ngrok. Verifique o authtoken."
    exit 1
fi

