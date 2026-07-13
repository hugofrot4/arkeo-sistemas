-- Schema inicial do Arkeo Sistemas no Supabase.
-- Substitui o backend Express/Prisma: PostgREST expõe estas tabelas como API
-- REST automaticamente, Row Level Security controla quem lê/escreve, e as
-- funções reorder_* substituem as transações de reordenação do Prisma.

-- ── util: mantém updated_at em dia em qualquer UPDATE ───────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── hero (singleton) ─────────────────────────────────────────────────────
create table hero (
  id smallint primary key default 1 check (id = 1),
  badge text not null,
  h1_line1 text not null,
  h1_accent text not null,
  subtitle text not null,
  cta_primary text not null,
  cta_secondary text not null,
  updated_at timestamptz not null default now()
);
alter table hero enable row level security;
create policy "hero_select" on hero for select using (true);
create policy "hero_write" on hero for all to authenticated using (true) with check (true);
create trigger hero_set_updated_at before update on hero
  for each row execute function set_updated_at();

insert into hero (id, badge, h1_line1, h1_accent, subtitle, cta_primary, cta_secondary) values (
  1,
  'Desenvolvimento acelerado com IA',
  'Seu site. Seu sistema.',
  'Sua vantagem.',
  'Desenvolvemos sites e sistemas web personalizados para pequenas e médias empresas que querem crescer com presença digital profissional — sem precisar de equipe técnica interna.',
  'Quero um orçamento',
  'Ver projetos'
);

-- ── settings (singleton) ─────────────────────────────────────────────────
create table settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null,
  tagline text not null,
  copy text not null,
  whatsapp text not null,
  email text not null,
  wa_message text not null,
  instagram text not null,
  linkedin text not null,
  github text not null,
  updated_at timestamptz not null default now()
);
alter table settings enable row level security;
create policy "settings_select" on settings for select using (true);
create policy "settings_write" on settings for all to authenticated using (true) with check (true);
create trigger settings_set_updated_at before update on settings
  for each row execute function set_updated_at();

insert into settings (id, site_name, tagline, copy, whatsapp, email, wa_message, instagram, linkedin, github) values (
  1,
  'Arkeo Sistemas',
  'Precisão em cada linha de código.',
  '© 2026 Arkeo Sistemas. Todos os direitos reservados.',
  '+55 11 99999-9999',
  'contato@arkeosistemas.com.br',
  'Olá, gostaria de saber mais sobre os serviços da Arkeo Sistemas.',
  '',
  '',
  ''
);

