# Sistema Barra Confecções - Documentação Completa

## 📋 Visão Geral

Sistema web completo para gerenciamento de ordens de serviço (OS) para confecções, desenvolvido com **Django REST Framework** no backend e **React + TypeScript** no frontend. O sistema permite gerenciar ordens de serviço, clientes, funcionários, faturamento e integração com WhatsApp via Twilio.

**Status Atual:** ✅ **Em produção no Railway** para testes do cliente

**URLs de Produção:**
- **Backend:** `https://sitebarra-production.up.railway.app`
- **Frontend:** `https://glistening-respect-production-7330.up.railway.app`

---

## 🏗️ Arquitetura

### Estrutura do Projeto

```
site-barra/
├── backend/                    # API Django REST Framework
│   ├── apps/
│   │   ├── authentication/     # Autenticação JWT
│   │   ├── ordens_servico/     # OS, Clientes, Serviços
│   │   ├── whatsapp/           # Integração Twilio
│   │   └── faturamento/        # Relatórios e métricas
│   ├── core/                   # Configurações Django
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── media/                  # Uploads (fotos_entrega/)
│   ├── staticfiles/            # Arquivos estáticos
│   ├── Dockerfile              # Imagem Docker
│   ├── entrypoint.sh           # Script de inicialização
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                   # Aplicação React + TypeScript
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── auth/           # LoginForm
│   │   │   ├── billing/        # BillingChart, BillingMetrics, BillingTable
│   │   │   ├── common/         # Header, Sidebar, Loading, ProtectedRoute
│   │   │   └── dashboard/      # OSBoard, OSCard, SortableOSCard, etc.
│   │   ├── contexts/           # AuthContext
│   │   ├── pages/              # Dashboard, Clientes, Funcionarios, etc.
│   │   ├── services/           # api.ts, whatsappService.ts
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Helpers
│   ├── dist/                   # Build de produção
│   ├── nixpacks.toml           # Config Railway (frontend)
│   └── package.json
│
├── docker-compose.yml          # Orquestração local
├── README.md
└── .gitignore
```

---

## 🚀 Tecnologias Utilizadas

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Python** | 3.11 | Linguagem principal |
| **Django** | 4.2.7 | Framework web |
| **Django REST Framework** | 3.14.0 | API REST |
| **Django REST Framework Simple JWT** | 5.3.0 | Autenticação JWT |
| **PostgreSQL** | 15 | Banco de dados |
| **Gunicorn** | 21.2.0 | Servidor WSGI |
| **Django CORS Headers** | 4.3.0 | CORS configuration |
| **Pillow** | 10.1.0 | Processamento de imagens |
| **requests** | 2.31.0 | HTTP client (Twilio) |
| **python-decouple** | 3.8 | Gerenciamento de variáveis de ambiente |
| **WhiteNoise** | 6.6.0 | Servir arquivos estáticos |

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 19.2.0 | Framework UI |
| **TypeScript** | 5.9.3 | Tipagem estática |
| **Vite** | 7.2.4 | Build tool |
| **Tailwind CSS** | 4.1.17 | Estilização |
| **React Router** | 7.9.6 | Roteamento |
| **Axios** | 1.13.2 | HTTP client |
| **@dnd-kit** | 6.3.1+ | Drag and Drop |
| **Recharts** | 3.5.0 | Gráficos |
| **React Hot Toast** | 2.6.0 | Notificações |

### DevOps

| Ferramenta | Uso |
|------------|-----|
| **Docker** | Containerização |
| **Docker Compose** | Orquestração local |
| **Railway** | Deploy em produção |
| **Nixpacks** | Build system (Railway) |
| **Git** | Controle de versão |

---

## 📦 Instalação e Configuração

### Pré-requisitos

- **Node.js** 22.x
- **Python** 3.11+
- **Docker** e **Docker Compose** (para desenvolvimento local)
- **PostgreSQL** 15 (ou usar Docker)

### Instalação Local

#### 1. Backend (com Docker)

```bash
# Criar arquivo .env no diretório backend/
cd backend
cat > .env << 'EOF'
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DATABASE_NAME=barra_confeccoes
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=db
DATABASE_PORT=5432
SUPERUSER_EMAIL=admin@barraconfeccoes.com
SUPERUSER_PASSWORD=admin123
EOF

# Voltar para raiz e iniciar
cd ..
docker-compose up --build -d
```

#### 2. Frontend

```bash
cd frontend
npm install

# Criar arquivo .env.local
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

### URLs Locais

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **API Docs (Swagger):** `http://localhost:8000/api/docs/`

