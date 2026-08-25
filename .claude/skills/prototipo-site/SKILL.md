---
name: prototipo-site
description: Gera um protótipo de site completo (index.html único) para um lead da prospecção da Arkeo, a partir de um brief e de imagens de inspiração. Use quando pedirem "gerar protótipo", "criar site para <negócio>", "novo protótipo", ou quando colarem um brief da aba Prospecção do admin. Produz um arquivo pronto para abrir no navegador e subir no sistema.
---

# Protótipo de site

Você vai construir um site inteiro para um pequeno negócio brasileiro que **ainda não é cliente**. O protótipo é enviado ao dono por WhatsApp antes de qualquer conversa de venda — é ele que abre a porta.

O padrão a bater não é "um site aceitável". É o dono do negócio olhar no celular e pensar *"isso é melhor do que eu tenho"*. Um layout que parece template não faz isso.

## Fluxo

### 1. Reúna o material

Você precisa de:

- **Brief** — colado da aba Prospecção do admin, ou informado na conversa. Traz nome, ramo, bairro, cidade, situação da presença digital atual, os achados da auditoria e o endereço do site atual, quando existir.
- **Referência visual** — print de site, peça gráfica, foto de fachada, paleta. É o insumo que mais separa protótipo autoral de template, então **peça sempre**, não espere ser oferecido:

  > Tem alguma referência visual? Print de um site que você gosta, do ramo ou não, ou qualquer peça que dê o clima. Se não tiver, eu escolho a direção e te mostro antes de construir.

  Peça antes de declarar a direção do passo 4 — chegar com referência depois do site pronto custa uma reconstrução.

Se faltar o essencial (nome e ramo), pergunte. Não invente para preencher.

Se o usuário disser que não tem referência, siga assim mesmo — mas escolha uma direção deliberada em vez de cair no padrão. Ver `references/design.md`.

### 2. Se o lead já tem site, extraia o material dele

**Este é o passo que mais muda o resultado.** Um protótipo que reaproveita a logo, as fotos e os serviços reais do negócio deixa de ser uma proposta genérica e vira *o site dele, refeito*. É outra conversa.

```bash
python3 .claude/skills/prototipo-site/scripts/extrair.py <url-do-site> <slug>
```

Gera `prototipos/<slug>/fonte/`:

| Arquivo | O que traz |
|---|---|
| `relatorio.md` | título, descrição, cores do CSS, estrutura de títulos, contatos publicados, redes sociais, texto da página |
| `imagens/` | logo e fotos, já convertidas para WebP e redimensionadas |
| `datauris/` | as mesmas imagens em `data:` URI, prontas para colar no HTML |

**Leia o `relatorio.md` inteiro antes de desenhar.** Dele saem:

- **a logo** — use a real, sempre que houver; nada de inventar um monograma quando existe marca
- **as fotos** — resolvem a falta de imagem; escolha as melhores dentro do orçamento de tamanho
- **a paleta da marca** — a seção *Paleta da marca* do relatório traz as cores tiradas da logo e os quatro papéis já derivados, com o acento escurecido até passar no contraste. **Use essa paleta**, mesmo que haja referência visual: a referência dá estrutura e clima, a logo dá a cor
- **os serviços reais** — a estrutura de títulos diz o que o negócio de fato oferece
- **os contatos** — telefone e redes publicados por ele

O relatório informa quantos KB cada imagem custa em `data:` URI. O arquivo final fica abaixo de 400 KB, então escolha: **a logo sempre entra**; duas ou três fotos boas valem mais que oito medianas.

Se o script falhar, é lead de site quebrado — siga sem material e trate a falta de imagem como em `references/design.md`.

**Veja como o site está hoje.** É daí que sai a proposta de nova versão — e é a régua do protótipo, que precisa ser visivelmente melhor que aquilo:

```bash
node .claude/skills/prototipo-site/scripts/capturar.mjs <url-do-site> <slug>
```

Tira print em celular e computador e escreve `atual/relatorio.md`. **O script não julga o site.** Ele traz só fatos inequívocos e avisa quando a própria captura pode ter dado errado. Quem avalia é você, olhando `atual/mobile.png` e `atual/desktop.png`.

