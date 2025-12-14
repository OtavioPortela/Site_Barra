# 🔐 Configuração do Authtoken do Ngrok

O ngrok requer autenticação. Siga estes passos:

## 1. Criar conta no Ngrok (se ainda não tiver)

Acesse: https://dashboard.ngrok.com/signup

## 2. Obter o Authtoken

1. Faça login em: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copie o authtoken que aparece na tela

## 3. Configurar o Authtoken

Execute no terminal:

```bash
ngrok config add-authtoken SEU_AUTHTOKEN_AQUI
```

Substitua `SEU_AUTHTOKEN_AQUI` pelo token que você copiou.

## 4. Verificar

Teste se está funcionando:

```bash
ngrok http 8000
```

Se aparecer uma URL HTTPS, está configurado corretamente!

---

**Depois de configurar, execute novamente o script de setup.**

