# 🚀 Teste Rápido - WhatsApp Twilio

## ✅ Status Atual

- ✅ **WhatsApp conectado ao Sandbox** (confirmado!)
- ✅ **Backend rodando** na porta 8000
- ✅ **Credenciais configuradas** no `.env`

---

## 🧪 Como Testar AGORA

### Opção 1: Testar pela Interface Web (Mais Fácil)

1. **Iniciar o frontend** (se ainda não estiver rodando):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Abrir o navegador** em: `http://localhost:5173` (ou a porta que aparecer)

3. **Fazer login** com:
   - Email: `admin@barraconfeccoes.com`
   - Senha: `admin123`

4. **Ir para o Dashboard** de Ordens de Serviço

5. **Encontrar uma OS com status "finalizada"**

6. **Clique no botão "📱 Enviar para WhatsApp"**

7. **A mensagem será enviada automaticamente!**

   ⚠️ **IMPORTANTE:** No Sandbox, você só pode enviar mensagens para o número que você conectou (seu próprio número `+14155238886`).

   **Então certifique-se de que o telefone cadastrado na OS seja o seu número conectado ao Sandbox!**

---

### Opção 2: Testar via API (cURL)

```bash
# 1. Fazer login
LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@barraconfeccoes.com", "password": "admin123"}')

TOKEN=$(echo $LOGIN | grep -o '"access":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

# 2. Testar envio de mensagem simples
curl -X POST http://localhost:8000/api/whatsapp/enviar/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "14155238886",
    "mensagem": "Teste de mensagem WhatsApp via Twilio 🚀"
  }'

# 3. Ou testar envio de nota da OS (substitua ORDEM_ID pelo ID real)
curl -X POST http://localhost:8000/api/whatsapp/enviar-nota-os/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "14155238886",
    "ordem_servico_id": 1
  }'
```

**Nota:** Use o número no formato sem o `+` ou com o código do país completo. Para Brasil: `5531999999999` (55 + DDD + número)

---

## 📱 Formato do Número

Para o Sandbox, você precisa usar o número que conectou. Se conectou com `+14155238886`, use:

- **Com código do país:** `14155238886` ou `+14155238886`
- **Para números brasileiros conectados:** `5531999999999` (55 + DDD + número)

---

## ⚠️ Erros Comuns

### "The number is not a valid WhatsApp number"
- **Causa:** Número não conectado ao Sandbox
- **Solução:** Certifique-se de usar o número que você conectou

### "Unable to create record"
- **Causa:** Sem créditos ou número incorreto
- **Solução:** Verifique créditos em: https://www.twilio.com/console

### Erro 401 ou 403
- **Causa:** Token expirado ou inválido
- **Solução:** Faça login novamente para obter novo token

---

## ✅ Se funcionou!

Você verá:
- ✅ Mensagem recebida no WhatsApp
- ✅ Toast de sucesso no frontend: "Nota da OS enviada para o WhatsApp!"
- ✅ Botão muda para "✓ Enviado para WhatsApp"

---

## 🎯 Próximo Passo

Depois de testar com sucesso no Sandbox:

1. **Para produção:** Solicite um número WhatsApp Business aprovado
2. **Configure** o número no Twilio Console
3. **Atualize** `TWILIO_WHATSAPP_FROM` no `.env`
4. **Teste novamente** para confirmar

---

## 🎉 Pronto para testar!

Siga as instruções acima e me avise se funcionou! 🚀