Não é preciosismo. Uma versão anterior deste script pontuava o site de 0 a 100 com frases prontas para a abordagem, e no primeiro lead real cravou "27 mil pixels de altura no celular" — o que tanto podia ser o site quanto o navegador headless falhando a carregar a fonte do cliente. Número dá autoridade a palpite, e palpite na primeira mensagem encerra a conversa.

#### A régua para citar algo na abordagem

> **Só afirme o que o dono confirmaria abrindo o site no próprio celular.**

Antes de transformar qualquer observação em frase de venda:

1. **Leia a seção de ressalvas do relatório.** Se ela menciona o que você ia citar, a captura pode ser a culpada — confirme antes.
2. **Distinga defeito do site de falha da captura.** Conteúdo misto (HTTPS pedindo HTTP) atinge todo visitante e é fato. Fonte que não baixou pode ser só o nosso acesso.
3. **Na dúvida, não cite.** Há sempre outro ângulo, e um errado custa o lead inteiro.

#### Equilíbrio, sem virar elogio vazio

Olhe os prints procurando também **o que está bom** — marca bonita, conteúdo forte, foto decente. Aproveite no protótipo em vez de descartar, e reconheça na abordagem: coloca o dono do seu lado em vez de na defensiva.

Mas **elogio é uma cláusula, não é o corpo da mensagem**. Reconhecer o que funciona não substitui dizer o que você faz, o que ele ganha e o que fazer em seguida — a mensagem que só elogia e manda link é educada e não vende nada. As regras de venda estão em `references/abordagem.md`.

**No máximo duas críticas na sequência inteira**, nunca as duas na mesma mensagem. E toda crítica vem com a consequência para o negócio dele, senão só constrange.

Se o site estiver em dia, **não force o argumento de modernização** — insistir que está velho um site que está bom queima a credibilidade. Nesse caso o ângulo é outro: o que o site ainda não faz (captar contato, mostrar um serviço, abrir bem no celular), não o que ele tem de errado.

**Lead sem site, só com Instagram.** Há extrator para isso também:

```bash
python3 .claude/skills/prototipo-site/scripts/instagram.py <perfil-ou-url> <slug> 6
```

Traz a foto de perfil como logo, as fotos recentes do feed, a bio, os nomes dos destaques e o site informado na bio. Escreve em `fonte/`, no mesmo formato do outro extrator — com a paleta da marca já derivada da foto de perfil.

O script tenta **dois caminhos**, nesta ordem, e o relatório diz qual foi usado:

1. **Endpoint interno** — dois segundos, foto de perfil em alta, legendas de verdade. Também é o que responde **429** com facilidade.
2. **Navegador de verdade** (Chromium via Playwright) — uns trinta segundos, mas passa onde requisição não passa. Quando o endpoint bloqueia, `curl` no perfil só devolve o *login wall*: o perfil público é montado por JavaScript.

**O que muda quando cai no navegador**, e o relatório avisa:

- **A logo vem em 150px** e não dá para ampliar — a URL é assinada para aquele recorte, e `s320`, `s1080` ou tirar o `stp` dão 403. Dimensione o selo para 150px no máximo, ou a logo aparece borrada justamente no elemento que o dono olha primeiro.
- **As fotos vêm em 640px** em vez do tamanho cheio.
- **No lugar da legenda vem o texto alternativo**, que inclui OCR do texto dentro da imagem. Troca boa: é o jeito mais rápido de achar card de texto para descartar, e às vezes entrega fato publicado que a bio não traz — lista de especialidades, dias de atendimento, promoção antiga. **Leia essa coluna do relatório**, ela costuma render mais conteúdo que a bio.

São **fotos reais do negócio**, o que vale muito mais que imagem de banco. Mas nem toda foto de feed serve num site: descarte print, card de texto, foto escura e imagem com promoção antiga embutida. Feed costuma ser quadrado ou 4:5, então encaixa em grade e coluna, e mal em faixa de largura total.

