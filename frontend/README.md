# Frontend - Sistema Barra Confecções

Frontend React + TypeScript para gerenciamento de ordens de serviço.

## 🚀 Tecnologias

- **React 19** com **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **Axios** - Comunicação com API
- **@dnd-kit** - Drag and Drop
- **Recharts** - Gráficos
- **React Hot Toast** - Notificações

## 📦 Instalação

```bash
npm install
```

## 🏃 Executar

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🔧 Configuração

Crie um arquivo `.env.local` na raiz deste diretório:

```env
VITE_API_URL=http://localhost:8000/api
```

## 📁 Estrutura

```
src/
├── components/
│   ├── auth/          # Componentes de autenticação
│   ├── dashboard/     # Componentes do dashboard (Kanban)
│   ├── billing/       # Componentes de faturamento
│   └── common/        # Componentes comuns (Header, Sidebar, etc)
├── contexts/          # Context API (AuthContext)
├── pages/             # Páginas principais
├── services/          # Serviços de API
├── types/             # Tipos TypeScript
└── utils/             # Funções auxiliares
```

## 🎯 Funcionalidades

### 1. Autenticação
- Login com email e senha
- Validação de campos
- Armazenamento seguro de token JWT
- Proteção de rotas

### 2. Dashboard
- Visualização de OS em cards
- Kanban Board com 3 colunas (Pendente, Em Desenvolvimento, Finalizadas)
- Botões para avançar/voltar status
- Filtros e busca
- Botão para criar nova OS

### 3. Faturamento
- Métricas principais (Total, Mensal, Semanal, Ticket Médio)
- Gráficos interativos
- Tabela detalhada de OS finalizadas
- Filtros por data e cliente

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build
- `npm run lint` - Executa linter

