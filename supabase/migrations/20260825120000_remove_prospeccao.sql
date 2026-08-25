-- Remove o módulo de prospecção.
--
-- O processo não funcionou na prática e vai ser repensado do zero. Manter as
-- tabelas custaria mais do que apagá-las: elas guardam dado pessoal de 260
-- negócios coletado do Google Places, e dado que ninguém usa é passivo.
--
-- Os dados foram despejados em JSON antes disto, junto com o material dos
-- protótipos e o código do módulo. Não está no repositório de propósito — é
-- dado de terceiros, e o repositório é público.
--
-- Isto derruba os endereços `/p/<slug>` que estavam no ar. Dez protótipos
-- tinham sido publicados e 24 visitas foram registradas; quem guardou o link
-- passa a receber 404. É consequência aceita, não descuido.

-- Ordem importa: dependentes primeiro, ainda que o `cascade` desse conta.
drop table if exists prototype_views cascade;
drop table if exists outreach_touches cascade;
drop table if exists prototypes cascade;
drop table if exists lead_audits cascade;
drop table if exists prospect_jobs cascade;
drop table if exists search_tasks cascade;
drop table if exists search_cells cascade;
drop table if exists api_usage cascade;
drop table if exists leads cascade;
drop table if exists prospecting_settings cascade;

-- Tabelas da v1, que a v2 substituiu e ninguém chegou a apagar.
drop table if exists prospects cascade;
drop table if exists prospecting_runs cascade;
drop table if exists prospecting_config cascade;

drop function if exists restart_outreach(bigint, text);
drop function if exists advance_lead_stage(bigint, text);
drop function if exists stage_rank(text);
drop function if exists claim_prospect_jobs(text, int);
drop function if exists complete_prospect_job(bigint, boolean, text);
drop function if exists enqueue_job(bigint, text, jsonb);
drop function if exists requeue_stale_jobs(interval);
drop function if exists claim_search_tasks(int);
drop function if exists record_search_task_result(bigint, int, int);
drop function if exists bump_api_usage(text, text, int);
drop function if exists api_usage_window(text, text);

-- `br_today()` e `is_admin()` ficam: nasceram aqui, mas não são deste módulo —
-- a primeira é utilitária de fuso, a segunda é a base de autorização que as
-- policies do CMS podem passar a usar.