**Os nomes dos destaques dizem que informação existe.** Um destaque chamado *Horário* ou *Convênios* é a confirmação de que o dado existe — e de que ele não está em lugar nenhum que dê para ler. O conteúdo não vem pelo script: vai para placeholders, e é bom gancho de conversa.

Se a bio informar um site, rode `extrair.py` nele também — site rende mais texto e contexto que o perfil.

**Se a bio apontar para um Linktree**, vale abrir: costuma trazer o WhatsApp de verdade e as outras redes. **Mas nunca use o avatar do Linktree como logo.** Ele não acompanha a troca de marca no Instagram e pode estar anos atrasado — já aconteceu de um protótipo inteiro ser construído na paleta da placa antiga, e ter que ser refeito.

**Se os dois caminhos falharem**, o caminho manual continua valendo:

1. Confira a seção **Observações do admin** no brief — é onde a bio e os serviços costumam estar colados.
2. Veja se há imagens em `fonte/imagens/`; quem preparou o lead pode ter salvo a logo à mão.
3. Não havendo nada, **peça ao usuário antes de construir** — vale mais esperar dois minutos por uma logo do que entregar protótipo sem marca.

### 3. Leia as referências visuais

Para cada imagem enviada, extraia e anote:

- **Paleta** — nomeie os hexadecimais que você vê, não "azul e branco".
- **Tipografia** — a personalidade (grotesca, serifada editorial, condensada, geométrica) e o contraste de tamanho entre título e corpo.
- **Estrutura** — como o espaço é dividido. Simétrico ou assimétrico? Onde respira? Onde adensa?
- **Um movimento distintivo** — a coisa específica que faz aquela peça não parecer genérica.

Você empresta **estrutura, ritmo e clima**. Nunca copia conteúdo, marca, foto ou texto da referência.

**Vindo referência ou não, busque o repertório atual antes de decidir.** Leia as seções *Repertório técnico* e *Vocabulário visual atual* de `references/design.md` — fundos, superfícies, tipografia e a lista do que datou. Havendo acesso à web, olhe também dois ou três sites recentes do ramo ou de ramo vizinho e anote o que neles é de agora; sem acesso, a seção basta. A referência que o usuário mandou dá o clima; o repertório impede que a execução saia com cara de 2016.

### 4. Declare a direção antes de escrever código

Escreva estas linhas, mostre ao usuário e siga em frente — não espere aprovação:

```
Ideia estrutural: <a ÚNICA ideia que organiza a página>
Paleta:           <4 hexadecimais — da logo, se houver logo>
Tipografia:       <par de fontes do Google Fonts + por quê>
Fundo:            <o que fica atrás e dá o que desfocar — malha, foto, gradiente>
Vidro:            <as 2 ou 3 superfícies translúcidas, e o que passa por trás de cada uma>
Movimento:        <2 ou 3 efeitos nomeados, do repertório de design.md>
Técnicas:         <3 ou 4 do Repertório técnico, diferentes das do último protótipo>
Risco:            <o que pode não funcionar>
```

**Vidro e movimento não são opcionais.** Toda página leva superfície de vidro e leva animação — é o que separa um protótipo que impressiona de um que parece modelo pronto, e impressionar é o produto aqui. O que varia é **quais** e **onde**: as regras de ofício, os limites de contraste e a lista do que é proibido estão em `references/design.md`, seções *Vidro* e *Movimento*.

O vidro exige planejar o fundo **antes**: vidro sobre branco chapado é um retângulo cinza. Por isso a linha `Fundo` vem antes da linha `Vidro`.

A linha `Técnicas` é o que faz dois leads do mesmo ramo saírem diferentes. `references/design.md`, seção *Repertório técnico*, lista onze recursos conferidos no navegador que gera os prints — bento, container query, `:has()`, gradiente animado por `@property`, grão, modo escuro, revelar sem JavaScript. Escolha por adequação ao conteúdo, não por novidade, e **nunca repita o conjunto do protótipo anterior**.

Este passo existe para impedir o padrão automático. Se a direção couber em "hero centrado, três cards com ícone, rodapé escuro", **descarte e escolha outra**.