---

## 🗄️ Modelos de Dados

### Cliente

```python
class Cliente(models.Model):
    nome = CharField(max_length=200)
    cnpj_cpf = CharField(max_length=18, unique=True)
    email = EmailField(blank=True)
    telefone = CharField(max_length=20)
    endereco = TextField(blank=True)
    ativo = BooleanField(default=True)
    data_cadastro = DateTimeField(auto_now_add=True)
```

### Ordem de Serviço

```python
class OrdemServico(models.Model):
    numero = CharField(max_length=20, unique=True)
    cliente = ForeignKey(Cliente)
    descricao = TextField(blank=True)
    status = CharField(choices=['pendente', 'em_desenvolvimento', 'finalizada'])

    # Detalhes do cabelo
    tipo_cabelo = CharField(choices=['liso', 'ondulado', 'cacheado', 'crespo'])
    estado_cabelo = CharField(choices=['novo', 'descolorido', 'branco', 'preto', ...])
    cor_cabelo = CharField(max_length=50)
    peso_gramas = IntegerField()
    tamanho_cabelo_cm = IntegerField()
    cor_linha = CharField(max_length=50)

    # Financeiro
    valor = DecimalField(max_digits=10, decimal_places=2)
    servico = ForeignKey(Servico)
    valor_metro = DecimalField(max_digits=10, decimal_places=2)

    # Status e datas
    prazo_entrega = DateField()
    data_finalizacao = DateTimeField(null=True, blank=True)
    faturada = BooleanField(default=False)
    data_faturamento = DateTimeField(null=True, blank=True)
    entregue = BooleanField(default=False)

    # Pagamento
    pago_na_entrega = BooleanField(default=False)
    forma_pagamento = CharField(choices=['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'])

    # Media
    foto_entrega = ImageField(upload_to='fotos_entrega/', blank=True, null=True)

    usuario_criacao = ForeignKey(Usuario)
```

### Serviço

```python
class Servico(models.Model):
    nome = CharField(max_length=100, unique=True)
    descricao = TextField(blank=True)
    ativo = BooleanField(default=True)
    data_criacao = DateTimeField(auto_now_add=True)
```

### Usuário (Authentication)

```python
class Usuario(AbstractUser):
    nome_completo = CharField(max_length=200)
    email = EmailField(unique=True)
    is_patro = BooleanField(default=False)  # Permissões admin
```

---

## 🔌 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/login/` | Login (retorna JWT) |

### Ordens de Serviço

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/ordens-servico/` | Listar todas as OS |
| `POST` | `/api/ordens-servico/` | Criar nova OS |
| `GET` | `/api/ordens-servico/{id}/` | Detalhes da OS |
| `PATCH` | `/api/ordens-servico/{id}/` | Atualizar OS |
| `POST` | `/api/ordens-servico/{id}/marcar-entregue/` | Marcar como entregue |
| `POST` | `/api/ordens-servico/{id}/faturar/` | Faturar OS |

### Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/clientes/` | Listar clientes |
| `POST` | `/api/clientes/` | Criar cliente |
| `GET` | `/api/clientes/{id}/` | Detalhes do cliente |
| `PATCH` | `/api/clientes/{id}/` | Atualizar cliente |
| `DELETE` | `/api/clientes/{id}/` | Deletar cliente |

### Serviços

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/servicos/` | Listar serviços |
| `POST` | `/api/servicos/` | Criar serviço |
| `PATCH` | `/api/servicos/{id}/` | Atualizar serviço |

### Faturamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/faturamento/` | Métricas e dados de faturamento |

### WhatsApp (Twilio)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/whatsapp/enviar-texto/` | Enviar mensagem de texto |
| `POST` | `/api/whatsapp/enviar-imagem/` | Enviar imagem |
| `POST` | `/api/whatsapp/enviar-os-finalizada/` | Notificar OS finalizada |
| `POST` | `/api/whatsapp/enviar-os-criada/` | Notificar OS criada |

---

## 🎨 Funcionalidades do Frontend

### 1. Autenticação

- ✅ Login com email e senha
- ✅ Armazenamento de token JWT no localStorage
- ✅ Rotas protegidas (ProtectedRoute)
- ✅ Redirecionamento automático em caso de erro 401
- ✅ Context API para gerenciamento de estado de autenticação

### 2. Dashboard (Kanban Board)

- ✅ Visualização de OS em 3 colunas:
  - **Pendente**
  - **Em Desenvolvimento**
  - **Finalizadas**
