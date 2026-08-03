-- A migration 20260803120000_prospecting.sql já tinha sido aplicada quando a
-- trava de gasto mensal foi adicionada — por isso vai numa migration própria
-- em vez de editar o arquivo já executado.

alter table prospecting_config
  add column monthly_free_limit int not null default 900 check (monthly_free_limit > 0);
