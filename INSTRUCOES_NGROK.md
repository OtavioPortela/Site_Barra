# 🚀 Instruções Rápidas - Ngrok

## ⚠️ IMPORTANTE: Primeiro configure o authtoken

O ngrok precisa de autenticação. Execute:

```bash
./config-ngrok.sh
```

Ou manualmente:

1. Acesse: https://dashboard.ngrok.com/signup (crie conta gratuita)
2. Acesse: https://dashboard.ngrok.com/get-started/your-authtoken
3. Copie o authtoken
4. Execute: `ngrok config add-authtoken SEU_TOKEN_AQUI`

---

## Depois de configurar o authtoken:

### Opção 1: Script Automático (Recomendado)

```bash
./setup-ngrok.sh
```

Este script vai:
- Iniciar o túnel do backend
- Configurar automaticamente os arquivos .env
- Mostrar as URLs geradas

### Opção 2: Manual

#### Terminal 1 - Backend:
```bash
./start-ngrok-backend.sh
```
Copie a URL HTTPS que aparecer (ex: `https://abc123.ngrok.io`)

#### Configurar Backend:
Edite `backend/.env` e adicione:
```env
NGROK_MODE=True
ALLOWED_HOSTS=localhost,127.0.0.1,abc123.ngrok.io
```

Reinicie:
```bash
docker-compose restart web
```

#### Terminal 2 - Frontend:
```bash
./start-ngrok-frontend.sh
```
Copie a URL HTTPS que aparecer (ex: `https://xyz789.ngrok.io`)

#### Configurar Frontend:
Crie `frontend/.env.local`:
```env
VITE_API_URL=https://abc123.ngrok.io/api
```

Reinicie o frontend (pare e inicie novamente).

---

## ✅ Testar

Acesse a URL do frontend ngrok no navegador e teste o sistema!

## 🛑 Parar

Para parar os túneis:
```bash
pkill -f ngrok
```

