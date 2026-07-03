# Arkeo Sistemas

Site institucional e painel administrativo da Arkeo Sistemas — uma landing page para captação de leads e um painel de admin para editar todo o conteúdo da página sem precisar mexer em código.

O projeto é um monorepo simples com dois pacotes independentes:

- **`frontend/`** — React 19 + Vite + TypeScript + Tailwind CSS v4. Landing page pública, tela de login e painel admin (SPA com React Router).
- **`backend/`** — Node.js + Express + TypeScript + Prisma + PostgreSQL. API REST que autentica o admin e persiste todo o conteúdo editável do site.

Todo o conteúdo da landing page (Hero, barra de autoridade, serviços, processo, diferenciais, portfólio, FAQ, mensagens recebidas e configurações gerais) é editado pelo painel admin e persistido de verdade no banco — nada roda só em memória.

## Stack

| Camada     | Tecnologias |
|------------|-------------|
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, lucide-react |
| Backend    | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (jsonwebtoken), bcryptjs |

## Estrutura do repositório

```
arkeo-sistemas/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── auth/       # RequireAuth (guarda de rota do /admin)
│       │   ├── layout/     # Navbar, Footer
│       │   └── sections/   # Hero, AuthorityBar, Services, Process, WhyArkeo, Portfolio, Faq, Contact
│       ├── pages/
│       │   ├── Login.tsx
│       │   └── admin/      # AdminContext, Dashboard e as views de cada seção do painel
│       └── lib/
│           ├── api.ts      # Cliente HTTP para toda a API do backend
│           └── icons.ts    # Mapa de ícones (lucide) usado pelo admin e pelo site público
└── backend/
    ├── prisma/             # schema.prisma, migrations, seed.ts
    └── src/
        ├── routes/         # auth, hero, metrics, services, process, differentials,
        │                   # portfolio, faq, messages, settings
        ├── middleware/      # requireAuth.ts (proteção via JWT)
        └── lib/             # prisma client, jwt
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
npm run prisma:migrate # cria todas as tabelas
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

- `http://localhost:5173/` — landing page pública (todo o conteúdo vem da API; se ela estiver fora do ar, cada seção cai para um conteúdo padrão local).
- `http://localhost:5173/login` — login do admin. Use as credenciais definidas em `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env` do backend (padrão: `admin@arkeosistemas.com.br` / `admin1234`).
- `http://localhost:5173/admin` — painel administrativo (protegido: redireciona para `/login` se não houver sessão válida).

Na primeira chamada, cada seção de conteúdo se auto-inicializa no banco com os valores padrão (não precisa rodar nenhum seed além do usuário admin).

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

Todas as rotas ficam sob o prefixo `/api`. Rotas marcadas com 🔒 exigem um header `Authorization: Bearer <token>` obtido no login. As seções de conteúdo em lista (métricas, serviços, processo, diferenciais, portfólio, FAQ) seguem todas o mesmo contrato REST.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Autentica com `{ email, password }`, retorna `{ token, user }` |
| GET | `/api/auth/me` 🔒 | Retorna os dados do usuário autenticado |
| GET | `/api/hero` | Conteúdo atual da seção Hero |
| PUT | `/api/hero` 🔒 | Atualiza a seção Hero |
| GET | `/api/settings` | Identidade, contato e redes sociais do site |
| PUT | `/api/settings` 🔒 | Atualiza as configurações |
| GET | `/api/{metrics,services,process,differentials,portfolio,faq}` | Lista os itens da seção |
| POST | `/api/{...}` 🔒 | Cria um item |
| PUT | `/api/{...}/:id` 🔒 | Atualiza um item |
| DELETE | `/api/{...}/:id` 🔒 | Exclui um item |
| PUT | `/api/{...}/reorder` 🔒 | Reordena os itens (`{ ids: number[] }` na nova ordem) |
| POST | `/api/messages` | Recebe um lead do formulário de contato público |
| GET | `/api/messages` 🔒 | Lista os leads recebidos |
| PUT | `/api/messages/:id/status` 🔒 | Atualiza o status de um lead |
| DELETE | `/api/messages/:id` 🔒 | Exclui um lead |

**Imagens do portfólio:** cada projeto tem um campo `image` com a imagem convertida para base64 (data URI), salva direto na linha do banco — sem serviço externo de storage. Limite de 2MB por imagem (validado no cliente e no servidor); por isso o `express.json()` do backend aceita corpos de até 5MB.

## Deploy

O backend já está pronto para deploy no [Render](https://render.com) (plano free):

- **Build command:** `npm install && npm run build`
- **Start command:** `npx prisma migrate deploy && npm start`
- Configure as env vars da tabela acima (usando a connection string do Postgres gratuito do Render em `DATABASE_URL`, e gerando um `JWT_SECRET` novo e aleatório).
- No frontend, aponte `VITE_API_URL` para a URL pública do serviço do backend no Render antes de gerar o build de produção.

## Roadmap

- Sem fluxo de "esqueci minha senha" (o link existe na UI mas ainda só mostra um alerta).
- Imagens do portfólio ficam salvas como base64 no Postgres — simples e funciona no Render free sem disco persistente, mas não é a solução mais escalável para muitas imagens grandes; migrar para um storage externo (Cloudinary, S3/R2) é o próximo passo natural se o portfólio crescer muito.
