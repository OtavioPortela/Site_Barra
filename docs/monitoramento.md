# Monitoramento — Railway + Sentry + Z-API

> **ATENÇÃO:** Este arquivo contém credenciais reais. Não commitar em repositório público.

---

## Railway

### Projeto
| Campo | Valor |
|---|---|
| **Nome do projeto** | `humble-exploration` |
| **Project ID** | `949c09df-1c13-448b-8eed-30cae96cf50a` |
| **Environment** | `production` |
| **URL pública** | `sitebarra-production.up.railway.app` |

### Serviços em produção
| Serviço | ID | Status |
|---|---|---|
| `Site_Barra` (backend Django) | `a29d4739-f713-41c0-b60e-3ce6d9b34e9b` | SUCCESS |
| `Postgres` | `5df8e3c9-ce1e-4b31-b556-c56e473029c9` | SUCCESS |

### CLI — Setup local
```bash
# Instalar
brew install railway

# Login (abre browser)
railway login

# Linkar projeto
railway link --project humble-exploration

# Linkar serviço
railway service link Site_Barra
```

### Comandos úteis do dia a dia
```bash
# Ver logs em tempo real
railway logs --tail 100

# Status dos serviços
railway service status --all

# Ver variáveis de ambiente de produção
railway variable list

# Adicionar/atualizar variável de ambiente
railway variable set NOME_VAR="valor"

# Redeploy manual (sem novo commit)
railway redeploy

# Reiniciar serviço
railway restart

# Conectar direto no banco PostgreSQL de produção
railway connect Postgres

# SSH no container do backend
railway ssh
```

### Consultas úteis no banco de produção
Rodar via `railway connect Postgres`:

```sql
-- Resumo geral
SELECT
  (SELECT count(*) FROM ordens_servico_ordemservico) AS os_total,
  (SELECT count(*) FROM ordens_servico_ordemservico WHERE status='pendente') AS pendentes,
  (SELECT count(*) FROM ordens_servico_ordemservico WHERE status='em_desenvolvimento') AS em_desenvolvimento,
  (SELECT count(*) FROM ordens_servico_ordemservico WHERE status='finalizada') AS finalizadas,
  (SELECT count(*) FROM ordens_servico_ordemservico WHERE faturada=true) AS faturadas,
  (SELECT count(*) FROM ordens_servico_cliente WHERE ativo=true) AS clientes_ativos,
  (SELECT count(*) FROM authentication_usuario) AS usuarios;

-- Últimas 10 OS criadas
SELECT numero, status, faturada, data_criacao
FROM ordens_servico_ordemservico
ORDER BY data_criacao DESC
LIMIT 10;

-- Faturamento total em produção
SELECT SUM(valor) AS faturamento_total
FROM ordens_servico_ordemservico
WHERE faturada = true;
```

---

## Sentry

### Credenciais
| Campo | Valor |
|---|---|
| **Organização** | `otavio-ltda` |
| **DSN** | `https://64067508ec3adafc6ed0090a494d8026@o4511169410564096.ingest.us.sentry.io/4511169415741440` |
| **Dashboard** | `otavio-ltda.sentry.io` |
| **Plano atual** | Business Trial (14 dias) → Free após expirar |

### Como o Sentry está integrado
- SDK: `sentry-sdk[django]==2.20.0` no `requirements.txt`
- Configurado em `backend/core/settings.py` — só ativa se `SENTRY_DSN` estiver definido
- `SENTRY_DSN` está nas variáveis de ambiente do Railway (não no `.env` local)
- Captura automaticamente:
  - Exceções não tratadas
  - Logs de nível `ERROR` e acima
  - `WARNING` como breadcrumbs (trilha de contexto antes do erro)
  - 20% das requests para análise de performance (`traces_sample_rate=0.2`)
- `send_default_pii=False` — dados pessoais não são enviados (LGPD)

### Adicionar SENTRY_DSN em outro ambiente
```bash
# Via Railway CLI
railway variable set SENTRY_DSN="https://64067508ec3adafc6ed0090a494d8026@o4511169410564096.ingest.us.sentry.io/4511169415741440"
```

