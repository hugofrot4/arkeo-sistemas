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

1. **Fotos do próprio negócio**, extraídas do site atual (`fonte/imagens/`). Sempre que existirem, ganham de tudo.
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

## Espaço e ritmo

Base de 8px, espaçamento generoso entre seções, largura de leitura em torno de 65ch. Aperto é o que faz a página parecer amadora.

Os valores concretos e o contrato que impede o desalinhamento estão em `composicao.md` — escreva os tokens antes da primeira seção, não depois.

## Movimento

Um efeito, no máximo dois. Sugerido: revelar ao rolar via `IntersectionObserver`, com `translateY(16px)` e `opacity`, 500ms.

Proibido: carrossel · contador animado · texto que digita sozinho · paralaxe · qualquer coisa que atrase a leitura.

Respeite `@media (prefers-reduced-motion: reduce)`.

---

## Mobile primeiro, de verdade

O dono do negócio vai abrir no celular, provavelmente por link de WhatsApp. Construa a versão de 380px primeiro e expanda.

- alvo de toque mínimo 44px
- o WhatsApp precisa estar alcançável sem rolar até o fim — botão fixo ou repetido
- nada de rolagem horizontal, nunca
- teste mentalmente em 360px, 390px e 430px

---

## Como usar a inspiração enviada

Empreste: paleta, ritmo de espaçamento, personalidade tipográfica, a divisão estrutural, um detalhe distintivo.

Nunca empreste: texto, nome, logo, foto, ou a impressão de que é a mesma marca.

Se a inspiração for de outro ramo, traduza. Uma landing page de SaaS aplicada a uma oficina mecânica funciona se você levar a estrutura e trocar o vocabulário visual — não se você levar o vocabulário junto.
