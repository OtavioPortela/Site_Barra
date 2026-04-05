# Frontend — Contexto e Setup Local

## Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7.2.4
- **Estilização**: Tailwind CSS 4
- **Roteamento**: React Router 7
- **HTTP Client**: Axios
- **Gráficos**: Recharts
- **Drag & Drop**: @dnd-kit
- **Notificações**: React Hot Toast

---

## Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/              # LoginForm
│   │   ├── billing/           # BillingChart, BillingMetrics, BillingTable
│   │   ├── common/            # Header, Sidebar, ProtectedRoute, Loading
│   │   └── dashboard/         # Kanban: OSBoard, OSCard, OSColumn
│   ├── contexts/
│   │   └── AuthContext.tsx    # Contexto global de autenticação
│   ├── pages/
│   │   ├── Dashboard.tsx      # Quadro Kanban principal
│   │   ├── Billing.tsx        # Faturamento / Métricas
│   │   ├── HistoricoOS.tsx    # Histórico de ordens
│   │   ├── Clientes.tsx       # Gestão de clientes
│   │   ├── Funcionarios.tsx   # Gestão de funcionários
│   │   ├── Configuracoes.tsx  # Configurações de listas (estado, tipo, cor)
│   │   ├── Debitos.tsx        # Débitos de parceiros
│   │   └── Login.tsx          # Tela de login
│   ├── services/
│   │   └── api.ts             # Instância Axios + interceptors JWT
│   ├── types/                 # Interfaces TypeScript
│   ├── utils/                 # Helpers gerais e printHelpers
│   ├── App.tsx                # Definição de rotas
│   └── main.tsx               # Entry point React
├── public/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm

### Passo a passo

```bash
cd frontend

# 1. Instalar dependências
npm install

# 2. Criar arquivo de variáveis de ambiente
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build de produção (TS + Vite) |
| `npm run preview` | Visualizar build de produção |
| `npm run lint` | ESLint |

---

## Variáveis de Ambiente

Crie o arquivo `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

> Em produção (Railway), o valor é a URL do backend deployado.

---

## Autenticação

- JWT armazenado em `localStorage.token`
- Dados do usuário em `localStorage.user`
- Todos os requests incluem `Authorization: Bearer {token}`
- Em resposta 401, redireciona automaticamente para `/login`
- **Access token**: 5 horas | **Refresh token**: 7 dias

---

## Páginas e Funcionalidades

### Dashboard (Kanban)
- Busca ordens não faturadas em `GET /api/ordens-servico/?faturada=false`
- Agrupa por status: `pendente` / `em_desenvolvimento` / `finalizada`
- Drag & Drop atualiza status via `PATCH /api/ordens-servico/{id}/`
- Filtros por status e intervalo de datas

### Faturamento
- Métricas de receita (total, mensal, semanal, ticket médio)
- Gráfico de 12 meses de histórico
- Top 10 clientes por receita
- Filtro por data e cliente

### Histórico de OS
- Lista todas as ordens com filtros
- Exportação para Excel

### Configurações
- Gerencia listas de dropdowns: estado do cabelo, tipo, cor, cor de linha

---

## Endpoints Consumidos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login/` | Autenticação |
| GET | `/api/auth/me/` | Usuário atual |
| GET | `/api/auth/funcionarios/` | Listar funcionários |
| GET/POST | `/api/clientes/` | Clientes |
| GET/POST | `/api/ordens-servico/` | Ordens de serviço |
| PATCH | `/api/ordens-servico/{id}/` | Atualizar OS |
| POST | `/api/ordens-servico/{id}/faturar/` | Faturar OS |
| GET | `/api/faturamento/` | Dados de faturamento |
| GET | `/api/servicos/` | Serviços |
| GET | `/api/configuracoes/...` | Configs de dropdowns |
| GET | `/api/debitos/` | Débitos de parceiros |

---

## Pontos de Atenção para Ajustes

- `src/services/api.ts` — onde fica a instância Axios e os interceptors. Qualquer mudança de headers ou lógica de refresh token começa aqui.
- `src/contexts/AuthContext.tsx` — lógica central de login/logout/usuário logado.
- `src/App.tsx` — definição de todas as rotas e proteção via `ProtectedRoute`.
- Tailwind 4 usa configuração via CSS (`@import "tailwindcss"`) — não há `tailwind.config.js`.
