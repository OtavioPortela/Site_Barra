# Backend — Contexto e Setup Local

## Stack

- **Linguagem**: Python 3.11
- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Autenticação**: SimpleJWT 5.3.0
- **Banco de Dados**: PostgreSQL 15
- **Servidor de Produção**: Gunicorn
- **Arquivos Estáticos**: WhiteNoise
- **Docs API**: drf-yasg (Swagger/OpenAPI)
- **Extras**: openpyxl (Excel), Pillow (imagens), Twilio (WhatsApp)

---

## Estrutura de Pastas

```
backend/
├── apps/
│   ├── authentication/        # Auth JWT, modelo Usuario customizado
│   │   ├── models.py          # Usuario (AbstractUser com email como campo de login)
│   │   ├── views.py           # LoginView, RegisterView, logout, me, FuncionarioViewSet
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── ordens_servico/        # Lógica principal de negócio
│   │   ├── models.py          # Cliente, OrdemServico, Servico, configs de cabelo
│   │   ├── views.py           # ClienteViewSet, OrdemServicoViewSet, etc.
│   │   ├── serializers.py
│   │   ├── permissions.py     # IsStaffOnly, IsOwnerOrReadOnly
│   │   ├── urls.py            # Roteamento principal
│   │   ├── urls_clientes.py
│   │   ├── urls_servicos.py
│   │   ├── urls_configuracoes.py
│   │   └── urls_debitos.py
│   │
│   ├── faturamento/           # Relatórios e métricas financeiras
│   │   ├── views.py           # dashboard_view, por_periodo_view, por_cliente_view
│   │   └── urls.py
│   │
│   └── whatsapp/              # Integração Twilio WhatsApp
│       ├── views.py
│       └── urls.py
│
├── core/                      # Configuração Django
│   ├── settings.py
│   ├── urls.py                # Roteador principal
│   ├── wsgi.py
│   └── asgi.py
│
├── manage.py
├── requirements.txt
├── Dockerfile
├── entrypoint.sh              # Script Docker: migrate → collectstatic → createsuperuser → gunicorn
└── .env.backup                # Template de variáveis de ambiente
```

---

## Modelos Principais

### `Usuario` (apps/authentication)
```
email (único, campo de login)
nome_completo, cargo, telefone
ativo, data_criacao
```

### `Cliente` (apps/ordens_servico)
```
nome, cpf_cnpj, email, telefone
parceiro (boolean — habilita controle de débitos)
ativo
```

### `OrdemServico` (apps/ordens_servico)
```
cliente, servico, funcionario
status: pendente | em_desenvolvimento | finalizada
# Campos específicos de cabelo:
estado_cabelo, tipo_cabelo, cor_cabelo
peso_gramas, tamanho_cabelo_cm, cor_linha
# Financeiro:
valor (total), valor_metro (por metro)
faturada (bool), data_faturamento, forma_pagamento
# Entrega:
prazo_entrega, data_finalizacao, entregue, foto_entrega
```

### Tabelas de configuração
`EstadoCabelo`, `TipoCabelo`, `CorCabelo`, `CorLinha` — alimentam os dropdowns do frontend.

---

## Rodar Localmente

### Opção 1 — Docker Compose (recomendado)

```bash
# Na raiz do projeto (onde está o docker-compose.yml)

# 1. Criar .env do backend
cp backend/.env.backup backend/.env
# Editar backend/.env se necessário

# 2. Subir todos os serviços
docker-compose up --build -d

# Acompanhar logs
docker-compose logs -f web
```

Acesse: `http://localhost:8000`
Docs Swagger: `http://localhost:8000/api/docs/`

---

### Opção 2 — Ambiente Python local (sem Docker)

Requer PostgreSQL rodando localmente.

```bash
cd backend

# 1. Criar e ativar virtualenv
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Criar .env local
cp .env.backup .env
```

Editar `backend/.env` com as configurações do banco local:

```env
SECRET_KEY=django-insecure-dev-key-change-in-production-123456789
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

DATABASE_NAME=barra_confeccoes
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost          # <-- localhost quando rodar sem Docker
DATABASE_PORT=5432

SUPERUSER_EMAIL=admin@barraconfeccoes.com
SUPERUSER_PASSWORD=admin123
```

```bash
# 4. Criar banco no PostgreSQL local
psql -U postgres -c "CREATE DATABASE barra_confeccoes;"

# 5. Rodar migrações
python manage.py migrate

# 6. Criar superusuário
python manage.py createsuperuser

# 7. Iniciar servidor
python manage.py runserver
```

---

## Variáveis de Ambiente

