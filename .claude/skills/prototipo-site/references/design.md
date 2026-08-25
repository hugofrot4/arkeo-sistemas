# Doutrina de design

O protótipo compete com o site que o negócio já tem — e com a impressão de que "site de agência é tudo igual". A diferença aparece em três decisões: uma ideia estrutural, um par tipográfico com personalidade, e cor escolhida em vez de herdada.

Aqui está **o que** decidir. **Como** construir sem erro de layout — tokens, container, grade, casting de imagem — está em `composicao.md`.

---

## O padrão proibido

Este é o layout que sai sozinho quando ninguém decide nada. **Não entregue isto:**

- hero centrado, título em duas linhas, subtítulo cinza, um botão azul no meio
- logo em cima à esquerda, menu à direita, tudo com 1200px e centralizado
- três cards em linha, cada um com um ícone redondo, título curto e duas linhas de texto
- seção "sobre nós" com texto à esquerda e um bloco cinza à direita onde ia uma foto
- faixa escura de rodapé com três colunas
- azul `#3B82F6` ou similar como cor de destaque
- Inter (ou Poppins, ou Montserrat) em tudo, um peso só

Se o seu rascunho tem quatro ou mais desses itens, pare e recomece a direção.

---

## Escolha UMA ideia estrutural

Uma só, e leve até o fim. Misturar duas é o que produz o site genérico.

| Ideia | Como se manifesta | Combina com |
|---|---|---|
| **Split assimétrico** | Divisão 60/40 ou 70/30 que se repete; um bloco de cor sangrando até a borda | serviço profissional, saúde |
| **Editorial** | Título enorme quebrado em linhas controladas, seções numeradas em display grande, muita margem | advocacia, arquitetura, beleza |
| **Faixas alternadas** | Blocos full-bleed de cor sólida alternando com fundo claro; texto em negativo nas faixas | alimentação, serviço local |
| **Dossiê** | Layout tipo ficha técnica: rótulo pequeno em maiúscula, valor grande, linhas divisórias finas | contabilidade, seguros, imobiliária |
| **Coluna fixa** | Navegação ou identidade fixa numa lateral, conteúdo rolando ao lado (desktop); empilha no mobile | portfólio visual, estúdio |
| **Motivo repetido** | Uma forma geométrica (arco, diagonal, círculo cortado) que reaparece como assinatura em cada seção | beleza, food, academia |

Se a inspiração enviada apontar outra coisa, siga a inspiração.

---

## Tipografia é o diferenciador mais barato

Uma escolha de fonte muda mais a percepção do que qualquer outra coisa que você faça em 20 minutos.

**Sempre um par:** uma fonte para display (títulos), outra para corpo. Nunca a mesma nas duas.

Pares que funcionam, todos no Google Fonts:

| Clima | Display | Corpo |
|---|---|---|
| Editorial com carne | `Fraunces` | `Inter Tight` |
| Sóbrio e confiável | `Instrument Serif` | `Geist` |
| Moderno geométrico | `Space Grotesk` | `IBM Plex Sans` |
| Impacto, urgência | `Archivo Black` | `Archivo` |
| Calmo, clínico | `DM Serif Display` | `DM Sans` |
| Apetite, artesanal | `Bricolage Grotesque` | `Source Sans 3` |
| Elegância contida | `Cormorant Garamond` | `Jost` |
| Técnico, preciso | `Chivo` | `IBM Plex Sans` |
| Humano, acolhedor | `Newsreader` | `Figtree` |
| Contemporâneo neutro | `General Sans` | `Supreme` |
| Editorial condensado | `Bebas Neue` | `Public Sans` |
| Suave, cuidado | `Gantari` | `Sora` |
| Clássico revisitado | `Playfair Display` | `Karla` |
| Direto, sem ornamento | `Manrope` | `Manrope` (pesos 800 e 400) |
| Institucional moderno | `Outfit` | `Lora` |

**Nenhum destes é o par padrão.** Se você usou um recentemente, use outro — ver *Não repita o protótipo anterior*, abaixo.

**Escala:** contraste forte entre display e corpo. Título de herói entre `clamp(2.5rem, 7vw, 5rem)`; corpo em `1.0625rem` com `line-height: 1.65`. Meio-termo tímido é o que faz a página parecer template.

