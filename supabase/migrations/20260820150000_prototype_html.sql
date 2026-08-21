-- Protótipo passa a ser um HTML autoral por lead, em vez de conteúdo JSON
-- encaixado num de cinco templates React.
--
-- Motivo: cinco layouts para todos os leads sempre vai parecer template, e
-- parecer template derruba o argumento — o protótipo existe justamente para
-- o dono do negócio pensar "isso é melhor do que eu tenho". Agora cada site é
-- escrito no Claude Code com a skill `prototipo-site` e enviado por upload.
--
-- A página /p/:slug serve esse HTML dentro de um iframe isolado, então o
-- arquivo é o site do cliente inteiro, sem nada da Arkeo dentro dele.

alter table prototypes add column html text;

-- Título da aba do navegador, extraído do <title> no upload. Guardado à parte
-- para a listagem do admin não precisar carregar o HTML inteiro.
alter table prototypes add column page_title text;

-- As linhas antigas (formato JSON) continuam válidas; as novas trazem html.
alter table prototypes alter column content drop not null;
alter table prototypes alter column template drop not null;

alter table prototypes add constraint prototypes_has_body
  check (html is not null or content is not null);

-- Teto generoso para um HTML de arquivo único com CSS e SVG embutidos.
-- Acima disso é quase sempre um data: URI que deveria ser CSS.
alter table prototypes add constraint prototypes_html_length
  check (html is null or char_length(html) <= 800000);

-- Contagem de tokens só fazia sentido quando a geração era chamada de API
-- pelo servidor. Hoje o conteúdo é escrito fora do sistema.
alter table prototypes drop column if exists input_tokens;
alter table prototypes drop column if exists cached_input_tokens;
alter table prototypes drop column if exists output_tokens;
