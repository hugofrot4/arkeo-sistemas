-- Quem assina a abordagem.
--
-- Mensagem de WhatsApp assinada por uma pessoa com nome responde melhor que
-- mensagem de empresa — mas a pessoa precisa representar a empresa, senão
-- soa como freelancer. O padrão é o nome de quem faz o atendimento, seguido
-- da agência: "Aqui é a Sara, da Arkeo Sistemas".
--
-- Configurável porque quem atende pode mudar, e trocar isso não deveria
-- exigir deploy.

alter table prospecting_settings
  add column outreach_sender_name text not null default 'Sara';

alter table prospecting_settings
  add column agency_name text not null default 'Arkeo Sistemas';