Diferenciar é escolher **como dizer**, nunca deixar de dizer: a estrutura que converte no ramo é convenção e se respeita, a expressão visual é autoral e não se repete. Duas clínicas respondem às mesmas perguntas, na mesma ordem, e ainda assim parecem sites de empresas diferentes. Ver `references/design.md`, seção *O que é convenção e o que é autoral*.

**Antes de fixar, olhe os protótipos anteriores** — a receita de `references/design.md`, seção *Não repita o protótipo anterior*, lista fonte, paleta e seções de cada um já feito. Leads do mesmo ramo convergem sozinhos, e dois concorrentes recebendo páginas parecidas destrói o argumento. Escolha diferente dos mais recentes em pelo menos duas frentes: par tipográfico, ideia estrutural, ordem das seções, temperatura da paleta.

### 5. Sem foto própria? Busque imagens de apoio

Só depois de esgotar as fontes reais: site atual (`extrair.py`) e Instagram (`instagram.py`). Foto do próprio negócio ganha de qualquer banco de imagens — mas página sem foto nenhuma parece pobre e derruba o argumento, então quando não houver nenhuma:

```bash
python3 .claude/skills/prototipo-site/scripts/imagens.py <slug> <template> 3
```

Busca no Openverse em `cc0,pdm`: domínio público, uso comercial livre e sem exigir crédito na página. Escreve em `prototipos/<slug>/banco/`, no mesmo formato do extrator.

**O que separa uso legítimo de vigarice não é a origem da foto, é o que ela afirma.** Textura, detalhe, ingrediente e ambiente sem rosto: pode. Foto que dê a entender "esta é a nossa equipe" ou "este é o nosso espaço": não. As regras completas estão em `references/design.md`, seção *Imagens de apoio* — leia antes de escolher.

Toda imagem de banco que entrar na página é declarada na seção de placeholders como ilustrativa.

### 6. Faça o casting das imagens e fixe as medidas

Duas decisões que, tomadas antes do markup, evitam a maior parte do retrabalho.

**Casting.** O `fonte/relatorio.md` traz um elenco com formato, proporção, tipo e papel sugerido de cada arquivo. **Abra as imagens e olhe** — o script sabe a proporção, não sabe o que está retratado. Para cada uma que for usar, anote:

```
<arquivo>  →  <papel na página>  |  proporção <x:y>  |  não cortar: <o quê>
```

Proporção errada é o que produz foto esticada e corte no meio do rosto. A tabela de qual formato serve para qual papel está em `references/composicao.md`.

**Medidas.** Escreva o `:root` com a escala de espaço, o container e o ritmo vertical **antes** da primeira seção. Depois disso, nenhum valor solto no CSS. É o que impede as bordas de cada seção começarem num lugar diferente.

### 7. Construa

Um arquivo: `prototipos/<slug>/index.html`.

`<slug>` é o nome do negócio em minúsculas, sem acento, com hífen. Ex.: `clinica-sorriso-vivo`.

Ícone é sempre de biblioteca — **Material Symbols pelo Google Fonts**, com os nomes validados. Nada de `<path>` desenhado à mão, fora marca de rede social. O porquê e o como estão em `references/tecnico.md`.

Contrato de layout — container único, grade que fecha a base, imagem com proporção reservada — em `references/composicao.md`. Restrições do arquivo em `references/tecnico.md`. O que cada ramo precisa em `references/nichos.md` — **leia a seção do ramo do lead antes de escrever a primeira linha de copy**.

### 8. Escreva a abordagem

`prototipos/<slug>/abordagem.txt` — **as duas escadas**: quatro blocos de WhatsApp separados por `---`, uma linha `=== E-MAIL ===`, e os quatro de e-mail, também separados por `---`.

```
Oi, tudo bem? Aqui é a Sara, da Arkeo Sistemas — a gente cria sites para
clínicas aqui no Ceará.

Quem cuida do site de vocês? Queria falar com essa pessoa sobre uma coisa
que reparei nele. Tem um e-mail dela?
---
... a entrega, com {{link}}
---
... insiste uma vez e propõe dez minutos
---
... encerra
=== E-MAIL ===
Assunto: Uma prévia do site da Clínica X
... a entrega, com {{link}}
---
Assunto: Sobre a prévia que enviei
... retoma, com o argumento que ficou de fora
---
Assunto: Dez minutos essa semana?
... a consequência específica + a proposta de conversa
---
Assunto: Encerrando por aqui
... encerra
```

