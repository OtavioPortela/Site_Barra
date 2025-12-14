# 🔑 Como Obter o Auth Token do Twilio

## 📍 Localização no Console Twilio

1. **Acesse:** https://www.twilio.com/console

2. **Na página inicial do Console, você verá:**
   - **Account SID** (você já tem: `ACaee92e2f5590d62ac1fa0ddb91aeaca3`)
   - **Auth Token** (está oculto por padrão)

3. **Para ver o Auth Token:**
   - Clique no ícone de **"olho" 👁️** ou botão **"Show"** ao lado do campo "Auth Token"
   - **OU** clique em **"View"** se estiver escrito assim
   - O token será revelado (algo como: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

4. **Copie o Auth Token completo** (é uma string longa)

---

## 📝 Configurar no Projeto

Após obter o Auth Token, edite o arquivo `backend/.env`:

```bash
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
```

**Substitua `seu_auth_token_aqui` pelo token real que você copiou.**

---

## ⚠️ Importante

- **Nunca compartilhe** seu Auth Token publicamente
- O Auth Token dá acesso total à sua conta Twilio
- Se exposto, revogue e gere um novo no console

---

## ✅ Depois de Configurar

1. Reinicie o backend:
   ```bash
   docker compose restart web
   ```

2. Teste o envio de mensagem!