**Detalhes que somam:** `text-wrap: balance` em títulos · `letter-spacing` negativo (-0.02em) em display grande · maiúsculas com `letter-spacing: 0.16em` em rótulos pequenos · nunca centralize um parágrafo com mais de duas linhas.

---

## Cor

Quatro papéis, definidos como variáveis CSS no `:root`:

```css
--primary   /* fundo das faixas de destaque; texto branco por cima */
--accent    /* botões e links; contrasta com branco E com surface */
--surface   /* fundo das seções claras, quase branco mas não branco */
--ink       /* texto principal sobre surface, bem escuro */
```

**De onde vem, nesta ordem:**

1. **Da logo do cliente, sempre que houver logo.** O extrator já devolve a paleta pronta em `fonte/relatorio.md`, na seção *Paleta da marca* — cores encontradas na logo e os quatro papéis derivados delas, com o acento já escurecido até passar no contraste.
2. Da referência visual que o usuário enviou — mas só a estrutura e o clima. **A cor continua vindo da logo.**
3. Da direção do ramo em `nichos.md`, quando não houver nem logo nem referência.

A ordem não é negociável. O protótipo precisa parecer o site *daquele negócio*, e a logo é o único elemento de identidade que temos. Um site azul-marinho para uma marca laranja não parece dele — parece um template com o nome trocado, que é exatamente a impressão que o protótipo existe para evitar.

Se a paleta da logo brigar com a referência, a referência cede. Se a cor da marca for difícil (amarelo, rosa-claro), escureça para o texto e mantenha a cor original em blocos e detalhes — não troque o matiz.

**Contraste, sem exceção:** corpo sobre fundo ≥ 4.5:1. Texto grande e botões ≥ 3:1. Cinza claro sobre branco é o erro mais comum e o mais visível no celular sob sol.

**`--surface` nunca é `#FFFFFF`.** Um off-white com um grão da cor primária (`#FAF8F5`, `#F4FAFA`, `#F7F6F2`) já tira a página do lugar de template.

---

## Imagens

A ordem de preferência é sempre esta:

1. **Fotos do próprio negócio** — do site atual (`extrair.py`) ou do Instagram (`instagram.py`). Sempre que existirem, ganham de tudo: são o espaço dele, o trabalho dele.
2. **Imagens de apoio em domínio público**, quando não houver nenhuma foto própria.
3. **Nenhuma imagem**, quando a única disponível for ruim.

### Imagens de apoio

Site sem imagem nenhuma parece pobre, e isso derruba o argumento do protótipo. Mas foto de banco que finge ser o negócio é pior: "nossa equipe" com gente que não trabalha lá é o que denuncia template na hora, e em clínica chega a ser problema de publicidade.

O que separa um caso do outro não é a origem da foto — é **o que ela afirma**.

```bash
python3 .claude/skills/prototipo-site/scripts/imagens.py <slug> <template> 3
```

Busca no Openverse filtrando `cc0,pdm`: domínio público, uso comercial livre, **sem exigir crédito** na página. O filtro não é opcional — o mesmo acervo indexa CC-BY, que obrigaria a creditar o fotógrafo no site do cliente.

**Pode:** textura e material · detalhe de instrumento ou ferramenta · ingrediente, xícara, mesa posta · fundo abstrato · elemento de contexto sem rosto identificável.

**Não pode**, porque afirma algo falso sobre o negócio:

- "nossa equipe", "nossa clínica", "nosso espaço" com foto de outro lugar
- fachada de outro prédio apresentada como a dele
- pessoa sorrindo dando a entender que é o profissional
- antes e depois (e em saúde isso é vedado de qualquer forma)
- qualquer legenda que transforme a foto ilustrativa em afirmação

**Regra prática:** se a foto puder ser lida como "este é o lugar / esta é a equipe", ela não entra — ou entra sem legenda, tratada como fundo, com sobreposição de cor e sem destaque.

**Toda imagem de banco usada entra na seção de placeholders**, declarada como ilustrativa: *"fotos ilustrativas — no site definitivo entram fotos do seu espaço"*. Isso é o que mantém o protótipo honesto e, de quebra, é gancho de conversa: o cliente quer ver o lugar dele ali.