**Cada escada tem a sua ordem, e ela não é a mesma.**

| bloco | WhatsApp | e-mail |
|---|---|---|
| 1 | pergunta com quem falar — sem link, sem oferta | a entrega, com `{{link}}` |
| 2 | a entrega, com `{{link}}` | retomada, com o argumento que ficou de fora |
| 3 | insiste e propõe dez minutos | a consequência específica **e** a proposta de conversa |
| 4 | encerra | encerra |

A diferença vem de um fato só: em e-mail você já sabe para quem escrever, então entrega logo. No WhatsApp você fala com a recepção, que não decide — o primeiro toque descobre com quem falar, e tudo desce um degrau.

**Você não precisa acertar o encaixe.** Escreva as duas escadas nessa ordem e o sistema coloca cada bloco no toque certo, conforme o lead tenha e-mail ou não. É por isso que o bloco 3 de e-mail traz a consequência junto com a proposta: num lead sem e-mail ele é o único degrau que sobra para os dois.

**Escreva os oito.** Sem a parte de e-mail o sistema aceita, mas o card cai no texto de WhatsApp quando o canal virar — e o canal vira, porque é para isso que o toque 1 pede o contato.

**Refazer a abordagem de um lead que já está na sequência é normal.** Gere um `abordagem.txt` novo e suba pelo botão "Trocar abordagem", no card da fila, ou arrastando o arquivo na aba Protótipos. O sistema troca o toque atual e os seguintes; os que já saíram ficam como estão, porque guardam o que foi dito de fato. Nesse caso o `{{link}}` continua sendo escrito como marcador — o endereço já existe, e é o sistema que o substitui.

**Leia `references/abordagem.md` antes de escrever.** É onde estão a estrutura da mensagem de entrega, a tradução de achado técnico em consequência de negócio, e o CTA que abre a próxima conversa em vez de pedir opinião.

**Quem assina.** O brief informa o nome de quem faz o atendimento e o nome da empresa. As mensagens vão em nome dessa pessoa, **representando a empresa** — não em nome de um profissional autônomo.

**Cada bloco pode ser o primeiro que a pessoa lê.** O canal muda no meio da sequência, o sistema abre uma mensagem nova a cada toque em vez de responder à anterior, e os toques anteriores provavelmente não foram lidos — se tivessem sido, já teria havido resposta. Então todo bloco se identifica, e nenhum diz por onde a prévia foi: escreva *"mandei esta semana uma prévia do site de vocês"*, nunca *"a prévia que te mandei aqui"*. Nada de "conforme falamos" ou "sobre o que te mostrei".

**O assunto.** Cada bloco **da parte de e-mail** abre com uma linha `Assunto: ...`, até 55 caracteres e diferente dos outros três. Os blocos de WhatsApp não levam assunto.

**O link.** Escreva `{{link}}` onde o endereço encaixa na frase — no **bloco 1 da parte de e-mail** e no **bloco 2 da de WhatsApp**. Mensagem fria com link para quem não tem você nos contatos é o padrão que restringiu o número da Arkeo, mesmo com menos de vinte envios por dia. O sistema substitui na publicação e remove o marcador do primeiro toque de WhatsApp mesmo que ele apareça lá; sem marcador nenhum, deposita o link no fim do bloco certo — mas escreva o marcador, porque colado no fim a frase em volta não o apresenta.

**Tamanho.** Não há teto que recuse. Há proporção: a entrega é a mensagem longa, porque carrega o argumento; as outras são curtas porque só pedem uma coisa. Em e-mail cabe mais que no WhatsApp, onde texto longo é lido na diagonal e a parte que se pula é a pergunta do fim. Tabela orientativa em `references/abordagem.md`.

#### O que a mensagem tem que fazer

Ao terminar de ler **a mensagem de entrega** — bloco 1 no e-mail, bloco 2 no WhatsApp —, o dono precisa saber quatro coisas: **quem está falando e o que a empresa faz**, **o que ele ganha**, **o que foi feito para ele**, e **o que fazer em seguida**. Falhou em qualquer uma, a mensagem é ignorada.

