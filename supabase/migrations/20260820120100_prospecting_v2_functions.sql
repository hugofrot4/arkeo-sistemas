-- Funções da prospecção v2: fila com lock, seleção de território e
-- contabilidade de cota.
--
-- Todas são `security invoker` de propósito. O worker chama com a service
-- key, que já ignora RLS; o admin chama com a sessão do usuário, e aí as
-- policies `is_admin()` das tabelas fazem o controle sozinhas. Só `is_admin()`
-- precisa ser definer, porque ela é quem as policies consultam.

-- ── datas no fuso de Fortaleza ───────────────────────────────────────────
-- current_date roda em UTC no Supabase: nas primeiras 3h do dia o contador de
-- cota virava no dia errado para quem opera no Brasil.
create or replace function br_today()
returns date language sql stable as $$
  select (now() at time zone 'America/Fortaleza')::date;
$$;

alter table api_usage alter column day set default br_today();

-- ── cota ─────────────────────────────────────────────────────────────────
create or replace function bump_api_usage(p_provider text, p_sku text, p_n int default 1)
returns int language plpgsql as $$
declare v_count int;
begin
  insert into api_usage (provider, sku, day, count)
  values (p_provider, p_sku, br_today(), p_n)
  on conflict (provider, sku, day) do update set count = api_usage.count + p_n
  returning api_usage.count into v_count;
  return v_count;
end;
$$;

create or replace function api_usage_window(p_provider text, p_sku text)
returns table (day_count int, month_count int) language sql stable as $$
  select
    coalesce(sum(count) filter (where day = br_today()), 0)::int,
    coalesce(sum(count) filter (where day >= date_trunc('month', br_today())::date), 0)::int
  from api_usage
  where provider = p_provider and sku = p_sku;
$$;

-- ── fila de jobs ─────────────────────────────────────────────────────────
-- Job que ficou 'running' além do prazo (worker morreu, função estourou o
-- timeout) volta para a fila em vez de travar o lead para sempre.
create or replace function requeue_stale_jobs(p_older_than interval default interval '10 minutes')
returns int language plpgsql as $$
declare v_count int;
begin
  update prospect_jobs
  set status = case when attempts >= max_attempts then 'failed' else 'pending' end,
      locked_at = null,
      error = coalesce(error, 'reenfileirado: job travado em running')
  where status = 'running' and locked_at < now() - p_older_than;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function claim_prospect_jobs(p_kind text, p_limit int default 5)
returns setof prospect_jobs language plpgsql as $$
begin
  perform requeue_stale_jobs();
  return query
  update prospect_jobs j
  set status = 'running',
      locked_at = now(),
      attempts = j.attempts + 1
  where j.id in (
    select id from prospect_jobs
    where kind = p_kind and status = 'pending' and next_run_at <= now()
    order by next_run_at, id
    limit greatest(p_limit, 0)
    for update skip locked
  )
  returning j.*;
end;
$$;

-- Backoff exponencial na falha: 2min, 4min, 8min, 16min. Esgotadas as
-- tentativas o job vai para 'failed' e para de consumir recurso.
create or replace function complete_prospect_job(p_id bigint, p_ok boolean, p_error text default null)
returns text language plpgsql as $$
declare v_job prospect_jobs; v_status text;
begin
  select * into v_job from prospect_jobs where id = p_id;
  if v_job.id is null then raise exception 'job % não encontrado', p_id; end if;

  if p_ok then
    v_status := 'done';
  elsif v_job.attempts >= v_job.max_attempts then
    v_status := 'failed';
  else
    v_status := 'pending';
  end if;

  update prospect_jobs
  set status = v_status,
      locked_at = null,
      error = case when p_ok then null else p_error end,
      next_run_at = case
        when v_status = 'pending' then now() + (power(2, v_job.attempts) * interval '1 minute')
        else next_run_at
      end
  where id = p_id;

  return v_status;
end;
$$;

-- Enfileira sem duplicar: o índice parcial prospect_jobs_open_idx já garante
-- um job aberto por (lead, kind), então o conflito é simplesmente ignorado.
create or replace function enqueue_job(p_lead_id bigint, p_kind text, p_payload jsonb default '{}'::jsonb)
returns bigint language plpgsql as $$
declare v_id bigint;
begin
  insert into prospect_jobs (lead_id, kind, payload)
  values (p_lead_id, p_kind, p_payload)
  on conflict do nothing
  returning id into v_id;
  return v_id;