Duas fotos boas valem mais que seis medianas. E página sem imagem é melhor que página com imagem ruim — foto escura, tremida ou de baixa resolução tira credibilidade em vez de somar.

### Quando não houver imagem alguma

A restrição é produtiva. O que preenche o espaço:

- **Tipografia como imagem** — um título ocupando meia tela é um elemento visual
- **Blocos de cor sólida** sangrando até a borda
- **Gradiente com intenção** — `radial-gradient` suave atrás do herói, não o degradê roxo padrão
- **Formas em CSS** — `border-radius` extremos, `clip-path`, arcos, diagonais
- **Padrões** — `repeating-linear-gradient` para listras finas, pontos, grade sutil
- **Números grandes** — a nota do Google, quando existir no brief, vira elemento gráfico
- **Grão** — filtro SVG de ruído em baixa opacidade tira o aspecto "chapado" de fundo sólido

## O que é convenção e o que é autoral

Duas coisas diferentes se misturam quando se fala em "todo site do ramo parece igual", e tratar as duas do mesmo jeito estraga o protótipo por um lado ou por outro.

**A estrutura de conversão é convenção. Respeite.**

Ela é igual entre concorrentes porque funciona: quem procura dentista com dor quer saber, nessa ordem, se atendem o caso dele, onde fica e como marcar. Inverter isso para parecer original faz o visitante sair.

Não invente em cima de:

- quais perguntas a página responde, e em que ordem de urgência
- proeminência e repetição do contato — em serviço de urgência, telefone na primeira tela
- o vocabulário e o tom do ramo
- o que o cliente final precisa saber antes de decidir

**A expressão visual é autoral. Não repita.**

A mesma estrutura de conversão cabe em páginas completamente diferentes. É aqui que o protótipo deixa de parecer template:

- par tipográfico
- tratamento da cor dentro da marca — clara e arejada, ou escura e densa
- ideia estrutural e composição
- ritmo, densidade e respiro
- o detalhe distintivo

Em uma frase: **duas clínicas devem responder às mesmas perguntas, na mesma ordem, e ainda assim parecer sites de empresas diferentes.**

Se uma escolha de design atrapalha a leitura ou esconde o contato, ela perdeu — originalidade não vale um contato a menos. Diferenciação é como você diz, não o que você deixa de dizer.

## Não repita o protótipo anterior

Protótipos do mesmo ramo tendem a convergir na aparência, não só na estrutura — e aí viraram template. O dono do negócio pode muito bem conhecer o concorrente que também recebeu um.

**Antes de fixar a direção, olhe o que já foi feito:**

```bash
for f in prototipos/*/index.html; do
  echo "--- $(basename $(dirname $f))"
  grep -oE "family=[A-Za-z+]+" "$f" | sed 's/family=/  fonte: /' | sort -u | head -3
  grep -oE "\-\-(primary|accent): *#[0-9a-fA-F]{6}" "$f" | head -2 | sed 's/^/  /'
  grep -oE "<h2[^>]*>[^<]{0,40}" "$f" | sed 's/<h2[^>]*>/  h2: /' | head -6
done
```

Do resultado, escolha deliberadamente **diferente** dos dois ou três mais recentes do mesmo ramo, em pelo menos duas destas frentes — todas de expressão, nenhuma de conversão:

- **par tipográfico** — a lista acima tem quinze; não gravite para o mesmo
- **ideia estrutural** — se o último foi split assimétrico, faça faixas ou dossiê
- **ordem e escolha das seções** — o cardápio de `nichos.md` não é um roteiro, desde que a ordem continue servindo à decisão de quem lê
- **temperatura da paleta** — se os últimos foram frios, e a logo permitir, vá para neutro quente ou escuro com acento

A cor da logo não é negociável, mas tudo em volta dela é: a mesma marca azul rende um site claro e arejado ou um escuro e denso, e são páginas completamente diferentes.

## Espaço e ritmo

Base de 8px, espaçamento generoso entre seções, largura de leitura em torno de 65ch. Aperto é o que faz a página parecer amadora.

Os valores concretos e o contrato que impede o desalinhamento estão em `composicao.md` — escreva os tokens antes da primeira seção, não depois.

## Vidro

Superfície translúcida que desfoca o que passa por trás. É o efeito que mais barato dá ar de site caro — e o que mais rápido vira retângulo cinza ilegível quando feito pela metade.

