# 🚀 Configuração do Ngrok para Testes Externos

Este guia explica como usar o ngrok para disponibilizar o sistema para clientes testarem.

## 📋 Pré-requisitos

- Ngrok instalado (já está instalado no sistema)
- Backend rodando na porta 8000
- Frontend rodando (porta 5173 para Vite ou 3000 para React)

## 🔧 Passo a Passo

### 1. Iniciar o túnel do Backend

Em um terminal, execute:

```bash
chmod +x start-ngrok-backend.sh
./start-ngrok-backend.sh
```

Você verá uma saída como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

**Copie a URL HTTPS** (ex: `https://abc123.ngrok.io`)

### 2. Configurar o Backend

Edite o arquivo `backend/.env` e adicione:

```env
# Modo ngrok ativado
NGROK_MODE=True

# Adicione a URL do ngrok aos hosts permitidos
ALLOWED_HOSTS=localhost,127.0.0.1,abc123.ngrok.io

# (Opcional) Se quiser especificar origens CORS manualmente
# CORS_ALLOWED_ORIGINS=https://xyz789.ngrok.io,http://localhost:5173
```

**Reinicie o backend:**
```bash
docker-compose restart web
```

### 3. Iniciar o túnel do Frontend

Em outro terminal, execute:

```bash
chmod +x start-ngrok-frontend.sh
./start-ngrok-frontend.sh
```

Ou se o frontend estiver em outra porta:
```bash
./start-ngrok-frontend.sh 3000
```

Você verá uma saída como:
```
Forwarding  https://xyz789.ngrok.io -> http://localhost:5173
```

**Copie a URL HTTPS** (ex: `https://xyz789.ngrok.io`)

### 4. Configurar o Frontend

Crie o arquivo `frontend/.env.local`:

```env
VITE_API_URL=https://abc123.ngrok.io/api
```

**Reinicie o frontend** (pare e inicie novamente o servidor de desenvolvimento).

### 5. Testar

Acesse a URL do frontend ngrok no navegador:
```
https://xyz789.ngrok.io
```

## ⚠️ Importante

1. **URLs temporárias**: As URLs do ngrok mudam a cada vez que você reinicia (na versão gratuita)
2. **Atualizar configurações**: Sempre que reiniciar o ngrok, atualize:
   - `backend/.env` com a nova URL do backend
   - `frontend/.env.local` com a nova URL do backend
3. **Segurança**: O modo ngrok (`NGROK_MODE=True`) permite todas as origens CORS. Use apenas para testes!
4. **Versão paga**: Com ngrok pago, você pode ter URLs fixas

## 🔄 Workflow Completo

1. Terminal 1: `docker-compose up` (backend)
2. Terminal 2: `cd frontend && npm run dev` (frontend)
3. Terminal 3: `./start-ngrok-backend.sh` (túnel backend)
4. Terminal 4: `./start-ngrok-frontend.sh` (túnel frontend)
5. Configurar `.env` e `.env.local` com as URLs
6. Reiniciar serviços
7. Compartilhar URL do frontend com o cliente

## 🛑 Parar os Túneis

Pressione `Ctrl+C` nos terminais onde o ngrok está rodando.

## 📝 Notas

- O ngrok gratuito tem limite de conexões simultâneas
- URLs gratuitas expiram após algum tempo de inatividade
- Para produção, considere deploy em serviços como Vercel (frontend) e Railway/Render (backend)