end;
$$;

-- ── seleção de território ────────────────────────────────────────────────
-- Substitui o cursor circular da v1. Cada execução pega tasks que ainda não
-- rodaram (ou rodaram há mais tempo), pulando células mortas e tasks
-- esgotadas — território novo a cada clique, por construção.
create or replace function claim_search_tasks(p_limit int default 12)
returns table (
  task_id bigint,
  cell_id bigint,
  cell_label text,
  niche text,
  lat double precision,
  lng double precision,
  radius_m int
) language plpgsql as $$
begin
  return query
  with picked as (
    select t.id
    from search_tasks t
    join search_cells c on c.id = t.cell_id
    where t.status = 'pending' and not c.dead
    order by c.priority, t.last_run_at nulls first, t.id
    limit greatest(p_limit, 0)
    for update of t skip locked
  ),
  claimed as (
    update search_tasks t
    set last_run_at = now(), run_count = t.run_count + 1
    where t.id in (select id from picked)
    returning t.id, t.cell_id, t.niche
  )
  select cl.id, cl.cell_id, c.label, cl.niche, c.lat, c.lng, c.radius_m
  from claimed cl
  join search_cells c on c.id = cl.cell_id;
end;
$$;

-- Fecha o ciclo da task e cuida da morte de célula.
--   p_found = lugares devolvidos pelo Places (mesmo já conhecidos)
--   p_new   = leads inéditos gravados
-- Task esgota após 2 execuções seguidas sem lead novo. Célula morre após 3
-- execuções seguidas sem *nenhum* resultado — é como o grid retangular se
-- livra sozinho de mar e municípios vizinhos sem hardcode de polígono.
create or replace function record_search_task_result(p_task_id bigint, p_found int, p_new int)
returns void language plpgsql as $$
declare v_cell_id bigint; v_streak smallint;
begin
  update search_tasks
  set total_found = total_found + p_found,
      total_new = total_new + p_new,
      empty_streak = case when p_new = 0 then empty_streak + 1 else 0 end,
      status = case when p_new = 0 and empty_streak + 1 >= 2 then 'exhausted' else 'pending' end
  where id = p_task_id
  returning cell_id into v_cell_id;

  if v_cell_id is null then return; end if;

  update search_cells
  set probe_empty_streak = case when p_found = 0 then probe_empty_streak + 1 else 0 end
  where id = v_cell_id
  returning probe_empty_streak into v_streak;

  if v_streak >= 3 then
    update search_cells set dead = true where id = v_cell_id;
  end if;
end;
$$;

-- ── pipeline ─────────────────────────────────────────────────────────────
create or replace function stage_rank(p_stage text)
returns int language sql immutable as $$
  select case p_stage
    when 'novo' then 0
    when 'qualificado' then 1
    when 'prototipo_pronto' then 2
    when 'contatado' then 3
    when 'visualizou' then 4
    when 'em_conversa' then 5
    when 'proposta' then 6
    when 'ganho' then 7
    when 'perdido' then 7
    else -1
  end;
$$;

-- Avanço automático de estágio nunca regride. Na v1, clicar em WhatsApp
-- forçava 'contatado_whatsapp' mesmo num lead que já tinha respondido.
-- Movimentação manual pelo admin continua livre via UPDATE direto.
create or replace function advance_lead_stage(p_lead_id bigint, p_stage text)
returns text language plpgsql as $$
declare v_current text;
begin
  select stage into v_current from leads where id = p_lead_id for update;
  if v_current is null then raise exception 'lead % não encontrado', p_lead_id; end if;
  if v_current in ('ganho', 'perdido') then return v_current; end if;
  if stage_rank(p_stage) <= stage_rank(v_current) then return v_current; end if;

  update leads
  set stage = p_stage,
      contacted_at = case
        when p_stage = 'contatado' and contacted_at is null then now()
        else contacted_at
      end
  where id = p_lead_id;
  return p_stage;
end;
$$;

revoke execute on function
  bump_api_usage(text, text, int),
  claim_prospect_jobs(text, int),
  complete_prospect_job(bigint, boolean, text),
  requeue_stale_jobs(interval),
  enqueue_job(bigint, text, jsonb),
  claim_search_tasks(int),
  record_search_task_result(bigint, int, int),
  advance_lead_stage(bigint, text)
from anon;