**Só existe se houver algo atrás que valha desfocar.** Vidro sobre branco chapado não é vidro, é um cinza. Antes de aplicar, garanta a camada de baixo: foto, gradiente de malha, manchas de cor desfocadas, textura.

A receita mínima tem quatro camadas e nenhuma é dispensável:

```css
.vidro {
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid color-mix(in srgb, #fff 45%, transparent);
  box-shadow:
    0 8px 32px rgb(0 0 0 / 0.12),
    inset 0 1px 0 rgb(255 255 255 / 0.35);
}
```

O `saturate` é o que separa vidro de fumaça: sem ele a cor de trás morre e sobra névoa. A borda clara e o `inset` do topo são a luz batendo na quina — é o que o olho lê como "vidro" em vez de "sobreposição".

**O contraste manda, e ele se mede no pior caso.** Não contra a média do que está atrás: contra o ponto mais claro que pode passar por ali quando a página rola. Se o texto cair abaixo de 4.5:1 nesse ponto, suba a opacidade do vidro até passar. Vidro ilegível é defeito, não estilo — e `scripts/revisar.mjs` **não pega**, porque lê a cor declarada e não o que o desfoque produz. Esta conferência é sua, olhando o print.

| Cabe | Não cabe |
|---|---|
| cabeçalho fixo, com conteúdo rolando por baixo | bloco de texto corrido — leitura longa pede fundo opaco |
| CTA flutuante do WhatsApp | sobre foto ocupada, de contraste alto |
| cards sobre o hero com foto | a página inteira |
| faixa de números sobre imagem | formulário ou qualquer coisa com campo |

**Duas ou três superfícies de vidro na página.** A partir daí vira estética de tela de celular e cansa — e o custo aparece: `backdrop-filter` recompõe o que está atrás a cada quadro. Nunca num elemento que também anima posição, nunca cobrindo área grande no celular.

```css
@supports not (backdrop-filter: blur(4px)) {
  .vidro { background: var(--surface); }
}
```

**A camada de baixo em `position: fixed` fotografa uma vez só.** No navegador ela fica parada atrás do conteúdo, que é o efeito desejado; no print de página inteira ela aparece no topo e o resto sai chapado. Não conserte o que não está quebrado — mas se quiser que o fundo acompanhe a página toda, use uma camada `position: absolute` com a altura do documento em vez de `fixed`.

Em fundo escuro o vidro escurece em vez de clarear, e a borda cai para `rgb(255 255 255 / 0.14)` — borda branca forte sobre escuro parece contorno, não luz.

---

## Movimento

Animação não é enfeite: é o que diz que alguém cuidou da página. Site parado parece template comprado. Mas movimento que atrasa a leitura custa a venda, e são quatro segundos.

A regra que separa os dois: **anima o que entra, nunca o que a pessoa está lendo.**

**Use dois ou três destes.** Menos que isso a página fica inerte; mais e ela disputa atenção consigo mesma.

1. **Revelar ao rolar.** Prefira `animation-timeline: view()`, que é CSS puro e não deixa a página em branco se algo falhar — receita em *Repertório técnico*. Pela via do `IntersectionObserver`, use `translateY(20px)` + `opacity`, 500ms, `cubic-bezier(.2,.7,.3,1)`, e **escalone 60ms por item** na grade: é esse detalhe que faz parecer coreografado em vez de disparado.
2. **Fundo que respira.** Gradiente de malha ou manchas desfocadas atrás do hero, deslocando-se em 20 a 40 segundos, em laço. Só `transform` e `opacity`. É o que dá vida ao vidro que está por cima.
3. **Cabeçalho que condensa.** Passados uns 80px de rolagem, encolhe a altura, ganha vidro e sombra. Transição de 200ms.
4. **Elevação no hover.** O card sobe de 2 a 4px e a sombra abre, em 150ms. No toque não existe — então nunca esconda informação atrás disso.
5. **Micro-interação no CTA.** Um brilho que atravessa, a seta que avança, escala de 1.02. **Uma** coisa, não três.
6. **Números que sobem.** Só sobre número verificado — nota do Google, contagem de avaliações. O valor final fica escrito no HTML e o script anima a partir dele: se o JS não rodar, o número certo está lá.
7. **Paralaxe contido.** Só na camada de fundo do hero, por `translate3d`, amplitude até 40px, desligado no celular. Nunca em texto.

