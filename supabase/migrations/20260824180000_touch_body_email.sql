-- Cada toque passa a guardar as duas redações.
--
-- A doutrina sempre teve duas colunas de tamanho — "e-mail (entrega no 1)" e
-- "WhatsApp (entrega no 2)" —, mas a tabela guardava um corpo só. Na prática
-- isso significava que, num toque de WhatsApp, o texto de e-mail não existia
-- em lugar nenhum: para mandar por e-mail era preciso trocar o canal do toque
-- e reescrever à mão.
--
-- As duas versões não são a mesma frase em tamanhos diferentes. As sequências
-- estão deslocadas de um toque: em e-mail a entrega vai no toque 1, porque
-- link em e-mail é esperado; no WhatsApp o toque 1 é frio e só pergunta com
-- quem falar, e a entrega desce para o 2. Então no mesmo slot moram mensagens
-- de papéis diferentes, e é por isso que precisam de colunas diferentes.
--
-- `subject` já pertencia à versão de e-mail e continua onde está.

alter table outreach_touches
  add column if not exists body_email text;

comment on column outreach_touches.body_email is
  'Redação deste toque para o canal e-mail. Nula quando não foi escrita — o '
  'card cai no `body` e avisa que o texto é de WhatsApp.';

comment on column outreach_touches.body is
  'Redação deste toque para o canal WhatsApp. É também o texto usado quando '
  '`body_email` não existe.';