O erro mais comum — e o mais caro — é a mensagem simpática que elogia o site, manda o link e termina com "me diga o que achou". Ela nunca diz que existe um serviço à venda, e pede uma opinião em vez da próxima conversa. Educada e inútil.

#### Como se apresenta a empresa

| Nunca | Sempre |
|---|---|
| "eu mexo com sites" | "somos especializados em criação de sites" |
| "trabalho com criação de sites" | "a gente cria sites para clínicas aqui no Ceará" |
| "faço sites pra empresas" | "desenvolvemos sites para pequenos negócios da região" |

Primeira pessoa do plural para a empresa, singular para o que a pessoa fez: *"a gente cria sites para clínicas, e eu preparei uma prévia da página de vocês"*.

#### Tom

- Português correto, frases completas. Nada de `vc`, `blz`, `pfv`, `tbm`.
- Sem gíria e sem intimidade forçada. Trate por "você" e "vocês".
- No máximo um emoji na conversa inteira, e só se cair natural. Zero é melhor que forçado.
- Nenhum jargão: responsivo, SEO, conversão, otimizado, engajamento. O dono da clínica não usa nenhuma dessas palavras.
- Nenhum superlativo sobre a própria empresa, nenhuma promessa de resultado.
- Uma saudação por mensagem, no começo. Depois da entrega, cada uma é mais curta que a anterior.

#### Antes de salvar

**Estrutura do arquivo**
- [ ] Duas partes separadas por `=== E-MAIL ===`, quatro blocos em cada, separados por `---`
- [ ] Cada bloco da parte de e-mail abre com `Assunto:`, até 55 caracteres, diferente dos outros
- [ ] `{{link}}` no bloco **1 da parte de e-mail** e no bloco **2 da de WhatsApp**
- [ ] Cada escada na sua ordem: no WhatsApp o bloco 1 pergunta com quem falar e o 2 entrega; no e-mail o 1 já entrega

**A entrega** — bloco 1 do e-mail, bloco 2 do WhatsApp
- [ ] A primeira frase diz o nome, a empresa **e o que ela faz**
- [ ] Há uma observação específica do negócio, com nome próprio
- [ ] O ganho está dito em termos do negócio dele, não em termos técnicos
- [ ] Está claro que o link é uma página funcionando, não um desenho
- [ ] A gratuidade tem um motivo declarado
- [ ] Termina com **uma** pergunta de sim ou não
- [ ] É autossuficiente: não supõe que o bloco anterior foi lido nem respondido — nada de "segue a prévia" ou "conforme falamos"

**O primeiro toque de WhatsApp**
- [ ] Pergunta quem cuida do site e o e-mail dessa pessoa — sem link, sem oferta, sem citar o defeito
- [ ] Termina com **uma** pergunta, e o que ela pede é um nome ou um e-mail

**Todos os blocos**
- [ ] Cada um se identifica: quem fala e de que empresa
- [ ] Nenhum diz por onde a prévia foi ("que te mandei aqui") — o canal muda no meio
- [ ] Uma saudação por bloco, no começo
- [ ] Depois da entrega, cada bloco é mais curto que o anterior
- [ ] Nenhum jargão, nenhum "fico à disposição", no máximo uma crítica na sequência inteira

### 9. Revise como especialista — duas passadas obrigatórias

Protótipo nenhum vai para o usuário sem isto. O protocolo completo está em `references/revisao.md`.

**Passada 1 — inspetor de frontend.** Abre o arquivo no Chromium a 390px e 1280px, mede o DOM renderizado e aponta o elemento culpado de cada problema:

```bash
node .claude/skills/prototipo-site/scripts/revisar.mjs prototipos/<slug>/index.html
```

Pega desalinhamento de borda, container divergente, card com base irregular, foto esticada, estouro horizontal, contraste insuficiente, fonte pequena, texto vazando e erro de JavaScript. **Todo `ERRO` é corrigido antes de seguir**, e o script roda de novo até zerar.