**Proibido, e o motivo**

- **Carrossel** — esconde conteúdo atrás de um clique que ninguém dá.
- **Texto que digita sozinho** — atrasa justamente a frase que precisa ser lida em quatro segundos.
- **Animação em texto de corpo** — dificulta a leitura, e não há segunda chance.
- **Qualquer coisa que mova o layout depois da primeira pintura** — o dedo já está a caminho do botão.

**Duas salvaguardas, sempre.**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

E **nada pode deixar a página em branco quando o movimento não roda.** É o defeito mais caro do fluxo: o cliente abre o link e vê o nada. Dois caminhos, escolha um:

- `animation-timeline: view()` **dentro de `@supports`** — sem suporte, a regra inteira não se aplica e o elemento aparece. É o caminho preferido, porque não depende de JavaScript nenhum.
- Pelo `IntersectionObserver`, o `opacity: 0` tem de estar preso a uma classe que o script acrescenta: `document.documentElement.classList.add('js')` na primeira linha, e a regra escrita como `.js .rev { opacity: 0 }`.

Nunca `opacity: 0` solto no CSS. Página sem animação é aceitável; página em branco não.

---

## Mobile primeiro, de verdade

O dono do negócio vai abrir no celular, provavelmente por link de WhatsApp. Construa a versão de 380px primeiro e expanda.

- alvo de toque mínimo 44px
- o WhatsApp precisa estar alcançável sem rolar até o fim — botão fixo ou repetido
- nada de rolagem horizontal, nunca
- teste mentalmente em 360px, 390px e 430px

---

## Repertório técnico

Tudo aqui é CSS ou JS baunilha, roda no arquivo único e foi conferido no Chromium que gera os prints. Nenhum item é obrigatório — **escolha três ou quatro por página**, diferentes dos do protótipo anterior. É daqui que vem a variação entre um lead e outro.

### Revelar sem JavaScript

Substitui o `IntersectionObserver` e elimina o risco mais caro do fluxo: página que abre em branco porque o script falhou.

```css
@supports (animation-timeline: view()) {
  .rev {
    animation: sobe linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 28%;
  }
  @keyframes sobe { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
}
```

Dentro do `@supports`, então sem suporte o elemento simplesmente aparece. Para escalonar a grade, varie o `animation-range` item a item em vez de usar `delay` — a linha do tempo é a rolagem, não o relógio.

### Texto que quebra bem

Duas linhas de CSS, e é a diferença mais barata entre página cuidada e página gerada.

```css
h1, h2, h3 { text-wrap: balance; }   /* distribui as linhas do título */
p, li      { text-wrap: pretty; }    /* evita a palavra órfã no fim */
```

`balance` só age até umas seis linhas, que é exatamente o caso de título.

### Gradiente que se move

O "gradiente cinético" de 2026. Variável de CSS não interpola sozinha — `@property` a tipa e aí ela anima.

```css
@property --g { syntax: '<percentage>'; inherits: false; initial-value: 0% }
.faixa {
  background: linear-gradient(100deg, var(--a), var(--b) var(--g), var(--a));
  animation: desliza 14s linear infinite;
}
@keyframes desliza { to { --g: 100% } }
```

Devagar — 12 a 20 segundos. Rápido vira letreiro de loja.

### Bento

Grade de blocos de tamanhos diferentes, cada um com uma informação. Aguentou o ano onde a tipografia cinética não aguentou, porque resolve um problema real: dá hierarquia sem exigir que o visitante leia na ordem.

```css
.bento { display: grid; gap: 16px; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 120px }
.bento > :nth-child(1) { grid-column: span 2; grid-row: span 2 }
```

No celular vira uma coluna. Serve para serviços, diferenciais, unidades — **não** para texto corrido.

### O bloco que se adapta ao espaço, não à tela

```css
.caixa { container-type: inline-size }
@container (min-width: 480px) { .dentro { grid-template-columns: 120px 1fr } }
```

O mesmo card fica empilhado na coluna estreita e lado a lado na larga, sem `@media` e sem duplicar marcação.

### Layout que reage ao conteúdo

