-- `restart_outreach` apagava a mensagem de entrega.
--
-- Ela assumia que o toque 1 era a abertura da sequência — a que pedia
-- permissão — e o sobrescrevia com a pergunta de roteamento. Mas nas
-- sequências mais antigas o toque 1 era a **entrega**: trazia o link do
-- protótipo, e era o único toque que o trazia. Sobrescrevê-lo tirou o
-- protótipo de toda a sequência, que passou a cobrar resposta sobre uma
-- prévia que nunca seria enviada.
--
-- Agora, quando o toque 1 carrega o link, o texto dele desce para o toque 2 —
-- que é onde a entrega vai na doutrina atual — antes de a abertura ser
-- escrita por cima. O que estava no toque 2 sai: era o acompanhamento da
-- entrega ("chegou a abrir?"), e ele não tem mais lugar depois que a entrega
-- passou a acontecer ali.

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
  v_entrega text;
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
    -- A entrega se reconhece pelo link: é o endereço do protótipo, servido em
    -- /p/<slug> pelo próprio app.
    select body into v_entrega
      from outreach_touches
     where lead_id = p_lead_id
       and step = 1
       and body like '%/p/%';

    if v_entrega is not null then
      update outreach_touches
         set body = v_entrega
       where lead_id = p_lead_id
         and step = 2;
    end if;

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
