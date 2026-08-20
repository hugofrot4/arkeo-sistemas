-- Grid de varredura de Fortaleza + migração dos prospects da v1.

-- ── grid ─────────────────────────────────────────────────────────────────
-- Retângulo cobrindo Fortaleza: lat -3.89..-3.68, lng -38.65..-38.40.
-- Células de raio 1500m espaçadas 2100m (≈0.0189°) — o espaçamento é menor
-- que raio×√2, então os círculos se sobrepõem e não sobra buraco.
-- 12 linhas × 14 colunas = 168 células. O retângulo pega mar e municípios
-- vizinhos de propósito: search_cells.dead descarta essas sozinho depois de
-- 3 sondagens vazias, o que é mais confiável que cravar um polígono na mão.
insert into search_cells (label, lat, lng, radius_m, priority)
select
  format('F-%s-%s', lpad(r::text, 2, '0'), lpad(c::text, 2, '0')),
  round((-3.89 + r * 0.018864)::numeric, 6)::double precision,
  round((-38.65 + c * 0.018905)::numeric, 6)::double precision,
  1500,
  -- Distância ao centro (Praça do Ferreira) em milésimos de grau: as células
  -- densas do centro são varridas antes da periferia.
  round(
    sqrt(
      power((-3.89 + r * 0.018864) - (-3.7319), 2) +
      power((-38.65 + c * 0.018905) - (-38.5267), 2)
    ) * 1000
  )::int
from generate_series(0, 11) as r, generate_series(0, 13) as c;

-- Uma task por (célula, nicho): 168 × 15 = 2.520 tasks = a cidade inteira
-- varrida uma vez, dentro do free tier mensal da Places API.
insert into search_tasks (cell_id, niche)
select c.id, n
from search_cells c
cross join unnest((select niches from prospecting_settings where id = 1)) as n;

-- ── migração dos dados da v1 ─────────────────────────────────────────────
-- `prospects.segment` da v1 não é confiável (vinha de websiteUri e ainda era
-- sobrescrito pela busca seguinte), então todo mundo entra como
-- 'nao_auditado' e o job `enrich` decide. `website` é preservado só como
-- pista de partida para a auditoria.
insert into leads (
  place_id, name, niche, phone, address, website,
  segment, stage, lost_reason, rating, user_rating_count, lat, lng,
  notes, contacted_at, created_at
)
select
  p.place_id,
  p.name,
  p.niche,
  p.phone,
  p.address,
  p.website,
  'nao_auditado',
  case p.status
    when 'novo' then 'novo'
    when 'contatado_whatsapp' then 'contatado'
    when 'respondeu' then 'em_conversa'
    when 'convertido' then 'ganho'
    else 'perdido'
  end,
  case p.status
    when 'nao_contatar' then 'sem_interesse'
    when 'descartado' then 'outro'
    else null
  end,
  p.rating,
  p.user_rating_count,
  p.lat,
  p.lng,
  p.notes,
  p.contacted_at,
  p.created_at
from prospects p
on conflict (place_id) do nothing;

-- Enfileira auditoria de tudo que ainda está vivo no funil.
insert into prospect_jobs (lead_id, kind)
select id, 'enrich' from leads where stage not in ('ganho', 'perdido')
on conflict do nothing;
