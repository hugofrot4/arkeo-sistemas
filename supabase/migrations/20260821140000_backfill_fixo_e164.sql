-- Telefone fixo também pode ter WhatsApp.
--
-- A classificação original descartava fixo: `phone_e164` só era preenchido
-- quando o número tinha formato de celular. Mas o WhatsApp Business verifica
-- linha fixa por ligação, e clínica, restaurante e escritório usam isso o
-- tempo todo — os leads com fixo ficavam parados na fila sem ação possível.
--
-- Este backfill preenche `phone_e164` para os fixos que já estão na base, a
-- partir do `phone` que veio do Google. `whatsapp_valid` continua false: ele
-- afirma "é celular", e para fixo não dá para saber sem tentar. Quem opera
-- decide, e o próprio WhatsApp avisa se o número não existir por lá.
--
-- Evita reprocessar o job `details`, que gastaria cota paga da Places API para
-- recuperar um dado que já está guardado.

update leads
set phone_e164 = '+55' || regexp_replace(phone, '\D', '', 'g')
where phone_e164 is null
  and phone is not null
  and length(regexp_replace(phone, '\D', '', 'g')) in (10, 11)
  -- DDD plausível: o país não usa 00 a 10.
  and substring(regexp_replace(phone, '\D', '', 'g') from 1 for 2)::int between 11 and 99;