Ou adicionar manualmente no `.env`:
```env
SENTRY_DSN=https://64067508ec3adafc6ed0090a494d8026@o4511169410564096.ingest.us.sentry.io/4511169415741440
```

### Testar se o Sentry está funcionando
```bash
# No dashboard do Sentry → clique em "View Sample Error"
# Ou forçar um erro de teste via Django shell:
railway ssh -- python manage.py shell -c "import sentry_sdk; sentry_sdk.capture_message('Teste manual do Sentry', level='error')"
```

---

## Variáveis de ambiente de produção (Railway)

| Variável | Valor |
|---|---|
| `DEBUG` | `False` |
| `PORT` | `8000` |
| `RAILWAY_MODE` | `True` |
| `DATABASE_URL` | `postgresql://postgres:AQGQBJxtaxDnHmtXPFCzMIUmOUldnsem@postgres.railway.internal:5432/railway` |
| `SENTRY_DSN` | `https://64067508ec3adafc6ed0090a494d8026@o4511169410564096.ingest.us.sentry.io/4511169415741440` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000, http://localhost:3001, http://localhost:5173, http://192.168.0.124:3000` |

---

## Z-API — WhatsApp

### Credenciais
| Campo | Valor |
|---|---|
| **Instance ID** | `3F136285299931D66BDE2295B0810B48` |
| **Token** | `848B1A5556EC4F9E483F75E8` |
| **Client Token** | `Fd498b1a5c33f4084b21f12aff28bf27fS` |
| **Dashboard** | `app.z-api.io` |
| **API Base** | `https://api.z-api.io/instances/3F136285299931D66BDE2295B0810B48/token/848B1A5556EC4F9E483F75E8` |

### Variáveis no Railway
```bash
railway variable set ZAPI_INSTANCE_ID="3F136285299931D66BDE2295B0810B48"
railway variable set ZAPI_TOKEN="848B1A5556EC4F9E483F75E8"
railway variable set ZAPI_CLIENT_TOKEN="Fd498b1a5c33f4084b21f12aff28bf27fS"
```

### Trocar número conectado
1. Acesse `app.z-api.io` → instância `barra-confeccoes`
2. Aba **QR Code** → clique em **Desconectar**
3. Novo QR Code aparece — escaneie com o novo número
4. Nenhuma variável de ambiente muda — só quem escaneia o QR

### Testar conexão via curl
```bash
curl -s "https://api.z-api.io/instances/3F136285299931D66BDE2295B0810B48/token/848B1A5556EC4F9E483F75E8/status" \
  -H "Client-Token: Fd498b1a5c33f4084b21f12aff28bf27fS"
```
Resposta esperada: `{"connected": true, "smartphoneConnected": true}`

### Enviar mensagem de teste via curl
```bash
curl -s -X POST "https://api.z-api.io/instances/3F136285299931D66BDE2295B0810B48/token/848B1A5556EC4F9E483F75E8/send-text" \
  -H "Content-Type: application/json" \
  -H "Client-Token: Fd498b1a5c33f4084b21f12aff28bf27fS" \
  -d '{"phone": "5531XXXXXXXXX", "message": "Teste de conexão"}'
```

### Endpoints disponíveis no backend
| Endpoint | Descrição |
|---|---|
| `GET /api/whatsapp/status/` | Verifica se a instância está conectada |
| `POST /api/whatsapp/enviar/` | Envia texto livre |
| `POST /api/whatsapp/enviar-imagem/` | Envia imagem com legenda |
| `POST /api/whatsapp/enviar-nota-os/` | Notifica OS pronta para retirada |
| `POST /api/whatsapp/enviar-os-criada/` | Envia ficha da OS recém criada |

---

## Fluxo de deploy

O deploy é automático via GitHub:

```
git push origin main  →  Railway detecta  →  Build Docker  →  Deploy
```

Para acompanhar um deploy em andamento:
```bash
railway logs --tail 100
railway service status
```
