# 🚀 Testar WhatsApp Agora - Guia Rápido

## ✅ Configuração Completa!

Suas credenciais estão configuradas:
- ✅ Account SID: `ACaee92e2f5590d62ac1fa0ddb91aeaca3`
- ✅ Auth Token: Configurado
- ✅ Número Sandbox: `whatsapp:+14155238886`

---

## 🔗 Passo 1: Conectar seu WhatsApp ao Sandbox

**IMPORTANTE:** Antes de testar, você precisa conectar seu WhatsApp ao Sandbox do Twilio:

1. Abra o WhatsApp no seu celular
2. Envie uma mensagem para: **+1 415 523 8886**
3. Com o texto: **`join public-discover`**
4. Você receberá uma confirmação de que está conectado

⚠️ **No Sandbox, você só pode enviar mensagens para o número que você conectou (seu próprio número)**

---

## 🔄 Passo 2: Reiniciar o Backend

Para carregar as novas credenciais:

```bash
docker compose restart web
```

Aguarde alguns segundos e verifique os logs:

```bash
docker compose logs -f web
```

(Pressione Ctrl+C quando ver "Starting development server")

---

## 🧪 Passo 3: Testar

### Opção A: Testar pela Interface Web (Recomendado)

1. **Iniciar o frontend** (se ainda não estiver rodando):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Fazer login** no sistema

3. **Ir para Dashboard** de Ordens de Serviço

4. **Encontrar uma OS** com status "finalizada"

5. **Clicar no botão "📱 Enviar para WhatsApp"**

6. A mensagem será enviada para o telefone do cliente cadastrado na OS

### Opção B: Testar via Script

```bash
./testar_twilio.sh
```

### Opção C: Testar via API (cURL)

```bash
# 1. Fazer login
LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@barraconfeccoes.com", "password": "admin123"}')

TOKEN=$(echo $LOGIN | grep -o '"access":"[^"]*' | cut -d'"' -f4)

# 2. Testar envio (substitua pelo seu número conectado ao Sandbox)
curl -X POST http://localhost:8000/api/whatsapp/enviar/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "31999999999",
    "mensagem": "Teste de mensagem WhatsApp via Twilio"
  }'
```

---

## ⚠️ Possíveis Erros

### Erro: "The number is not a valid WhatsApp number"
- **Causa:** O número não está conectado ao Sandbox
- **Solução:** Siga o Passo 1 acima para conectar seu WhatsApp

### Erro: "Unable to create record"
- **Causa:** Sem créditos na conta ou configuração incorreta
- **Solução:** Verifique se tem créditos em: https://www.twilio.com/console

### Erro: "Twilio não configurado"
- **Causa:** Backend não carregou as variáveis do .env
- **Solução:** Reinicie o backend: `docker compose restart web`

### Erro: "Authentication failed"
- **Causa:** Credenciais incorretas
- **Solução:** Verifique se Account SID e Auth Token estão corretos no `.env`

---

## ✅ Se funcionou!

Você verá:
- ✅ Mensagem recebida no WhatsApp
- ✅ Toast de sucesso no frontend
- ✅ Resposta da API com `"success": true`

---

## 📞 Próximos Passos

Após testar com sucesso no Sandbox:

1. **Para produção:** Solicite um número WhatsApp Business aprovado pelo Twilio
2. **Atualize** `TWILIO_WHATSAPP_FROM` no `.env` com o novo número
3. **Teste novamente** para confirmar

---

## 🎉 Pronto para testar!

Execute os passos acima e me avise se funcionou! 🚀