-- ── metrics (max 4 itens) ────────────────────────────────────────────────
create table metrics (
  id bigint generated always as identity primary key,
  number text not null,
  label text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table metrics enable row level security;
create policy "metrics_select" on metrics for select using (true);
create policy "metrics_write" on metrics for all to authenticated using (true) with check (true);
create trigger metrics_set_updated_at before update on metrics
  for each row execute function set_updated_at();

create or replace function metrics_enforce_max()
returns trigger language plpgsql as $$
begin
  if (select count(*) from metrics) >= 4 then
    raise exception 'Limite de 4 métricas atingido.';
  end if;
  return new;
end;
$$;
create trigger metrics_max_items before insert on metrics
  for each row execute function metrics_enforce_max();

create or replace function reorder_metrics(ids bigint[])
returns setof metrics language plpgsql security definer set search_path = public as $$
begin
  update metrics m set sort_order = t.idx - 1
  from unnest(ids) with ordinality as t(id, idx)
  where m.id = t.id;
  return query select * from metrics order by sort_order asc;
end;
$$;
grant execute on function reorder_metrics(bigint[]) to authenticated;

insert into metrics (number, label, sort_order) values
  ('+20', 'Projetos entregues', 0),
  ('6', 'Anos de experiência', 1),
  ('100%', 'Remoto e ágil', 2),
  ('✦', 'Suporte contínuo', 3);

-- ── services ──────────────────────────────────────────────────────────────
create table services (
  id bigint generated always as identity primary key,
  icon text not null,
  title text not null,
  description text not null,
  meta text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table services enable row level security;
create policy "services_select" on services for select using (true);
create policy "services_write" on services for all to authenticated using (true) with check (true);
create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();

create or replace function reorder_services(ids bigint[])
returns setof services language plpgsql security definer set search_path = public as $$
begin
  update services s set sort_order = t.idx - 1
  from unnest(ids) with ordinality as t(id, idx)
  where s.id = t.id;
  return query select * from services order by sort_order asc;
end;
$$;
grant execute on function reorder_services(bigint[]) to authenticated;

insert into services (icon, title, description, meta, sort_order) values
  ('layout', 'Landing Page', 'Site de alta conversão para capturar leads e vender produtos ou serviços. Design persuasivo e copy focado em resultado.', 'Entrega em 7–14 dias', 0),
  ('building-2', 'Site Institucional', 'Presença digital completa com múltiplas páginas, gestão de conteúdo e identidade visual que transmite credibilidade.', 'Entrega em 14–30 dias', 1),
  ('settings-2', 'Sistema Web / App', 'Aplicações sob medida para automatizar processos, organizar operações e escalar sem contratar mais pessoas.', 'Prazo definido no escopo', 2);

-- ── process_steps (max 6 itens) ──────────────────────────────────────────
create table process_steps (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table process_steps enable row level security;
create policy "process_steps_select" on process_steps for select using (true);
create policy "process_steps_write" on process_steps for all to authenticated using (true) with check (true);
create trigger process_steps_set_updated_at before update on process_steps
  for each row execute function set_updated_at();

create or replace function process_steps_enforce_max()
returns trigger language plpgsql as $$
begin
  if (select count(*) from process_steps) >= 6 then
    raise exception 'Limite de 6 etapas atingido.';
  end if;
  return new;
end;
$$;
create trigger process_steps_max_items before insert on process_steps
  for each row execute function process_steps_enforce_max();

create or replace function reorder_process_steps(ids bigint[])
returns setof process_steps language plpgsql security definer set search_path = public as $$
begin
  update process_steps p set sort_order = t.idx - 1
  from unnest(ids) with ordinality as t(id, idx)
  where p.id = t.id;
  return query select * from process_steps order by sort_order asc;
end;
$$;
grant execute on function reorder_process_steps(bigint[]) to authenticated;

insert into process_steps (title, description, sort_order) values
  ('Conversa', 'Entendemos seu negócio, suas dores e o que você quer resolver. Sem formulários longos, sem burocracia.', 0),
  ('Proposta', 'Enviamos escopo, prazo e investimento com preço fechado. Zero surpresas financeiras no meio do caminho.', 1),
  ('Desenvolvimento', 'Você acompanha o progresso em tempo real e fala diretamente com quem está desenvolvendo.', 2),
  ('Entrega & Suporte', 'Lançamos com treinamento incluso e suporte contínuo para você nunca ficar na mão após o lançamento.', 3);

-- ── differentials ─────────────────────────────────────────────────────────
create table differentials (
  id bigint generated always as identity primary key,
  icon text not null,
  title text not null,
  description text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table differentials enable row level security;
create policy "differentials_select" on differentials for select using (true);
create policy "differentials_write" on differentials for all to authenticated using (true) with check (true);
create trigger differentials_set_updated_at before update on differentials
  for each row execute function set_updated_at();

create or replace function reorder_differentials(ids bigint[])
returns setof differentials language plpgsql security definer set search_path = public as $$
begin
  update differentials d set sort_order = t.idx - 1
  from unnest(ids) with ordinality as t(id, idx)
  where d.id = t.id;
  return query select * from differentials order by sort_order asc;
end;
$$;
grant execute on function reorder_differentials(bigint[]) to authenticated;

insert into differentials (icon, title, description, sort_order) values
  ('zap', 'IA no processo — mais velocidade, menos custo', 'Usamos inteligência artificial para acelerar o desenvolvimento sem abrir mão da qualidade, entregando mais rápido e por menos que uma agência tradicional.', 0),
  ('message-circle', 'Comunicação direta com quem desenvolve', 'Sem gerente de projeto como intermediário. Você fala diretamente com o desenvolvedor — decisões mais rápidas, menos ruído.', 1),
  ('layers', 'Stack moderna e escalável', 'Tecnologias atuais e código limpo que cresce com seu negócio. Nada de soluções que viram problema em dois anos.', 2),
  ('shield-check', 'Sem taxas surpresa — preço fechado', 'O que foi combinado é o que você paga. Proposta clara e detalhada antes de qualquer linha de código.', 3),
  ('headphones', 'Manutenção e suporte inclusos', 'A entrega não é o fim. Você conta com suporte técnico e atualizações para manter tudo funcionando no longo prazo.', 4),
  ('target', 'Foco total no seu resultado', 'Não vendemos tecnologia — resolvemos problemas de negócio. Cada decisão técnica é tomada com seu objetivo em mente.', 5);

-- ── portfolio_projects ───────────────────────────────────────────────────
create table portfolio_projects (
  id bigint generated always as identity primary key,
  tag text not null,
  title text not null,
  result text not null,
  image text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table portfolio_projects enable row level security;
create policy "portfolio_projects_select" on portfolio_projects for select using (true);
create policy "portfolio_projects_write" on portfolio_projects for all to authenticated using (true) with check (true);
create trigger portfolio_projects_set_updated_at before update on portfolio_projects
  for each row execute function set_updated_at();

create or replace function reorder_portfolio_projects(ids bigint[])
returns setof portfolio_projects language plpgsql security definer set search_path = public as $$
begin
  update portfolio_projects p set sort_order = t.idx - 1
  from unnest(ids) with ordinality as t(id, idx)
  where p.id = t.id;
  return query select * from portfolio_projects order by sort_order asc;
end;
$$;
grant execute on function reorder_portfolio_projects(bigint[]) to authenticated;

insert into portfolio_projects (tag, title, result, image, sort_order) values
  ('Landing Page', 'FitPro Academia', '+40% em matrículas no primeiro mês', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230D1B2E%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%231a3a6e%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22url(%23g)%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22168%22%20font-size%3D%2290%22%20text-anchor%3D%22middle%22%3E%F0%9F%8F%8B%EF%B8%8F%3C%2Ftext%3E%3C%2Fsvg%3E', 0),
  ('Site Institucional', 'Sabor & Arte Confeitaria', 'Pedidos online cresceram 3× após lançamento', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%231a1028%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%233d1a5e%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22url(%23g)%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22168%22%20font-size%3D%2290%22%20text-anchor%3D%22middle%22%3E%F0%9F%8D%B0%3C%2Ftext%3E%3C%2Fsvg%3E', 1),
  ('Sistema Web', 'LogiTrack Transportes', 'Redução de 60% em chamadas de suporte', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23082040%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230D4E8F%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22url(%23g)%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22168%22%20font-size%3D%2290%22%20text-anchor%3D%22middle%22%3E%F0%9F%9A%9A%3C%2Ftext%3E%3C%2Fsvg%3E', 2);

-- ── faq ───────────────────────────────────────────────────────────────────
create table faq (
  id bigint generated always as identity primary key,
  question text not null,
  answer text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table faq enable row level security;
create policy "faq_select" on faq for select using (true);
create policy "faq_write" on faq for all to authenticated using (true) with check (true);
create trigger faq_set_updated_at before update on faq
  for each row execute function set_updated_at();

create or replace function reorder_faq(ids bigint[])
returns setof faq language plpgsql security definer set search_path = public as $$
begin
  update faq f set sort_order = t.idx - 1
  from unnest(ids) with ordinality as t(id, idx)
  where f.id = t.id;
  return query select * from faq order by sort_order asc;
end;
$$;
grant execute on function reorder_faq(bigint[]) to authenticated;

insert into faq (question, answer, sort_order) values
  ('Quanto tempo leva para ter meu site pronto?', 'Landing pages ficam prontas em 7 a 14 dias. Sites institucionais levam de 14 a 30 dias. Sistemas e apps têm prazo definido na proposta após levantamento de requisitos. Trabalhamos sempre com datas reais — sem estimativas otimistas que não se cumprem.', 0),
  ('Vocês fazem manutenção após o lançamento?', 'Sim. Oferecemos suporte técnico pós-entrega e planos de manutenção mensal. Você nunca ficará sem apoio depois que seu projeto for ao ar — seja para correções, atualizações de conteúdo ou melhorias.', 1),
  ('Preciso de conhecimento técnico para gerenciar o site?', 'Não. Todos os projetos são entregues com treinamento incluso. Sites com CMS têm edição simples — como editar um documento de texto. Para o restante, nossa equipe de suporte está disponível.', 2),
  ('Vocês trabalham com contrato?', 'Sempre. Todos os projetos têm contrato com escopo, prazos, valores e condições de pagamento claramente definidos. Isso protege ambos os lados e garante que o combinado será entregue.', 3),
  ('Qual é o investimento necessário?', 'Os valores variam conforme o escopo de cada projeto. Após nossa conversa inicial você recebe uma proposta com preço fechado — sem custos ocultos. Fale conosco para uma análise inicial gratuita.', 4),
  ('Consigo acompanhar o desenvolvimento em tempo real?', 'Sim. Utilizamos ferramentas de acompanhamento e você recebe atualizações regulares. Em qualquer momento pode falar diretamente com quem está desenvolvendo — sem intermediários, sem burocracia.', 5);

-- ── messages (leads do formulário de contato) ────────────────────────────
create table messages (
  id bigint generated always as identity primary key,
  name text not null,
  whatsapp text not null,
  service text not null,
  message text not null default '',
  status text not null default 'novo' check (status in ('novo', 'contato', 'convertido', 'descartado')),
  date timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_date_idx on messages (date);
alter table messages enable row level security;
-- Envio público do formulário de contato — sem autenticação.
create policy "messages_insert_public" on messages for insert to anon, authenticated with check (true);
create policy "messages_manage_authenticated" on messages for select to authenticated using (true);
create policy "messages_update_authenticated" on messages for update to authenticated using (true) with check (true);
create policy "messages_delete_authenticated" on messages for delete to authenticated using (true);
create trigger messages_set_updated_at before update on messages
  for each row execute function set_updated_at();