- ✅ Drag and Drop para mudar status
- ✅ Filtros e busca
- ✅ Paginação (limite de 10 itens por coluna)
- ✅ Cards responsivos
- ✅ Modal de detalhes da OS (com foto de criação)
- ✅ Ações rápidas nos cards:
  - Marcar como entregue
  - Emitir nota
  - Faturar

### 3. Gestão de OS

- ✅ **Criar OS:** Formulário completo com:
  - Seleção de cliente
  - Detalhes do cabelo (tipo, estado, cor, peso, tamanho, linha)
  - Serviço, valor, valor por metro
  - Prazo de entrega
  - Foto de criação
- ✅ **Visualizar OS:** Modal com todos os detalhes
- ✅ **Editar OS:** PATCH para atualizar campos
- ✅ **Marcar como Entregue:**
  - Opção de emitir nota
  - Forma de pagamento (dinheiro, PIX, cartão crédito/débito)
  - Removida opção de tirar foto na entrega
- ✅ **Emitir Nota:** Modal para impressão (mesmo formato usado na entrega)
- ✅ **Faturar OS:** Validação para OS já pagas na entrada

### 4. Clientes

- ✅ CRUD completo
- ✅ Tabela responsiva (mobile-friendly)
- ✅ Filtros e busca
- ✅ Formulário de criação/edição

### 5. Funcionários

- ✅ CRUD completo
- ✅ Tabela responsiva (mobile-friendly)
- ✅ Diferenciação de permissões (Admin vs Funcionário)

### 6. Faturamento

- ✅ **Métricas principais:**
  - Total faturado
  - Faturamento mensal
  - Faturamento semanal
  - Ticket médio
- ✅ **Gráficos (Recharts):**
  - Faturamento ao longo do tempo
  - Distribuição por status
  - Top clientes
- ✅ **Tabela detalhada:** OS finalizadas com filtros

### 7. Histórico de OS

- ✅ Visualização de OS finalizadas
- ✅ Filtros por data e cliente
- ✅ Status de faturamento

### 8. UI/UX

- ✅ **Menu lateral tipo sandwich** (hambúrguer) - aparece e desaparece
- ✅ **Header compacto** (sem logo "Barra Confecções" em telas menores)
- ✅ **Design responsivo** para mobile (sem necessidade de rolar lateralmente)
- ✅ **Paginação** para evitar scroll excessivo
- ✅ **Loading states** e feedback visual
- ✅ **Toasts** para notificações (React Hot Toast)

---

## 📱 Integração WhatsApp (Twilio)

### Configuração

O sistema utiliza a **Twilio WhatsApp API** para envio de mensagens e notificações automáticas.

**Variáveis de Ambiente (Railway):**
- `TWILIO_ACCOUNT_SID`: Account SID da Twilio
- `TWILIO_AUTH_TOKEN`: Auth Token da Twilio
- `TWILIO_WHATSAPP_FROM`: Número do Twilio Sandbox (`whatsapp:+14155238886`)

### Funcionalidades

1. **Envio de Mensagem de Texto**
   - API: `POST /api/whatsapp/enviar-texto/`
   - Parâmetros: `numero`, `mensagem`

2. **Envio de Imagem**
   - API: `POST /api/whatsapp/enviar-imagem/`
   - Parâmetros: `numero`, `mensagem`, `url_imagem`
   - Requer URL pública (HTTPS)

3. **Notificação de OS Finalizada**
   - API: `POST /api/whatsapp/enviar-os-finalizada/{id}/`
   - Envia notificação automática quando OS é finalizada
   - Formata nota no mesmo padrão usado na impressão

4. **Notificação de OS Criada**
   - API: `POST /api/whatsapp/enviar-os-criada/{id}/`
   - Envia notificação automática quando nova OS é criada
   - Inclui foto da OS se disponível

### Validações Implementadas

- ✅ Verifica se Twilio está configurado
- ✅ Valida que `TWILIO_WHATSAPP_FROM` está definido
- ✅ **Valida que From e To são diferentes** (Twilio não permite enviar para o próprio número)
- ✅ Tratamento de erros com mensagens claras

### Formatação de Nota

A nota é formatada em texto plano no mesmo padrão usado para impressão:

```
═══════════════════════════════════
    ORDEM DE SERVIÇO Nº {numero}
═══════════════════════════════════

Cliente: {cliente.nome}
CNPJ/CPF: {cliente.cnpj_cpf}
Data de Criação: {data_criacao}
Prazo de Entrega: {prazo_entrega}

[... outros campos ...]

Valor Total: R$ {valor}
Forma de Pagamento: {forma_pagamento}
═══════════════════════════════════
```

