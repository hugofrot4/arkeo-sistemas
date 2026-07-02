# Arkeo Sistemas

Site institucional e painel administrativo da Arkeo Sistemas — uma landing page para captação de leads e um painel de admin para editar o conteúdo da página sem precisar mexer em código.

O projeto é um monorepo simples com dois pacotes independentes:

- **`frontend/`** — React 19 + Vite + TypeScript + Tailwind CSS v4. Landing page pública, tela de login e painel admin (SPA com React Router).
- **`backend/`** — Node.js + Express + TypeScript + Prisma + PostgreSQL. API REST que autentica o admin e persiste o conteúdo editável do site.

## Stack

| Camada     | Tecnologias |
|------------|-------------|
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, lucide-react |
| Backend    | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (jsonwebtoken), bcryptjs |

## Estrutura do repositório

```
arkeo-sistemas/
├── frontend/           # SPA React (site público + login + painel admin)
│   └── src/
│       ├── components/ # Navbar, Footer, seções da home, guarda de rota (auth)
│       ├── pages/      # Login.tsx, admin/ (Dashboard, Hero, Serviços, Mensagens...)
│       └── lib/api.ts  # Cliente HTTP para a API do backend
└── backend/            # API Express
    ├── prisma/         # schema.prisma, migrations, seed.ts
    └── src/
        ├── routes/     # auth.routes.ts, hero.routes.ts
        └── middleware/ # requireAuth.ts (proteção via JWT)
```

## Pré-requisitos

- Node.js 20+ (testado com Node 24)
- PostgreSQL 14+ rodando localmente (ou acessível via connection string)

## Como rodar localmente

### 1. Banco de dados

Crie um usuário e um banco para o projeto (ajuste usuário/senha como preferir):

```bash
sudo -u postgres psql -c "CREATE USER arkeo WITH PASSWORD 'arkeo123' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE arkeo_dev OWNER arkeo;"
```

Teste a conexão:

```bash
psql "postgresql://arkeo:arkeo123@localhost:5432/arkeo_dev" -c "select 1;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL, JWT_SECRET etc. se necessário
npm install
npm run prisma:migrate # cria as tabelas (Hero, AdminUser)
npm run seed           # cria o usuário admin inicial (lê ADMIN_EMAIL/ADMIN_PASSWORD do .env)
npm run dev             # sobe a API em http://localhost:4000
```

### 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env   # aponta VITE_API_URL para a API local
npm install
npm run dev             # sobe o site em http://localhost:5173
```

### 4. Testando

- `http://localhost:5173/` — landing page pública (o conteúdo do Hero vem da API).
- `http://localhost:5173/login` — login do admin. Use as credenciais definidas em `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env` do backend (padrão: `admin@arkeosistemas.com.br` / `admin1234`).
- `http://localhost:5173/admin` — painel administrativo (protegido: redireciona para `/login` se não houver sessão válida).

## Variáveis de ambiente

### `backend/.env`

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL |
| `PORT` | Porta da API (padrão `4000`) |
| `CORS_ORIGIN` | Origem(s) permitida(s) para CORS, separadas por vírgula |
| `JWT_SECRET` | Segredo usado para assinar os tokens de sessão — troque em produção |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Usados apenas por `npm run seed` para criar o admin inicial |

### `frontend/.env`

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API do backend |

## Scripts disponíveis

### `backend/`

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe a API em modo desenvolvimento (hot reload via `tsx watch`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a API compilada (`dist/index.js`) — uso em produção |
| `npm run prisma:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run prisma:deploy` | Aplica migrations pendentes em produção |
| `npm run prisma:studio` | Abre uma UI para inspecionar/editar os dados |
| `npm run seed` | Cria (ou atualiza) o usuário admin inicial |

### `frontend/`

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o site em modo desenvolvimento |
| `npm run build` | Type-checa e gera o build de produção em `dist/` |
| `npm run lint` | Roda o ESLint |
| `npm run preview` | Serve o build de produção localmente |

## API

Todas as rotas ficam sob o prefixo `/api`. Rotas marcadas com 🔒 exigem um header `Authorization: Bearer <token>` obtido no login.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Autentica com `{ email, password }`, retorna `{ token, user }` |
| GET | `/api/auth/me` 🔒 | Retorna os dados do usuário autenticado |
| GET | `/api/hero` | Retorna o conteúdo atual da seção Hero |
| PUT | `/api/hero` 🔒 | Atualiza o conteúdo da seção Hero |

## Deploy

O backend já está pronto para deploy no [Render](https://render.com) (plano free):

- **Build command:** `npm install && npm run build`
- **Start command:** `npx prisma migrate deploy && npm start`
- Configure as env vars da tabela acima (usando a connection string do Postgres gratuito do Render em `DATABASE_URL`, e gerando um `JWT_SECRET` novo e aleatório).
- No frontend, aponte `VITE_API_URL` para a URL pública do serviço do backend no Render antes de gerar o build de produção.

## Roadmap

- Autenticação real está implementada apenas para o login e para a rota de escrita do Hero — as demais seções do painel (Serviços, Processo, Portfólio, FAQ, Mensagens, Configurações) ainda operam só em memória no frontend e precisam do mesmo tratamento (rota na API + proteção por JWT).
- Sem fluxo de "esqueci minha senha" (o link existe na UI mas ainda não está implementado).
