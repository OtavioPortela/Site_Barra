# WhatsApp — Z-API Integration

> **Status atual:** Integração funcionando em produção. Instância pareada, número definitivo conectado, envio validado.

---

## Por que Z-API?

Tentamos **Twilio** primeiro, mas tem limitações sérias para o Brasil:
- Requer número de telefone Twilio (não usa o número da empresa)
- Sandbox com whitelist — cliente precisa enviar mensagem primeiro para conseguir receber
- Custo por mensagem em USD

A **Z-API** resolve isso:
- Usa QR Code, igual ao WhatsApp Web — o número da empresa envia direto
- Troca de número sem alterar código (só escaneia novo QR)
- Custo fixo mensal

---

## Credenciais

| Campo | Valor |
|---|---|
| **Instance ID** | `3F136285299931D66BDE2295B0810B48` |
| **Token** | `848B1A5556EC4F9E483F75E8` |
| **Client Token** | `Fd498b1a5c33f4084b21f12aff28bf27fS` |
| **Dashboard** | `app.z-api.io` |
| **Nome da instância** | `barra-confeccoes` |
| **API Base** | `https://api.z-api.io/instances/3F136285299931D66BDE2295B0810B48/token/848B1A5556EC4F9E483F75E8` |

---

## Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `backend/apps/whatsapp/service.py` | Reescrito do zero — saiu Twilio, entrou Z-API |
| `backend/apps/whatsapp/views.py` | Adicionada view `status_instancia` (GET) |
| `backend/apps/whatsapp/urls.py` | Adicionada rota `status/` |
| `backend/core/settings.py` | `TWILIO_*` → `ZAPI_*` + bloco Sentry |
| `backend/.env` | Credenciais Z-API preenchidas |

---

## Endpoints disponíveis

| Endpoint | Método | Descrição |
|---|---|---|
| `GET /api/whatsapp/status/` | GET | Verifica se a instância está conectada |
| `POST /api/whatsapp/enviar/` | POST | Envia texto livre |
| `POST /api/whatsapp/enviar-imagem/` | POST | Envia imagem com legenda |
| `POST /api/whatsapp/enviar-nota-os/` | POST | Notifica cliente que OS está pronta para retirada |
| `POST /api/whatsapp/enviar-os-criada/` | POST | Envia ficha completa da OS recém criada |

---

## Como o serviço funciona (`service.py`)

```python
class WhatsAppService:
    BASE_URL = 'https://api.z-api.io/instances/{instance_id}/token/{token}'

    def _formatar_numero(self, numero):
        # Remove tudo que não é dígito
        # Adiciona DDI 55 se o número tiver 10 ou 11 dígitos
        # Ex: (31) 9 9999-0000 → 5531999990000

    def enviar_texto(self, numero, mensagem):
        # POST /send-text
        # Payload: {"phone": "5531...", "message": "..."}

    def enviar_imagem(self, numero, url_imagem, legenda=''):
        # POST /send-image
        # Payload: {"phone": "5531...", "image": "https://...", "caption": "..."}

    def verificar_status(self):
        # GET /status
        # Retorna: {"connected": bool, "session": bool, ...}
```

Header obrigatório em todas as chamadas:
```
Client-Token: Fd498b1a5c33f4084b21f12aff28bf27fS
```

---

## Onde o WhatsApp é disparado no projeto

### OS Criada
- View: `enviar_os_criada` em `whatsapp/views.py`
- Envia a ficha completa da OS formatada (cliente, serviço, valor, prazo, etc.)
- Se a OS tiver foto E a URL for pública (HTTPS), envia a imagem. Caso contrário, só texto.

### OS Pronta para Retirada
- View: `enviar_nota_os` em `whatsapp/views.py`
- Mensagem simples informando que o pedido está pronto
- Inclui link do Google Maps da loja e Instagram

---

## Variáveis de ambiente

