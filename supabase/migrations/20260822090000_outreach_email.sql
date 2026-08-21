-- Abordagem por e-mail.
--
-- O WhatsApp começou a marcar os envios como spam. O canal já existia na
-- coluna `channel` desde o início; faltava o que e-mail exige e mensagem de
-- WhatsApp não tem: assunto.
--
-- Sobre o envio: continua manual, abrindo o cliente de e-mail com tudo
-- preenchido. Disparo programático a partir do domínio exigiria SPF, DKIM e um
-- subdomínio separado para prospecção fria — sem isso, um índice ruim de spam
-- derruba a entrega do domínio inteiro, inclusive o e-mail que vai para
-- cliente. E-mail escrito de uma caixa real passa em filtro onde disparo em
-- massa não passa.

alter table outreach_touches add column subject text;

-- Qual canal usar com cada lead. Fica no lead e não no toque porque a decisão
-- é sobre a pessoa — o contato que ela tem —, não sobre a mensagem.
alter table leads
  add column preferred_channel text not null default 'whatsapp'
  check (preferred_channel in ('whatsapp', 'email'));

-- Quem não tem celular mas tem e-mail já nasce no canal certo, em vez de ficar
-- parado na fila esperando um número que não existe.
update leads
set preferred_channel = 'email'
where whatsapp_valid = false
  and phone_e164 is null
  and email is not null;

comment on column leads.preferred_channel is
  'Canal de abordagem. Definido na coleta e ajustável à mão na fila.';