| Variável | Descrição | Padrão local |
|---|---|---|
| `SECRET_KEY` | Chave secreta Django | `django-insecure-dev-key...` |
| `DEBUG` | Modo debug | `True` |
| `ALLOWED_HOSTS` | Hosts permitidos | `localhost,127.0.0.1,0.0.0.0` |
| `DATABASE_NAME` | Nome do banco | `barra_confeccoes` |
| `DATABASE_USER` | Usuário do banco | `postgres` |
| `DATABASE_PASSWORD` | Senha do banco | `postgres` |
| `DATABASE_HOST` | Host do banco | `db` (Docker) / `localhost` (local) |
| `DATABASE_PORT` | Porta do banco | `5432` |
| `SUPERUSER_EMAIL` | Email do admin | `admin@barraconfeccoes.com` |
| `SUPERUSER_PASSWORD` | Senha do admin | `admin123` |
| `CORS_ALLOWED_ORIGINS` | Origins permitidas | `http://localhost:3000` |
| `TWILIO_ACCOUNT_SID` | Twilio (opcional) | vazio |
| `TWILIO_AUTH_TOKEN` | Twilio (opcional) | vazio |
| `RAILWAY_MODE` | Ativa configs Railway | `True` em produção |

> **Atenção**: quando usar Docker Compose, `DATABASE_HOST=db` (nome do container). Quando rodar localmente sem Docker, `DATABASE_HOST=localhost`.

---

## Credenciais Padrão (dev)

```
Email:    admin@barraconfeccoes.com
Senha:    admin123
```

---

## Endpoints Principais

### Autenticação
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login/` | Login — retorna access + refresh token |
| POST | `/api/auth/register/` | Cadastro de usuário |
| POST | `/api/auth/logout/` | Logout (blacklist do refresh token) |
| GET | `/api/auth/me/` | Dados do usuário autenticado |
| GET | `/api/auth/funcionarios/` | Listar funcionários |

### Ordens de Serviço
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/ordens-servico/` | Listar/criar ordens |
| GET/PATCH | `/api/ordens-servico/{id}/` | Detalhe/atualizar OS |
| POST | `/api/ordens-servico/{id}/faturar/` | Marcar como faturada |
| POST | `/api/ordens-servico/{id}/desfaturar/` | Desmarcar faturamento |

Filtros disponíveis: `?status=`, `?cliente=`, `?faturada=`, `?historico=`

### Clientes
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/api/clientes/` | Listar/criar clientes |
| GET/PATCH/DELETE | `/api/clientes/{id}/` | Detalhe/editar/remover |

Filtros: `?ativo=`, `?search=`

### Financeiro
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/faturamento/` | Dashboard financeiro |
| GET | `/api/debitos/` | Débitos de clientes parceiros |
| GET | `/api/servicos/` | Serviços cadastrados |

### Configurações
| Endpoint | Descrição |
|---|---|
| `/api/configuracoes/estado-cabelo/` | Estado do cabelo |
| `/api/configuracoes/tipo-cabelo/` | Tipo do cabelo |
| `/api/configuracoes/cor-cabelo/` | Cor do cabelo |
| `/api/configuracoes/cor-linha/` | Cor da linha |

### Utilitários
| Endpoint | Descrição |
|---|---|
| `/api/docs/` | Swagger — documentação interativa |
| `/health/` | Health check (Railway) |

---

## JWT — Configuração

- **Access token lifetime**: 5 horas
- **Refresh token lifetime**: 7 dias
- **Algoritmo**: HS256
- **Header**: `Authorization: Bearer {token}`
- Token blacklist ativo (logout invalida o refresh token)

---

## Permissões

| Permissão | Quem tem acesso |
|---|---|
| `IsAuthenticated` | Qualquer usuário logado |
| `IsStaffOnly` | Apenas `is_staff=True` (faturamento, funcionários, relatórios) |
| `IsOwnerOrReadOnly` | Dono do objeto ou leitura pública |

---

## Docker Compose — Serviços

```yaml
db:       PostgreSQL 15-alpine  (porta 5432)
web:      Django/Gunicorn       (porta 8000)
```

**Startup do `web`**: `entrypoint.sh` executa na ordem:
1. Aguarda o banco ficar disponível
2. `python manage.py migrate`
3. `python manage.py collectstatic`
4. Cria superusuário (se `SUPERUSER_EMAIL` estiver definido)
5. Inicia `gunicorn` com 3 workers

---

## Pontos de Atenção para Ajustes

- `core/settings.py` — configurações centrais: JWT, CORS, CSRF, banco, apps instalados.
- `apps/ordens_servico/models.py` — principal modelo de negócio; qualquer novo campo na OS começa aqui.
- `apps/ordens_servico/serializers.py` — controla o que vai e vem na API; checar campos `read_only` e validações.
- `apps/faturamento/views.py` — lógica das queries de faturamento; otimizar aqui se precisar de filtros ou agrupamentos novos.
- `apps/authentication/models.py` — modelo `Usuario`; campos de perfil e cargo ficam aqui.
- Para adicionar um novo campo ao banco: criar em `models.py` → `python manage.py makemigrations` → `python manage.py migrate`.
