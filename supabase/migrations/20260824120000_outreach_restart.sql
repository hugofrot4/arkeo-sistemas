-- Reinício de sequência de abordagem.
--
-- A doutrina do primeiro toque mudou: no WhatsApp ele deixou de pedir
-- permissão para mandar o protótipo e passou a perguntar com quem falar sobre
-- o site. Os leads já abordados carregam o texto antigo em `outreach_touches`,
-- e não há como corrigi-los sem desfazer o que já saiu.
--
-- O reinício resolve isso sem jogar fora o trabalho: só o toque 1 é reescrito
-- — era ele que carregava a abordagem —, e os toques 2 a 4 continuam válidos
-- palavra por palavra, porque a entrega do protótipo e os argumentos não
-- mudaram de lugar na sequência.

alter table leads
  add column if not exists outreach_restarted_at timestamptz;

comment on column leads.outreach_restarted_at is
  'Quando a sequência de abordagem foi reiniciada. Ordena a fila: quem foi '
  'abordado com o texto antigo volta ao topo, porque é dele que se sabe mais '
  'e é ele que já tem protótipo publicado.';

create index if not exists leads_outreach_restarted_idx
  on leads (outreach_restarted_at desc nulls last)
  where outreach_restarted_at is not null;

/**
 * Devolve o lead ao começo da sequência.
 *
 * Faz num só passo o que a interface faria em cinco round-trips, e faz de
 * forma atômica: sequência meio reiniciada é pior que não reiniciada.
 *
 * `p_body` nulo mantém o texto do toque 1 — é o caso do canal e-mail, onde a
 * entrega no primeiro toque continua sendo a doutrina e só o histórico de
 * envio precisa ser limpo.
 *
 * O `subject` não é tocado. Ele pertence à variante por e-mail daquele slot, e
 * o texto que se reescreve aqui é o de WhatsApp — apagá-lo perderia o assunto
 * sem nada em troca.
 *
 * Lead ganho ou perdido não reinicia: quem já fechou não volta para a fila de
 * prospecção por causa de uma troca de texto.
 */
create or replace function restart_outreach(
  p_lead_id bigint,
  p_body text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage text;
  v_n int;
begin
  if not is_admin() then
    raise exception 'não autorizado';
  end if;

  select stage into v_stage from leads where id = p_lead_id for update;
  if v_stage is null then
    raise exception 'lead % não existe', p_lead_id;
  end if;
  if v_stage in ('ganho', 'perdido') then
    return 0;
  end if;

  if p_body is not null then
    update outreach_touches
       set body = p_body
     where lead_id = p_lead_id
       and step = 1;
  end if;

  -- Toda a sequência volta a pender, reagendada a partir de hoje com o mesmo
  -- espaçamento de sempre. Inclui os toques cancelados: reiniciar é justamente
  -- trazer de volta quem tinha saído da fila.
  update outreach_touches
     set status = 'pending',
         sent_at = null,
         scheduled_for = br_today() + (
           case step when 1 then 0 when 2 then 2 when 3 then 5 else 9 end
         )
   where lead_id = p_lead_id;
  get diagnostics v_n = row_count;

  update leads
     set stage = 'prototipo_pronto',
         contacted_at = null,
         outreach_restarted_at = now()
   where id = p_lead_id;

  return v_n;
end;
$$;

revoke all on function restart_outreach(bigint, text) from public;
grant execute on function restart_outreach(bigint, text) to authenticated;