```css
.card:has(img)      { grid-column: span 2 }   /* card com foto ocupa o dobro */
.grade:has(:only-child) { grid-template-columns: 1fr }
```

Útil quando o número de fotos varia por lead — a página se acomoda em vez de abrir buraco.

### Grão

Tira o aspecto plástico do gradiente puro. SVG embutido, sem arquivo.

```css
.grao { position: relative; overflow: hidden }
.grao::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .3;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence baseFrequency='.8'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>");
}
```

Opacidade entre 0.15 e 0.35. Acima disso suja o texto.

### Borda que desaparece

`mask-image` para dissolver a beirada de uma foto ou de uma faixa no fundo, em vez de cortá-la com uma linha dura.

```css
.foto { mask-image: linear-gradient(to bottom, #000 70%, transparent) }
```

### Modo escuro

Aguentou o ano. Só vale se a paleta for pensada nos dois — escuro mal feito é pior que claro bem feito.

```css
:root { color-scheme: light dark }
body { background: light-dark(#f7f5f2, #0f1216); color: light-dark(#14181d, #e8eaed) }
```

No escuro, o vidro **escurece** e a borda cai para `rgb(255 255 255 / 0.14)`.

### O que não usar

- **3D e WebGL** — drenam o orçamento de desempenho e, aqui, nem carregam: biblioteca externa é proibida.
- **Tipografia cinética** — título que se deforma com o cursor rende demonstração e não venda. Se o hero precisa de movimento, use o gradiente.
- **View Transitions e anchor positioning** — resolvem navegação entre páginas e posicionamento de popover. O protótipo é uma página só, sem nenhum dos dois.

---

## Vocabulário visual atual

O que faz uma página parecer de agora, e não de 2016. Nenhum item é obrigatório — a lista existe para você escolher com intenção em vez de cair no padrão, e para ter de onde partir quando não vier referência nenhuma.

**Fundo**
- Gradiente de malha: três ou quatro manchas de cor em `radial-gradient`, muito desfocadas, sobre a cor de base. É o que dá o que desfocar para o vidro.
- Grade ou pontos sutis em `background-image` com `linear-gradient`, opacidade abaixo de 0.06.
- Ruído leve por `data:` URI de SVG — tira o aspecto plástico de gradiente puro.
- Vinheta: `radial-gradient` escurecendo as bordas, para o conteúdo central respirar.

**Superfície**
- Vidro, conforme a seção acima.
- Borda de gradiente: `border: 1px solid transparent` com `background-clip: padding-box, border-box` e dois planos de fundo.
- Cantos generosos — 16 a 24px em card, 999px em pílula. Canto de 4px envelheceu.
- Sombra em duas camadas: uma curta e densa para o contato, uma longa e difusa para a altura. Sombra única de `0 2px 4px` é a assinatura do template.

**Tipografia**
- Título grande de verdade: `clamp(2.5rem, 6vw, 4.5rem)`, peso 600 ou 700, `letter-spacing: -0.03em`. Título grande sem apertar o espaçamento parece esticado.
- Kicker: rótulo curto, caixa alta, 12px, `letter-spacing: 0.12em`, na cor de acento.
- Peso variável do Google Fonts quando a família tiver — a transição de peso no hover é barata e elegante.

**Cor**
- Acento único e usado com parcimônia: CTA, kicker, um detalhe. Três acentos é nenhum.
- Texto de gradiente **só em uma palavra ou uma linha**, nunca num parágrafo.
- `color-mix(in srgb, ...)` para derivar tons do acento em vez de escolher hexadecimais soltos que não conversam.

**O que datou**
Sombra dura de 4px sem desfoque · gradiente de dois tons em diagonal ocupando a tela inteira · ícone dentro de círculo colorido em cada card · seção de "números" com quatro caixas iguais · foto de banco de imagens com pessoas sorrindo de terno.

---

## Como usar a inspiração enviada

Empreste: paleta, ritmo de espaçamento, personalidade tipográfica, a divisão estrutural, um detalhe distintivo.

Nunca empreste: texto, nome, logo, foto, ou a impressão de que é a mesma marca.

Se a inspiração for de outro ramo, traduza. Uma landing page de SaaS aplicada a uma oficina mecânica funciona se você levar a estrutura e trocar o vocabulário visual — não se você levar o vocabulário junto.