**Passada 2 — designer de UI/UX.** Abra `revisao/mobile.png` e `revisao/desktop.png` e **olhe**. Descreva o que vê antes de julgar, percorra a rubrica de sete pontos de `references/revisao.md` e liste ao menos três melhorias concretas. Aplique e rode a passada 1 outra vez — mudança de layout costuma criar problema novo.

Depois disso, a checklist de verdade e conteúdo de `references/tecnico.md`. Ela não é formalidade: o item sobre fato inventado é o que impede o protótipo de queimar o lead.

### 10. Entregue

Informe:

- caminho do arquivo e como abrir (`file://` direto no navegador serve)
- a direção de design em uma frase
- **o que a revisão pegou e o que você mudou** — é o que dá ao usuário motivo para confiar sem reconferir
- o que ficou como placeholder e por quê
- tamanho do arquivo

## Regra absoluta: não invente fato sobre o negócio

O dono reconhece dado falso sobre a própria empresa no primeiro segundo. É o que queima o lead.

Mas a regra tem duas metades, e confundi-las custa caro nos dois sentidos:

### Pode usar — é afirmação do próprio negócio

Tudo que estiver no `relatorio.md` extraído do **site atual dele**: serviços, textos institucionais, tempo de mercado, prêmios, equipe, endereço, horário, formas de pagamento, redes sociais, logo e fotos.

Isso não é invenção — é conteúdo que o próprio negócio publicou. O protótipo é o site dele refeito, e reaproveitar o que ele já afirma é justamente o que o torna fiel.

Duas condições: **cite com fidelidade** (não arredonde "12 anos" para "mais de uma década", não transforme "atendemos convênios" em uma lista de convênios) e **não estenda** (se o site diz que faz clareamento, não acrescente lentes de contato dental).

Também pode: nota do Google e nº de avaliações, se vierem no brief, com o valor exato.

### Não pode inventar — não está em lugar nenhum

Quando **não há site**, ou o dado não aparece nele, nunca escreva: preço, valor, "a partir de", desconto ou condição de pagamento · tempo de mercado · quantidade de clientes, pacientes ou casos · prêmio, certificação ou título · nome de pessoa ou equipe · depoimento · horário de funcionamento · convênio aceito · promessa de resultado.

Não preencha com um número plausível. Não escreva "tradição de anos" para disfarçar que não sabe quantos.

O que faltar vai para **placeholders** — uma seção visível na página dizendo abertamente o que entra com o material do cliente. Parece contraintuitivo mostrar isso; é o contrário: explica por que faltam fotos e vira o gancho da conversa.

**Bloco mais curto é sempre melhor que bloco inventado.**

### A exceção que se sobrepõe às duas

Ramo regulamentado (advocacia, odontologia, medicina, fisioterapia, contabilidade): as restrições de `references/nichos.md` valem **mesmo sobre conteúdo copiado do site atual dele**. Se o site do dentista anuncia preço ou mostra antes-e-depois, o protótipo não reproduz — o site atual dele é que está irregular, e copiar o problema não ajuda ninguém. Registre em placeholders e siga.

## Iteração

Depois de ver no navegador, o usuário vai pedir ajuste. Edite o mesmo arquivo. Se pedir "outra direção", volte ao passo 4 com uma ideia estrutural **diferente** — não ajuste a mesma.

## Referências

| Arquivo | Quando ler |
|---|---|
| `references/design.md` | Antes de escolher a direção. **O que** a página vai ser: ideia estrutural, cor, tipografia, e o padrão proibido. |
| `references/nichos.md` | Sempre, a seção do ramo do lead. Público, objeções, cor e restrições de publicidade da profissão. |
| `references/composicao.md` | Antes do markup. **Como** construir: tokens, container único, grade, casting de imagem, armadilhas de alinhamento. |
| `references/tecnico.md` | Antes de construir e antes de entregar. Restrições do arquivo, ícones e checklist de conteúdo. |
| `references/abordagem.md` | No passo 8, antes de escrever a mensagem. Estrutura de venda, CTA e os erros que matam. |
| `references/revisao.md` | No passo 9. As duas passadas de especialista e a rubrica visual. |
