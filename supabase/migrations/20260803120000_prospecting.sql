-- Prospecção ativa de leads: busca diária de negócios locais via Google
-- Places API e pipeline de contato semi-manual (WhatsApp) no admin.

-- ── prospecting_config (singleton) ───────────────────────────────────────
create table prospecting_config (
  id smallint primary key default 1 check (id = 1),
  city_name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_meters int not null default 15000 check (radius_meters > 0 and radius_meters <= 50000),
  niche_types text[] not null default '{}',
  sub_areas jsonb not null default '[]'::jsonb,
  next_search_index int not null default 0,
  daily_call_cap int not null default 25 check (daily_call_cap > 0),
  wa_message_template text not null default 'Olá! Vi que a {{nome}} ainda não tem site e queria apresentar uma proposta rápida de criação de um site profissional. Podemos conversar?',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table prospecting_config enable row level security;
create policy "prospecting_config_select" on prospecting_config for select to authenticated using (true);
create policy "prospecting_config_write" on prospecting_config for all to authenticated using (true) with check (true);
create trigger prospecting_config_set_updated_at before update on prospecting_config
  for each row execute function set_updated_at();

insert into prospecting_config (id, city_name, center_lat, center_lng, radius_meters, niche_types) values (
  1,
  'Fortaleza, CE',
  -3.7172,
  -38.5433,
  20000,
  array['dentist', 'lawyer', 'real_estate_agency', 'physiotherapist', 'accounting', 'veterinary_care', 'architect', 'insurance_agency', 'gym', 'beauty_salon', 'hair_salon', 'spa', 'car_repair', 'restaurant', 'pet_store']
);

-- ── prospecting_runs (log por chamada de API, uma linha por busca) ───────
create table prospecting_runs (
  id bigint generated always as identity primary key,
  run_date date not null default current_date,
  niche text not null,
  area_label text,
  places_found int not null default 0,
  places_new int not null default 0,
  places_updated int not null default 0,
  status text not null default 'ok' check (status in ('ok', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);
create index prospecting_runs_run_date_idx on prospecting_runs (run_date);
alter table prospecting_runs enable row level security;
create policy "prospecting_runs_select" on prospecting_runs for select to authenticated using (true);
create policy "prospecting_runs_insert" on prospecting_runs for insert to authenticated with check (true);

-- ── prospects (negócios encontrados via Google Places) ───────────────────
create table prospects (
  id bigint generated always as identity primary key,
  place_id text not null unique,
  name text not null,
  niche text not null,
  phone text,
  address text,
  website text,
  segment text not null check (segment in ('sem_site', 'com_site')),
  rating numeric(2, 1),
  user_rating_count int,
  lat double precision,
  lng double precision,
  status text not null default 'novo' check (status in (
    'novo', 'contatado_whatsapp', 'respondeu', 'convertido', 'nao_contatar', 'descartado'
  )),
  contacted_at timestamptz,
  notes text not null default '',
  source_run_id bigint references prospecting_runs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prospects_status_idx on prospects (status);
create index prospects_segment_idx on prospects (segment);
alter table prospects enable row level security;
create policy "prospects_select" on prospects for select to authenticated using (true);
create policy "prospects_write" on prospects for all to authenticated using (true) with check (true);
create trigger prospects_set_updated_at before update on prospects
  for each row execute function set_updated_at();
