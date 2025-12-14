#!/bin/bash

echo "🚀 Configurando Ngrok para testes..."
echo ""

# Matar processos ngrok existentes
pkill -f ngrok 2>/dev/null
sleep 2

# Iniciar ngrok do backend em background
echo "📡 Iniciando túnel ngrok para o backend (porta 8000)..."
ngrok http 8000 > /tmp/ngrok-backend.log 2>&1 &
NGROK_BACKEND_PID=$!
sleep 5

# Tentar pegar a URL do backend
BACKEND_URL=""
for i in {1..10}; do
    BACKEND_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); tunnels = data.get('tunnels', []); print(tunnels[0]['public_url'] if tunnels and len(tunnels) > 0 else '')" 2>/dev/null)
    if [ ! -z "$BACKEND_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Não foi possível obter a URL do ngrok backend automaticamente."
    echo "Por favor, execute manualmente: ./start-ngrok-backend.sh"
    echo "E copie a URL HTTPS que aparecer."
    exit 1
fi

echo "✅ Backend ngrok URL: $BACKEND_URL"
echo ""

# Extrair apenas o domínio (sem https://)
BACKEND_DOMAIN=$(echo $BACKEND_URL | sed 's|https://||')

# Configurar backend/.env
echo "⚙️  Configurando backend/.env..."
if [ -f backend/.env ]; then
    # Adicionar NGROK_MODE se não existir
    if ! grep -q "NGROK_MODE" backend/.env; then
        echo "" >> backend/.env
        echo "# Ngrok configuration" >> backend/.env
        echo "NGROK_MODE=True" >> backend/.env
    else
        sed -i 's/NGROK_MODE=.*/NGROK_MODE=True/' backend/.env
    fi

    # Adicionar ao ALLOWED_HOSTS
    if grep -q "ALLOWED_HOSTS" backend/.env; then
        CURRENT_HOSTS=$(grep "ALLOWED_HOSTS" backend/.env | cut -d'=' -f2)
        if [[ ! "$CURRENT_HOSTS" == *"$BACKEND_DOMAIN"* ]]; then
            sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$CURRENT_HOSTS,$BACKEND_DOMAIN|" backend/.env
        fi
    else
        echo "ALLOWED_HOSTS=localhost,127.0.0.1,$BACKEND_DOMAIN" >> backend/.env
    fi
else
    echo "NGROK_MODE=True" > backend/.env
    echo "ALLOWED_HOSTS=localhost,127.0.0.1,$BACKEND_DOMAIN" >> backend/.env
fi

echo "✅ Backend configurado!"
echo ""

# Iniciar ngrok do frontend
echo "📡 Iniciando túnel ngrok para o frontend (porta 5173)..."
# Matar ngrok anterior se existir
pkill -f "ngrok http 5173" 2>/dev/null
sleep 2

# Usar porta diferente para o frontend (4041)
ngrok http 5173 --log=stdout > /tmp/ngrok-frontend.log 2>&1 &
NGROK_FRONTEND_PID=$!
sleep 5

# Tentar pegar a URL do frontend (pode estar em outra porta da API)
FRONTEND_URL=""
for i in {1..10}; do
    # Tentar porta 4041 (se ngrok permitir múltiplas instâncias)
    FRONTEND_URL=$(curl -s http://127.0.0.1:4041/api/tunnels 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); tunnels = data.get('tunnels', []); print(tunnels[0]['public_url'] if tunnels and len(tunnels) > 0 else '')" 2>/dev/null)
    if [ ! -z "$FRONTEND_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  Não foi possível obter a URL do frontend automaticamente."
    echo "Execute manualmente em outro terminal: ./start-ngrok-frontend.sh"
    echo "E copie a URL HTTPS que aparecer."
    FRONTEND_URL="https://SEU_FRONTEND_NGROK_URL"
fi

echo "✅ Frontend ngrok URL: $FRONTEND_URL"
echo ""

# Configurar frontend/.env.local
echo "⚙️  Configurando frontend/.env.local..."
echo "VITE_API_URL=$BACKEND_URL/api" > frontend/.env.local
echo "✅ Frontend configurado!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuração concluída!"
echo ""
echo "📋 URLs geradas:"
echo "   Backend:  $BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Reinicie o backend: docker-compose restart web"
echo "   2. Reinicie o frontend (pare e inicie novamente: npm run dev)"
echo "   3. Acesse: $FRONTEND_URL"
echo ""
echo "⚠️  Para parar os túneis ngrok, execute:"
echo "   pkill -f ngrok"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

