-- Prospecção v2 — substitui o módulo de `prospects` / `prospecting_config`.
--
-- Diferenças estruturais em relação à v1:
--   • varredura por grid de células × nichos (search_cells / search_tasks) no
--     lugar do cursor circular, que refazia as mesmas buscas a cada execução;
--   • fila de jobs com lock, retry e backoff (prospect_jobs) no lugar de
--     processamento síncrono dentro do request HTTP;
--   • contabilidade de cota por chamada realmente feita (api_usage) no lugar
--     de contar linhas de log, que fazia erro de rede consumir orçamento;
--   • escrita restrita a admin de verdade (admin_users + is_admin()) no lugar
--     de `to authenticated using (true)`, que liberava a base e os limites de
--     gasto para qualquer usuário autenticado do projeto.
--
-- As tabelas da v1 continuam no banco, sem uso, até a validação em produção.

-- ── admin_users + is_admin() ─────────────────────────────────────────────
create table admin_users (
  user_id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);
alter table admin_users enable row level security;

-- security definer: ignora RLS de propósito, senão a policy que usa esta
-- função dependeria da policy da própria tabela que ela consulta.
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- Bootstrap: quem já tem login no projeto hoje é admin. Contas criadas
-- depois desta migration não entram automaticamente.
insert into admin_users (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

create policy "admin_users_select" on admin_users for select to authenticated using (is_admin());
create policy "admin_users_write" on admin_users for all to authenticated using (is_admin()) with check (is_admin());

-- ── prospecting_settings (singleton) ─────────────────────────────────────
create table prospecting_settings (
  id smallint primary key default 1 check (id = 1),
  active boolean not null default true,
  city_name text not null default 'Fortaleza, CE',
  niches text[] not null default '{}',
  -- Quantas (célula, nicho) uma execução de sourcing consome. Cada uma é
  -- exatamente 1 chamada à Places API.
  run_task_cap int not null default 12 check (run_task_cap > 0),
  -- Duas cotas separadas porque são dois SKUs de preço muito diferente.
  -- (A geração de protótipo não aparece aqui: o conteúdo é escrito no Claude
  -- Code, fora do sistema, então não há chamada paga a controlar.)
  -- Descoberta (Nearby Search Pro): só nome, endereço e coordenada. Barato,
  -- cota grátis larga — é o que varre a cidade.
  nearby_daily_cap int not null default 200 check (nearby_daily_cap > 0),
  nearby_monthly_cap int not null default 4000 check (nearby_monthly_cap > 0),
  -- Detalhes (Place Details Enterprise): telefone, site, rating, avaliações.
  -- SKU caro e de cota grátis apertada, então só roda em lead que já passou
  -- pela descoberta e vale contato. A v1 pedia esses campos em toda busca.
  details_daily_cap int not null default 60 check (details_daily_cap > 0),
  details_monthly_cap int not null default 900 check (details_monthly_cap > 0),
  daily_outreach_cap int not null default 40 check (daily_outreach_cap > 0),
  prototype_ttl_days int not null default 45 check (prototype_ttl_days > 0),
  updated_at timestamptz not null default now()
);
alter table prospecting_settings enable row level security;
create policy "prospecting_settings_select" on prospecting_settings for select to authenticated using (is_admin());
create policy "prospecting_settings_write" on prospecting_settings for all to authenticated using (is_admin()) with check (is_admin());
create trigger prospecting_settings_set_updated_at before update on prospecting_settings
  for each row execute function set_updated_at();

insert into prospecting_settings (id, niches) values (1, array[
  'dentist', 'lawyer', 'real_estate_agency', 'physiotherapist', 'accounting',
  'veterinary_care', 'architect', 'insurance_agency', 'gym', 'beauty_salon',
  'hair_salon', 'spa', 'car_repair', 'restaurant', 'pet_store'
]);

-- ── leads (substitui prospects) ──────────────────────────────────────────
create table leads (
  id bigint generated always as identity primary key,
  place_id text not null unique,
  name text not null,
  niche text not null,
  phone text,
  phone_e164 text,
  whatsapp_valid boolean not null default false,
  email text,
  address text,
  neighborhood text,
  website text,
  social_url text,
  -- 'nao_auditado' até o job `enrich` rodar. A v1 chutava com/sem site a
  -- partir do websiteUri do Places, que é falso positivo estrutural.
  segment text not null default 'nao_auditado' check (segment in (
    'nao_auditado', 'sem_presenca', 'so_rede_social',
    'site_quebrado', 'site_obsoleto', 'site_ok'
  )),
  score int not null default 0 check (score between 0 and 100),
  stage text not null default 'novo' check (stage in (
    'novo', 'qualificado', 'prototipo_pronto', 'contatado',
    'visualizou', 'em_conversa', 'proposta', 'ganho', 'perdido'
  )),
  lost_reason text check (lost_reason in (
    'sem_interesse', 'tem_agencia', 'sem_verba', 'sem_resposta', 'numero_errado', 'outro'
  )),
  rating numeric(2, 1),
  user_rating_count int,
  lat double precision,
  lng double precision,
  -- Trava o sourcing: campos conferidos por humano não são sobrescritos pela
  -- próxima passada do Places.
  verified_by_human boolean not null default false,
  notes text not null default '',
  source_cell_id bigint,
  audited_at timestamptz,
  contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_stage_idx on leads (stage);
create index leads_segment_idx on leads (segment);
create index leads_score_idx on leads (score desc);
alter table leads enable row level security;
create policy "leads_select" on leads for select to authenticated using (is_admin());
create policy "leads_write" on leads for all to authenticated using (is_admin()) with check (is_admin());
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

-- ── lead_audits (resultado da auditoria do site atual) ───────────────────
create table lead_audits (
  id bigint generated always as identity primary key,
  lead_id bigint not null unique references leads (id) on delete cascade,
  reachable boolean,
  http_status int,
  final_url text,
  https_ok boolean,
  has_viewport boolean,
  has_title boolean,
  has_description boolean,
  has_contact_link boolean,
  has_form boolean,
  has_analytics boolean,
  platform text,
  copyright_year int,
  -- Página que só monta no navegador (React/Vue): o HTML servido não
  -- mostra o conteúdo real, então achados sobre conteúdo são suprimidos.
  js_rendered boolean,
  page_text text,
  -- [{ code, severity, evidence }] — é o texto que a geração cita na abordagem.
  findings jsonb not null default '[]'::jsonb,
  audited_at timestamptz not null default now()
);
alter table lead_audits enable row level security;
create policy "lead_audits_select" on lead_audits for select to authenticated using (is_admin());
create policy "lead_audits_write" on lead_audits for all to authenticated using (is_admin()) with check (is_admin());

-- ── prototypes (o site gerado, servido em /p/:slug) ──────────────────────
create table prototypes (
  id bigint generated always as identity primary key,
  lead_id bigint not null references leads (id) on delete cascade,
  slug text not null unique,
  template text not null,
  content jsonb not null,
  published boolean not null default false,
  expires_at timestamptz,
  model text,
  input_tokens int,
  cached_input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index prototypes_one_published_per_lead_idx on prototypes (lead_id) where published;
alter table prototypes enable row level security;
-- Leitura pública só do que está publicado e no prazo: é o link que o
-- prospect abre, sem login.
create policy "prototypes_select_public" on prototypes for select using (
  published and (expires_at is null or expires_at > now())
);
create policy "prototypes_write" on prototypes for all to authenticated using (is_admin()) with check (is_admin());
create trigger prototypes_set_updated_at before update on prototypes
  for each row execute function set_updated_at();

-- ── prototype_views (sinal de compra: quem abriu o protótipo) ────────────
create table prototype_views (
  id bigint generated always as identity primary key,
  prototype_id bigint not null references prototypes (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text,
  referrer text
);
create index prototype_views_prototype_idx on prototype_views (prototype_id, viewed_at desc);
alter table prototype_views enable row level security;
-- Insert anônimo, mesmo padrão de messages_insert_public: quem visita o
-- protótipo não está logado.
create policy "prototype_views_insert_public" on prototype_views for insert with check (true);
create policy "prototype_views_select" on prototype_views for select to authenticated using (is_admin());

-- ── outreach_touches (sequência de contato) ──────────────────────────────
create table outreach_touches (
  id bigint generated always as identity primary key,
  lead_id bigint not null references leads (id) on delete cascade,
  step smallint not null check (step between 1 and 4),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email')),
  body text not null,
  scheduled_for date not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'skipped', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (lead_id, step)
);
create index outreach_touches_queue_idx on outreach_touches (status, scheduled_for);
alter table outreach_touches enable row level security;
create policy "outreach_touches_select" on outreach_touches for select to authenticated using (is_admin());
create policy "outreach_touches_write" on outreach_touches for all to authenticated using (is_admin()) with check (is_admin());

-- ── search_cells / search_tasks (grid de varredura) ──────────────────────
create table search_cells (
  id bigint generated always as identity primary key,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  radius_m int not null default 1500 check (radius_m > 0 and radius_m <= 50000),
  -- Menor roda primeiro: células centrais antes da periferia.
  priority int not null default 0,
  -- O grid é um retângulo, então cobre mar e municípios vizinhos. Uma célula
  -- que devolve zero resultados 3× seguidas é marcada morta e para de gastar
  -- cota, em vez de queimar 15 chamadas (uma por nicho) para nada.
  dead boolean not null default false,
  probe_empty_streak smallint not null default 0,
  unique (lat, lng)
);
alter table search_cells enable row level security;
create policy "search_cells_select" on search_cells for select to authenticated using (is_admin());
create policy "search_cells_write" on search_cells for all to authenticated using (is_admin()) with check (is_admin());

create table search_tasks (
  id bigint generated always as identity primary key,
  cell_id bigint not null references search_cells (id) on delete cascade,
  niche text not null,
  status text not null default 'pending' check (status in ('pending', 'exhausted')),
  last_run_at timestamptz,
  run_count int not null default 0,
  empty_streak smallint not null default 0,
  total_found int not null default 0,
  total_new int not null default 0,
  -- Onde a falha aparece: célula + nicho + motivo, no lugar onde se procura.
  last_error text,
  unique (cell_id, niche)
);
create index search_tasks_pick_idx on search_tasks (status, last_run_at nulls first);
alter table search_tasks enable row level security;
create policy "search_tasks_select" on search_tasks for select to authenticated using (is_admin());
create policy "search_tasks_write" on search_tasks for all to authenticated using (is_admin()) with check (is_admin());

-- ── prospect_jobs (fila) ─────────────────────────────────────────────────
create table prospect_jobs (
  id bigint generated always as identity primary key,
  lead_id bigint references leads (id) on delete cascade,
  kind text not null check (kind in ('details', 'enrich')),
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  attempts smallint not null default 0,
  max_attempts smallint not null default 4,
  next_run_at timestamptz not null default now(),
  locked_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Impede enfileirar o mesmo trabalho duas vezes para o mesmo lead.
create unique index prospect_jobs_open_idx on prospect_jobs (lead_id, kind)
  where status in ('pending', 'running');
create index prospect_jobs_claim_idx on prospect_jobs (kind, status, next_run_at);
alter table prospect_jobs enable row level security;
create policy "prospect_jobs_select" on prospect_jobs for select to authenticated using (is_admin());
create policy "prospect_jobs_write" on prospect_jobs for all to authenticated using (is_admin()) with check (is_admin());
create trigger prospect_jobs_set_updated_at before update on prospect_jobs
  for each row execute function set_updated_at();

-- ── api_usage (cota real, por chamada efetivamente feita) ────────────────
create table api_usage (
  provider text not null,
  sku text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (provider, sku, day)
);
alter table api_usage enable row level security;
create policy "api_usage_select" on api_usage for select to authenticated using (is_admin());
