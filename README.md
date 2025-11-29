# Sistema Barra Confecções

Sistema web completo para gerenciamento de ordens de serviço (OS) com integração a backend Django REST Framework.

## 📁 Estrutura do Projeto

```
site-barra/
├── frontend/          # Aplicação React + TypeScript
│   ├── src/           # Código fonte do frontend
│   ├── package.json   # Dependências Node.js
│   └── README.md      # Documentação do frontend
│
├── backend/            # API Django REST Framework
│   ├── apps/          # Apps Django
│   ├── core/          # Configurações Django
│   ├── manage.py      # CLI Django
│   ├── requirements.txt # Dependências Python
│   └── README.md      # Documentação do backend
│
├── docker-compose.yml  # Orquestração dos serviços
└── README.md          # Este arquivo
```

## 🚀 Tecnologias

### Frontend
- **React 19** com **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **Axios** - Comunicação com API

### Backend
- **Python 3.11**
- **Django 4.2.7**
- **Django REST Framework 3.14.0**
- **PostgreSQL 15**
- **Docker** - Containerização

## 📦 Instalação Rápida

### 1. Backend (Docker)

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

### 2. Frontend

```bash
cd frontend
npm install

# Criar arquivo .env.local
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Iniciar servidor
npm run dev
```

## 🏃 Executar

### Backend
```bash
# Com Docker (recomendado)
docker-compose up

# Ou localmente
cd backend
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm run dev
```

## 🌐 URLs

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/api/docs/`

## 🔐 Credenciais Padrão

- **Email:** `admin@barraconfeccoes.com`
- **Senha:** `admin123`

## 🎯 Funcionalidades

### 1. Autenticação
- Login com email e senha
- Validação de campos
- Armazenamento seguro de token JWT
- Proteção de rotas

### 2. Dashboard
- Visualização de OS em cards
- Kanban Board com 3 colunas (Pendente, Em Desenvolvimento, Finalizadas)
- Drag and Drop para mudar status
- Filtros e busca
- Botão para criar nova OS

### 3. Faturamento
- Métricas principais (Total, Mensal, Semanal, Ticket Médio)
- Gráficos interativos:
  - Faturamento ao longo do tempo
  - Distribuição por status
  - Top clientes
- Tabela detalhada de OS finalizadas
- Filtros por data e cliente

## 🔌 Endpoints da API

A aplicação espera os seguintes endpoints:

- `POST /api/auth/login/` - Login
- `GET /api/ordens-servico/` - Listar OS
- `POST /api/ordens-servico/` - Criar OS
- `PATCH /api/ordens-servico/{id}/` - Atualizar OS
- `GET /api/faturamento/` - Dados de faturamento

## 📝 Notas

- A aplicação está configurada para rodar na porta 3000
- As rotas são protegidas e redirecionam para login se não autenticado
- O token JWT é armazenado no localStorage
- Erros de autenticação (401) redirecionam automaticamente para login