```bash
# Adicionar no Railway
railway variable set ZAPI_INSTANCE_ID="3F136285299931D66BDE2295B0810B48"
railway variable set ZAPI_TOKEN="848B1A5556EC4F9E483F75E8"
railway variable set ZAPI_CLIENT_TOKEN="Fd498b1a5c33f4084b21f12aff28bf27fS"
```

`.env` local (já preenchido):
```env
ZAPI_INSTANCE_ID=3F136285299931D66BDE2295B0810B48
ZAPI_TOKEN=848B1A5556EC4F9E483F75E8
ZAPI_CLIENT_TOKEN=Fd498b1a5c33f4084b21f12aff28bf27fS
```

---

## Problema de sessão — `session: false`

### O que aconteceu
A instância Z-API foi criada e as credenciais foram configuradas, mas o QR Code **nunca foi escaneado** via WhatsApp no celular. Por isso:
- A API retorna `{"connected": true, "session": false}`
- As mensagens são aceitas pela API (retornam `zaapId` e `messageId`)
- Mas **não chegam** no destinatário

### Diagnóstico confirmado
A tela "Dispositivos Conectados" do WhatsApp do usuário mostra apenas:
- Firefox (Linux)
- Google Chrome (macOS)
- Google Chrome (Linux)

**Nenhum dispositivo Z-API aparece** — o pareamento nunca foi feito.

### Como resolver (pendente)
1. Acesse `app.z-api.io` → instância `barra-confeccoes`
2. Aba **QR Code**
3. Se aparecer "Conectado" ou botão "Desconectar", clique em **Desconectar** primeiro
4. Aguarde o novo QR Code aparecer
5. No celular: WhatsApp → ⋮ → **Dispositivos conectados** → **Conectar dispositivo** → escanear QR
6. O Z-API vai aparecer como novo dispositivo em "Dispositivos conectados"

### Como validar
```bash
curl -s "https://api.z-api.io/instances/3F136285299931D66BDE2295B0810B48/token/848B1A5556EC4F9E483F75E8/status" \
  -H "Client-Token: Fd498b1a5c33f4084b21f12aff28bf27fS"
```

Resposta esperada após parear:
```json
{"connected": true, "smartphoneConnected": true, "session": true}
```

---

## Trocar o número conectado

Quando quiser usar o número definitivo do cliente em vez do número de teste:

1. Acesse `app.z-api.io` → instância `barra-confeccoes`
2. Aba **QR Code** → clique em **Desconectar**
3. QR Code novo aparece — escanear com o número definitivo
4. Nenhuma variável de ambiente muda, nenhum código muda

---

## Pendências no código (`views.py`)

O arquivo `whatsapp/views.py` ainda tem resquícios do Twilio que precisam de limpeza:

- Linha ~153: referência a `resultado.get('sid')` (campo Twilio, Z-API não retorna isso)
- Linha ~162: texto "Verifique em: https://www.twilio.com/console/sms/logs" (hardcoded Twilio)
- Linha ~165: comentário "Erro de configuração Twilio"
- Linha ~224: comentário "Twilio requer URLs públicas"
- Linha ~251, 261: referências a `resultado.get('sid')` em `enviar_os_criada`
- Linha ~272: "Erro de configuração Twilio"
- `except: pass` nos blocos de erro JSON (linhas ~179, ~286) — usar logger

Esses itens não quebram o funcionamento com Z-API, mas devem ser limpos.

---

## Testar manualmente via curl (após parear)

```bash
# Status da instância
curl -s "https://api.z-api.io/instances/3F136285299931D66BDE2295B0810B48/token/848B1A5556EC4F9E483F75E8/status" \
  -H "Client-Token: Fd498b1a5c33f4084b21f12aff28bf27fS"

# Enviar mensagem de texto
curl -s -X POST "https://api.z-api.io/instances/3F136285299931D66BDE2295B0810B48/token/848B1A5556EC4F9E483F75E8/send-text" \
  -H "Content-Type: application/json" \
  -H "Client-Token: Fd498b1a5c33f4084b21f12aff28bf27fS" \
  -d '{"phone": "5531XXXXXXXXX", "message": "Teste de conexão"}'
```
