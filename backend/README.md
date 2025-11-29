# Backend - Sistema Barra Confecções

Backend Django REST Framework para gerenciamento de ordens de serviço.

## 🚀 Tecnologias

- **Python 3.11**
- **Django 4.2.7**
- **Django REST Framework 3.14.0**
- **Django REST Framework Simple JWT 5.3.0**
- **PostgreSQL 15**
- **Gunicorn 21.2.0**
- **Django CORS Headers 4.3.0**
- **DRF YASG 1.21.7** (Swagger)

## 📦 Instalação

### Com Docker (Recomendado)

```bash
# Na raiz do projeto
docker-compose up --build
```

### Local

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

## 🔧 Configuração

Crie um arquivo `.env` na raiz deste diretório:

```env
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_NAME=barra_confeccoes
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=db  # ou localhost se rodando localmente
DATABASE_PORT=5432

SUPERUSER_EMAIL=admin@barraconfeccoes.com
SUPERUSER_PASSWORD=admin123
```

## 🏃 Executar

### Com Docker

```bash
# Na raiz do projeto
docker-compose up
```

### Local

```bash
# Configurar banco de dados PostgreSQL primeiro
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## 📁 Estrutura

```
backend/
├── apps/
│   ├── authentication/    # App de autenticação (JWT)
│   ├── ordens_servico/    # App de OS e Clientes
│   └── faturamento/       # App de faturamento
├── core/
│   ├── settings.py        # Configurações Django
│   ├── urls.py            # URLs principais
│   ├── wsgi.py            # WSGI para produção
│   └── asgi.py            # ASGI para produção
├── manage.py              # CLI do Django
├── requirements.txt       # Dependências Python
├── Dockerfile             # Imagem Docker
└── entrypoint.sh          # Script de inicialização
```

## 🔌 Endpoints da API

- `POST /api/auth/login/` - Login
- `GET /api/ordens-servico/` - Listar OS
- `POST /api/ordens-servico/` - Criar OS
- `PATCH /api/ordens-servico/{id}/` - Atualizar OS
- `GET /api/clientes/` - Listar clientes
- `POST /api/clientes/` - Criar cliente
- `GET /api/faturamento/` - Dados de faturamento
- `GET /api/docs/` - Documentação Swagger

## 📝 Comandos Úteis

```bash
# Migrações
python manage.py makemigrations
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Shell Django
python manage.py shell

# Coletar arquivos estáticos
python manage.py collectstatic
```

## 🔐 Credenciais Padrão

- **Email:** `admin@barraconfeccoes.com`
- **Senha:** `admin123`

O superusuário é criado automaticamente pelo `entrypoint.sh` quando usando Docker.

