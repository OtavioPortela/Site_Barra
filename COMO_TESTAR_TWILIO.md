# 🧪 Como Testar a Integração Twilio WhatsApp

## 📋 Passo 1: Configurar Conta Twilio

### 1.1 Criar Conta
1. Acesse: https://www.twilio.com/try-twilio
2. Crie uma conta gratuita (trial com $15.50 de crédito)

### 1.2 Obter Credenciais
1. Após criar a conta, acesse: https://www.twilio.com/console
2. No painel, você verá:
   - **Account SID** (ex: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token** (clique em "Show" para ver)

### 1.3 Configurar WhatsApp Sandbox (Para Testes)
1. No console Twilio, vá em **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Ou acesse: https://www.twilio.com/console/sms/sandbox
3. Você verá um número do tipo: `whatsapp:+14155238886`
4. Siga as instruções para enviar um código para conectar seu WhatsApp ao Sandbox

**IMPORTANTE:** Para usar o Sandbox, você precisa:
- Enviar uma mensagem para o número fornecido com o código mostrado
- Depois disso, pode enviar mensagens apenas para o número que você conectou

---

## 📝 Passo 2: Configurar no Projeto

### 2.1 Editar arquivo `.env`
Abra o arquivo `backend/.env` e adicione suas credenciais:

```bash
# Twilio WhatsApp API Config
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Seu Account SID aqui
TWILIO_AUTH_TOKEN=seu_auth_token_aqui                   # Seu Auth Token aqui
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886             # Número do Sandbox ou seu número aprovado
```

### 2.2 Reiniciar o Backend
```bash
docker compose restart web
```

---

## 🧪 Passo 3: Testar

### Opção A: Testar via Interface Web (Recomendado)

1. **Iniciar o sistema:**
   ```bash
   # Backend (já deve estar rodando)
   docker compose up -d web db

   # Frontend
   cd frontend
   npm run dev
   ```

2. **Fazer login** no sistema

3. **Ir para o Dashboard** de Ordens de Serviço

4. **Criar ou encontrar uma OS** com status "finalizada"

5. **Clicar no botão "📱 Enviar para WhatsApp"**

6. A mensagem será enviada automaticamente para o telefone do cliente cadastrado na OS

---

### Opção B: Testar via API (cURL ou Postman)

#### Teste 1: Enviar Mensagem Simples
```bash
curl -X POST http://localhost:8000/api/whatsapp/enviar/ \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "31999999999",
    "mensagem": "Teste de mensagem WhatsApp"
  }'
```

#### Teste 2: Enviar Nota da OS
```bash
curl -X POST http://localhost:8000/api/whatsapp/enviar-nota-os/ \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "31999999999",
    "ordem_servico_id": 1
  }'
```

**Para obter o token:**
```bash
# Fazer login primeiro
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barraconfeccoes.com",
    "password": "admin123"
  }'
```

---

## ✅ Verificação

### Se funcionou:
- ✅ Mensagem recebida no WhatsApp
- ✅ Resposta da API com `"success": true`
- ✅ Toast de sucesso no frontend

### Se deu erro:

**Erro: "Twilio não configurado"**
- Verifique se as credenciais estão no `.env`
- Reinicie o backend: `docker compose restart web`

**Erro: "Authentication failed"**
- Verifique se Account SID e Auth Token estão corretos
- Certifique-se de copiar sem espaços extras

**Erro: "The number is not a valid WhatsApp number"**
- Para Sandbox: Verifique se você enviou o código de ativação
- O número deve estar no formato: `whatsapp:+5531999999999`

**Erro: "Unable to create record"**
- Verifique se tem créditos na conta Twilio
- Verifique se o número está autorizado (Sandbox ou aprovado)

---

## 🎯 Números para Teste (Sandbox)

Para testar com o Twilio Sandbox:
1. Você precisa enviar um código para o número fornecido pelo Twilio
2. Depois pode enviar mensagens APENAS para o número que você conectou
3. Para enviar para qualquer número, precisa de um número aprovado pelo WhatsApp Business

---

## 📞 Suporte

- Documentação Twilio: https://www.twilio.com/docs/whatsapp
- Console Twilio: https://www.twilio.com/console
- Status da API: https://status.twilio.com/

