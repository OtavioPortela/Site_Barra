#!/bin/bash

# Script para testar a integração Twilio WhatsApp

echo "🧪 Teste de Integração Twilio WhatsApp"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se backend está rodando
echo "1️⃣  Verificando se o backend está rodando..."
if docker compose ps web | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
else
    echo -e "${RED}❌ Backend não está rodando${NC}"
    echo "   Execute: docker compose up -d web db"
    exit 1
fi

# Verificar variáveis de ambiente
echo ""
echo "2️⃣  Verificando configuração do Twilio..."
if [ -f "backend/.env" ]; then
    if grep -q "TWILIO_ACCOUNT_SID=" backend/.env && grep -q "TWILIO_AUTH_TOKEN=" backend/.env; then
        SID=$(grep "TWILIO_ACCOUNT_SID=" backend/.env | cut -d'=' -f2)
        TOKEN=$(grep "TWILIO_AUTH_TOKEN=" backend/.env | cut -d'=' -f2)

        if [ -z "$SID" ] || [ "$SID" = "" ]; then
            echo -e "${YELLOW}⚠️  TWILIO_ACCOUNT_SID não configurado${NC}"
            echo "   Edite backend/.env e adicione suas credenciais do Twilio"
        elif [ -z "$TOKEN" ] || [ "$TOKEN" = "" ]; then
            echo -e "${YELLOW}⚠️  TWILIO_AUTH_TOKEN não configurado${NC}"
            echo "   Edite backend/.env e adicione suas credenciais do Twilio"
        else
            echo -e "${GREEN}✅ Credenciais encontradas no .env${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Variáveis do Twilio não encontradas no .env${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
fi

echo ""
echo "3️⃣  Testando endpoint de envio..."
echo ""

# Fazer login primeiro
echo "   Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barraconfeccoes.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Erro ao fazer login${NC}"
    echo "   Resposta: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
echo ""

# Testar envio de mensagem (substitua pelo seu número)
echo "4️⃣  Teste de envio de mensagem"
echo "   Para testar, você precisa:"
echo "   1. Configurar suas credenciais Twilio no backend/.env"
echo "   2. Conectar seu WhatsApp ao Sandbox do Twilio"
echo "   3. Usar o número conectado no teste"
echo ""
read -p "   Digite o número para teste (ex: 31999999999): " NUMERO

if [ -z "$NUMERO" ]; then
    echo -e "${YELLOW}⚠️  Número não fornecido. Pulando teste.${NC}"
    exit 0
fi

echo ""
echo "   Enviando mensagem de teste..."

TEST_RESPONSE=$(curl -s -X POST http://localhost:8000/api/whatsapp/enviar/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"numero\": \"$NUMERO\",
    \"mensagem\": \"Teste de mensagem WhatsApp via Twilio\"
  }")

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Mensagem enviada com sucesso!${NC}"
    echo "   Resposta: $TEST_RESPONSE"
else
    echo -e "${RED}❌ Erro ao enviar mensagem${NC}"
    echo "   Resposta: $TEST_RESPONSE"
fi

echo ""
echo "======================================"
echo "📖 Para mais detalhes, consulte: COMO_TESTAR_TWILIO.md"

