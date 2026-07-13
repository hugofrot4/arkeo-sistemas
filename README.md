# Arkeo Sistemas

Site institucional e painel administrativo da Arkeo Sistemas — uma landing page para captação de leads e um painel de admin para editar todo o conteúdo da página sem precisar mexer em código.

O projeto é um frontend React que fala direto com o [Supabase](https://supabase.com) — sem servidor próprio no meio:

- **`frontend/`** — React 19 + Vite + TypeScript + Tailwind CSS v4. Landing page pública, tela de login e painel admin (SPA com React Router).
- **`supabase/`** — schema do banco (Postgres), Row Level Security e funções SQL, versionados como migrations e aplicados via Supabase CLI.

Todo o conteúdo da landing page (Hero, barra de autoridade, serviços, processo, diferenciais, portfólio, FAQ, mensagens recebidas e configurações gerais) é editado pelo painel admin e persistido de verdade no banco — nada roda só em memória.

## Stack

| Camada     | Tecnologias |
|------------|-------------|
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, lucide-react, `@supabase/supabase-js` |
| Backend    | [Supabase](https://supabase.com): Postgres + PostgREST (API REST automática) + Supabase Auth + Row Level Security |

Não existe servidor Node próprio: o frontend lê e escreve direto nas tabelas do Supabase, autenticado via Supabase Auth, e a segurança é garantida por Row Level Security — não por um backend intermediário.

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
│           ├── supabase.ts # Cliente do Supabase (createClient)
│           ├── api.ts      # Camada de acesso a dados: mapeia os nomes de campo do
│           │                # frontend (camelCase) para as colunas do Supabase (snake_case)
│           └── icons.ts    # Mapa de ícones (lucide) usado pelo admin e pelo site público
└── supabase/
    └── migrations/          # Schema, RLS policies, funções de reorder e seeds — versionados em SQL
```

## Pré-requisitos

- Node.js 20+ (testado com Node 24)
- Uma conta e um projeto no [Supabase](https://supabase.com) (free tier)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`npx supabase`, não precisa instalar globalmente)

## Como rodar localmente

### 1. Projeto Supabase

Crie um projeto em [supabase.com](https://supabase.com) e aplique as migrations deste repositório:

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>   # em Project Settings → General
npx supabase db push                                 # aplica supabase/migrations/*.sql
```

Crie o usuário admin em **Authentication → Users → Add user** (marque "Auto Confirm User").

Pegue a `Project URL` e a `anon public` key em **Project Settings → API**.

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev             # sobe o site em http://localhost:5173
```

### 3. Testando

- `http://localhost:5173/` — landing page pública (todo o conteúdo vem do Supabase; se a leitura falhar, cada seção cai para um conteúdo padrão local).
- `http://localhost:5173/login` — login do admin. Use as credenciais do usuário criado no Supabase Auth.
- `http://localhost:5173/admin` — painel administrativo (protegido: redireciona para `/login` se não houver sessão válida).

A migration inicial já popula todas as tabelas com o conteúdo padrão — não precisa rodar nenhum seed manual além de criar o usuário admin.

## Variáveis de ambiente

### `frontend/.env`

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (`https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (`anon`/`publishable`) do projeto — segura para expor no cliente, a segurança real é via Row Level Security |

## Scripts disponíveis

### `frontend/`

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o site em modo desenvolvimento |
| `npm run build` | Type-checa e gera o build de produção em `dist/` |
| `npm run lint` | Roda o ESLint |
| `npm run preview` | Serve o build de produção localmente |

## Banco de dados e API

Não existe mais um contrato de API próprio: o [PostgREST](https://postgrest.org) do Supabase expõe cada tabela automaticamente. `frontend/src/lib/api.ts` é a única camada que fala com o Supabase — ela traduz os nomes de campo do frontend (camelCase) para as colunas do banco (snake_case) e expõe funções por seção (`getHero`, `metricsApi`, `servicesApi` etc.), usadas por todo o resto do app.

**Tabelas** (todas com Row Level Security habilitado — ver `supabase/migrations/`):

| Tabela | Leitura | Escrita |
|---|---|---|
| `hero`, `settings` | pública | autenticado |
| `metrics` (máx. 4), `services`, `process_steps` (máx. 6), `differentials`, `portfolio_projects`, `faq` | pública | autenticado |
| `messages` (leads do formulário de contato) | autenticado | `insert` público, `update`/`delete` autenticado |

**Reordenação**: cada tabela de lista tem uma função SQL (`reorder_metrics`, `reorder_services` etc.) que atualiza a ordem de todos os itens numa única transação, chamada via `.rpc()` — só usuários autenticados podem executá-la.

**Autenticação**: feita pelo Supabase Auth (`supabase.auth.signInWithPassword`). Não existe tabela de usuário nem JWT próprio — a sessão é gerenciada pelo `supabase-js` no `localStorage`.

**Imagens do portfólio:** cada projeto tem um campo `image` com a imagem convertida para base64 (data URI), salva direto na linha do banco — sem serviço externo de storage. Limite de ~2MB por imagem, validado no cliente e reforçado por uma constraint no banco (`portfolio_projects_image_length`).

## Deploy

Só o frontend precisa de hospedagem — é um site estático (build do Vite). Pode ir para Render (Static Site), Vercel, Netlify ou qualquer host de arquivos estáticos:

- **Build command:** `npm install && npm run build` (dentro de `frontend/`)
- **Publish directory:** `frontend/dist`
- Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas env vars de build do host.

O banco, autenticação e API já ficam hospedados pelo Supabase — não há nada para colocar no ar além do site.

## Roadmap

- Sem fluxo de "esqueci minha senha" (o link existe na UI mas ainda só mostra um alerta) — dá pra usar `supabase.auth.resetPasswordForEmail` quando for implementar.
- Imagens do portfólio ficam salvas como base64 no Postgres — simples e funciona bem para poucas imagens, mas não é a solução mais escalável; migrar para o Supabase Storage é o próximo passo natural se o portfólio crescer muito.
