-- Gamificação do painel admin: log de XP e conquistas desbloqueadas.
-- Agregados (nível, XP total, streak semanal) são derivados no cliente a
-- partir de xp_events — usuário único, volume baixo, sem necessidade de
-- singleton mantido por trigger.

-- ── xp_events (log append-only) ──────────────────────────────────────────
create table xp_events (
  id bigint generated always as identity primary key,
  action text not null check (action in (
    'lead_first_response',
    'lead_converted',
    'lead_descartado',
    'content_created',
    'content_updated',
    'hero_updated',
    'settings_updated'
  )),
  xp int not null,
  ref_table text,
  ref_id bigint,
  created_at timestamptz not null default now()
);
create index xp_events_created_at_idx on xp_events (created_at);

-- Evita farm de XP alternando o status de um lead pra frente e pra trás:
-- cada (action, ref_id) só pode ser logada uma vez por lead.
create unique index xp_events_lead_dedupe
  on xp_events (action, ref_id) where ref_table = 'messages';

alter table xp_events enable row level security;
create policy "xp_events_select" on xp_events for select to authenticated using (true);
create policy "xp_events_insert" on xp_events for insert to authenticated with check (true);

-- ── achievements_unlocked (só guarda o estado desbloqueado; as definições
-- ficam como constantes no frontend) ─────────────────────────────────────
create table achievements_unlocked (
  key text primary key,
  unlocked_at timestamptz not null default now()
);
alter table achievements_unlocked enable row level security;
create policy "achievements_unlocked_select" on achievements_unlocked for select to authenticated using (true);
create policy "achievements_unlocked_insert" on achievements_unlocked for insert to authenticated with check (true);