---

## 🚀 Deploy no Railway

### Estrutura de Serviços

O projeto está dividido em 3 serviços no Railway:

1. **Backend (Site_Barra)**
   - Dockerfile customizado
   - Entrypoint.sh para inicialização
   - PostgreSQL como banco de dados

2. **Frontend (glistening-respect)**
   - Nixpacks (detecção automática)
   - `nixpacks.toml` para configuração explícita
   - Servidor `serve` para arquivos estáticos

3. **Database (Postgres)**
   - Volume persistente (`postgres-volume`)
   - Conexão via `DATABASE_HOST=postgres.railway.internal`

### Configuração do Backend (Railway)

**Root Directory:** `backend`

**Build Command:** (gerenciado pelo Dockerfile)

**Start Command:**
```bash
bash entrypoint.sh gunicorn --bind 0.0.0.0:$PORT --workers 3 core.wsgi:application
```

**Variáveis de Ambiente:**

```env
SECRET_KEY=<secret-key>
DEBUG=False
ALLOWED_HOSTS=sitebarra-production.up.railway.app
DATABASE_HOST=postgres.railway.internal
DATABASE_PORT=5432
DATABASE_NAME=railway
DATABASE_USER=postgres
DATABASE_PASSWORD=<railway-generated>
SUPERUSER_EMAIL=admin@barraconfeccoes.com
SUPERUSER_PASSWORD=admin123
TWILIO_ACCOUNT_SID=ACaee92e2f5590d62ac1fa0ddb91aeaca3
TWILIO_AUTH_TOKEN=088ea840ba20dd3c8a082c30cb71fe4b
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
RAILWAY_MODE=True
PORT=<railway-injected>
```

### Configuração do Frontend (Railway)

