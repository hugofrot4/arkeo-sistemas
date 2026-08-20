-- Agendamento do worker de prospecção (opcional).
--
-- NÃO é uma migration: depende do ref do projeto e da service key, que são
-- específicos do ambiente. Rode uma vez no SQL Editor do Supabase, trocando os
-- dois valores marcados. Sem isto, o módulo funciona igual — só exige clicar
-- em "Processar fila" na aba Operação.
--
-- O que o agendamento resolve: a fila anda sozinha. Sem ele, um lead
-- descoberto hoje só é auditado quando alguém abrir o admin.

-- 1. Extensões
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 2. Guarda a service key no Vault (nunca em texto puro numa migration)
--    Troque <SUPABASE_SERVICE_ROLE_KEY> pela chave do projeto.
select vault.create_secret(
  '<SUPABASE_SERVICE_ROLE_KEY>',
  'prospect_worker_key',
  'Service key usada pelo pg_cron para chamar a Edge Function do worker'
);

-- 3. Worker a cada 2 minutos.
--    Troque <PROJECT_REF> pelo ref do projeto (o subdomínio de *.supabase.co).
--
--    A cada disparo o worker pega no máximo 5 jobs e respeita as cotas
--    configuradas, então o intervalo curto não vira gasto: quando não há
--    nada pendente ou a cota do dia acabou, a chamada retorna sem trabalho.
select cron.schedule(
  'prospect-worker',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/prospect-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apiKey', (select decrypted_secret from vault.decrypted_secrets where name = 'prospect_worker_key')
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- 4. Descoberta uma vez por dia, às 9h de Brasília (12h UTC).
--    Deixada separada de propósito: é a parte que gasta cota do Google, e
--    convém poder pausar só ela.
select cron.schedule(
  'prospect-source',
  '0 12 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/prospect-source',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apiKey', (select decrypted_secret from vault.decrypted_secrets where name = 'prospect_worker_key')
    ),
    timeout_milliseconds := 120000
  );
  $$
);

-- Conferir:      select jobname, schedule, active from cron.job;
-- Ver execuções: select * from cron.job_run_details order by start_time desc limit 20;
-- Pausar:        select cron.unschedule('prospect-source');