**Root Directory:** `frontend`

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npx serve -s dist -l $PORT
```

**Variáveis de Ambiente:**

```env
VITE_API_URL=https://sitebarra-production.up.railway.app/api
PORT=<railway-injected>
```

**nixpacks.toml:**

```toml
[phases.setup]
nixPkgs = ["nodejs-22_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve -s dist -l ${PORT}"
```

### Configurações CORS

O backend está configurado para permitir todas as origens quando `RAILWAY_MODE=True`:

```python
RAILWAY_MODE = config('RAILWAY_MODE', default=True, cast=bool)

if RAILWAY_MODE:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [...] # Lista de origens permitidas
```

---

## 🔐 Credenciais

### Ambiente Local

- **Admin:**
  - Email: `admin@barraconfeccoes.com`
  - Senha: `admin123`

- **Funcionário:**
  - Email: `func@barraconfeccoes.com`
  - Senha: `Barr@12345678`

### Ambiente de Produção (Railway)

- **Admin:**
  - Email: `admin@barraconfeccoes.com`
  - Senha: `admin123`

*(Credenciais são criadas automaticamente via entrypoint.sh)*

---

## 🐳 Docker

### docker-compose.yml

O projeto utiliza Docker Compose para orquestração local:

```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: bash entrypoint.sh gunicorn --bind 0.0.0.0:8000 --workers 3 core.wsgi:application
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
```

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Dar permissão de execução ao entrypoint.sh
RUN chmod +x entrypoint.sh

# Criar diretório para arquivos estáticos
RUN mkdir -p /app/staticfiles

CMD ["bash", "entrypoint.sh", "gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "core.wsgi:application"]
```

### entrypoint.sh

Script de inicialização que:
1. Aguarda PostgreSQL estar disponível
2. Executa migrações (`makemigrations` e `migrate`)
3. Coleta arquivos estáticos (`collectstatic`)
4. Cria superusuário se não existir
5. Inicia Gunicorn

**Compatibilidade Railway:**
- Usa variáveis de ambiente do Railway (`DATABASE_HOST`, `PORT`)
- Expande corretamente a variável `$PORT` para o Gunicorn

---

## 📊 Fluxo de Trabalho (Workflow)

### 1. Criação de OS

1. Usuário acessa Dashboard
2. Clica em "Criar OS"
3. Preenche formulário:
   - Seleciona cliente
   - Preenche detalhes do cabelo
   - Define valor e prazo
   - Faz upload de foto (opcional)
4. Sistema cria OS com status "Pendente"
5. **Notificação automática via WhatsApp** (se configurado)

### 2. Desenvolvimento

1. Usuário arrasta OS para coluna "Em Desenvolvimento"
2. Sistema atualiza status via API PATCH
3. OS fica visível na coluna correspondente

### 3. Finalização

1. Usuário arrasta OS para coluna "Finalizadas"
2. Sistema atualiza `data_finalizacao` e status
3. OS aparece em "Faturamento" e "Histórico"

### 4. Entrega

1. Usuário clica em "Marcar como Entregue"
2. Modal permite:
   - Emitir nota (opcional)
   - Selecionar forma de pagamento
   - Salvar informações
3. Sistema atualiza `entregue=True` e `forma_pagamento`
4. **Nota formatada** pode ser impressa/copiada

### 5. Faturamento

1. Usuário acessa "Faturamento"
2. Visualiza métricas e gráficos
3. Para OS **não pagas na entrega**, pode clicar em "Faturar"
4. Sistema atualiza `faturada=True` e `data_faturamento`
5. OS sai da coluna "Finalizadas" (apenas se já foi faturada)

**Lógica Especial:**
- OS **pagas na entrada** (`pago_na_entrega=True`) aparecem com botão "Faturar" mesmo depois de entregues
- Permite que o dono valide e fature antes de remover da coluna

---

## 🔧 Comandos Úteis

### Backend

```bash
# Migrações
python manage.py makemigrations
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Coletar arquivos estáticos
python manage.py collectstatic

# Shell Django
python manage.py shell

# Rodar servidor de desenvolvimento
python manage.py runserver

# Com Docker
docker-compose up --build
docker-compose down
docker-compose logs -f web
```

### Frontend

```bash
# Instalar dependências
npm install

# Modo de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Git

```bash
# Status
git status

# Adicionar mudanças
git add .

# Commit
git commit -m "Mensagem do commit"

# Push
git push origin main

# Ver logs
git log --oneline
```

---

## 🐛 Troubleshooting

### Erro: "Twilio não configurado"

**Solução:** Verificar se `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_WHATSAPP_FROM` estão configurados no Railway.

### Erro: "From e To são iguais"

**Solução:** O cliente cadastrado está usando o mesmo número do Twilio Sandbox. Alterar o número do cliente ou usar outro número para teste.

### Erro: "CORS policy blocked"

**Solução:** Verificar se `RAILWAY_MODE=True` está configurado no backend e se `CORS_ALLOW_ALL_ORIGINS=True` está ativo.

### Erro: "$PORT is not a valid port number"

**Solução:** Verificar se o `entrypoint.sh` está expandindo corretamente a variável `$PORT`:

```bash
PORT_VALUE="${PORT:-8000}"
CMD=$(echo "$CMD" | sed "s/\$PORT/$PORT_VALUE/g")
exec bash -c "$CMD"
```

### Erro: "db: forward host lookup failed"

**Solução:** No Railway, o host do banco é `postgres.railway.internal`, não `db`. O `entrypoint.sh` já está configurado para usar `${DATABASE_HOST}`.

---

## 📝 Notas de Desenvolvimento

### Funcionalidades Implementadas Recentemente

1. ✅ **Remoção de foto na entrega** - Mantida apenas opção de emitir nota
2. ✅ **Forma de pagamento** - Adicionada à OS (dinheiro, PIX, cartão)
3. ✅ **Validação de faturamento** - OS pagas na entrada precisam ser validadas
4. ✅ **Menu lateral tipo sandwich** - Responsivo para mobile
5. ✅ **Header compacto** - Removido logo em telas menores
6. ✅ **Paginação** - Limite de 10 itens por coluna no Kanban
7. ✅ **Responsividade** - Telas de Clientes e Funcionários otimizadas para mobile
8. ✅ **Validação Twilio** - Prevenção de erro "From e To iguais"

### Melhorias Futuras (Sugestões)

- [ ] Testes automatizados (unitários e integração)
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Dashboard com mais métricas e gráficos
- [ ] Sistema de notificações in-app
- [ ] Histórico de alterações nas OS
- [ ] Suporte a múltiplos formatos de nota fiscal
- [ ] Integração com sistemas de pagamento (Stripe, PagSeguro)
- [ ] App mobile (React Native)

---

## 📞 Contato e Suporte

**Credenciais Twilio:**
- Account SID: `ACaee92e2f5590d62ac1fa0ddb91aeaca3`
- Auth Token: `088ea840ba20dd3c8a082c30cb71fe4b`
- WhatsApp From: `whatsapp:+14155238886`

**Links Railway:**
- Projeto: `https://railway.com/project/949c09df-1c13-448b-8eed-30cae96cf50a`

---

## 📄 Licença

Este projeto foi desenvolvido para uso interno da Barra Confecções.

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0.0
**Status:** ✅ Em produção

