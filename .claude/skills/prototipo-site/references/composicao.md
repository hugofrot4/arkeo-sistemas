# Composição: o contrato antes do markup

`design.md` decide **o que** a página vai ser. Este arquivo é **como** construir sem os erros que denunciam trabalho apressado: bordas que não batem, cards de alturas diferentes, foto esticada, bloco que estoura no celular.

Quase todo desalinhamento tem a mesma origem: cada seção inventou a própria medida. A solução não é ajustar depois — é fixar as medidas **antes** de escrever a primeira seção.

---

## 1. Escreva os tokens primeiro

Antes de qualquer markup, o `:root`. Depois disso, nenhum valor solto no CSS.

```css
:root{
  /* Escala de espaço. Só estes valores existem. */
  --s1: .25rem;  --s2: .5rem;   --s3: .75rem;  --s4: 1rem;
  --s5: 1.5rem;  --s6: 2rem;    --s7: 3rem;    --s8: 4rem;
  --s9: 6rem;    --s10: 8rem;

  /* Container: UMA largura para a página inteira. */
  --container: 1140px;
  --gutter: clamp(1.25rem, 5vw, 2rem);

  /* Ritmo vertical das seções. */
  --secao-y: clamp(3.5rem, 9vw, 7rem);

  --raio: 14px;
  --borda: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
```

Se um espaçamento não estiver na escala, ele está errado. `padding: 18px` é o começo do desalinhamento — 18 não conversa com nada.

---

## 2. Um container, uma classe, sem exceção

**Este é o item que mais evita retrabalho.**

```css
.wrap{
  width: 100%;
  max-width: var(--container);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
```

Toda seção segue exatamente esta forma:

```html
<section class="secao">
  <div class="wrap">…</div>
</section>
```

```css
.secao{ padding-block: var(--secao-y); }
```

**Seção que sangra até a borda não é exceção à regra.** O fundo sangra; o conteúdo continua no `.wrap`:

```html
<section class="secao secao--cor">   <!-- fundo full-bleed -->
  <div class="wrap">…</div>          <!-- conteúdo na mesma régua -->
</section>
```

Nunca crie um segundo `.wrap-estreito` de 820px "só para o texto". Se um bloco precisa ser mais estreito, limite o **elemento de texto**, não o container:

```css
.secao p{ max-width: 62ch; }   /* certo: a régua esquerda não muda */
```

O inspetor mede exatamente isso: se as seções começam em posições diferentes, ele nomeia qual está fora e por quantos pixels.

---

## 3. Grades e cards que fecham a base

Alturas diferentes lado a lado é o segundo erro mais visível.

```css
.grade{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: var(--s5);
  align-items: stretch;      /* padrão do grid — nunca troque para start */
}

.card{
  display: flex;
  flex-direction: column;    /* o conteúdo empilha… */
  gap: var(--s3);
  padding: var(--s5);
  border-radius: var(--raio);
}

.card__rodape{ margin-top: auto; }   /* …e o rodapé desce até a base */
```

Três regras que resolvem a categoria inteira:

- **`gap`, nunca `margin`** entre itens de flex/grid. Margem colapsa e cria assimetria.
- **`align-items: start` só quando você quer alturas diferentes.** Em card, quase nunca.
- **`minmax(min(100%, 260px), 1fr)`** — o `min(100%, …)` é o que impede o estouro horizontal quando a tela é mais estreita que o mínimo.

---

## 4. Toda imagem com proporção reservada

Foto esticada e layout que salta vêm da mesma omissão.

```css
.midia{
  aspect-ratio: 3 / 2;       /* a proporção decidida no casting */
  overflow: hidden;
  border-radius: var(--raio);
}
.midia img{
  width: 100%;
  height: 100%;
  object-fit: cover;         /* corta, nunca distorce */
  display: block;            /* remove o vão fantasma abaixo da img */
}
```

`object-fit: cover` é obrigatório sempre que a proporção do container não bate com a do arquivo. Sem ele o navegador estica, e imagem esticada é o defeito que o dono do negócio percebe primeiro — é a foto *dele*.

Sempre `width` e `height` no `<img>`, mesmo com CSS por cima: é o que reserva o espaço antes de carregar.

---

## 5. Casting: onde cada imagem vai

O `fonte/relatorio.md` traz um elenco com formato, proporção, tipo e papel sugerido de cada arquivo. **Abra as imagens e olhe** antes de decidir — o script sabe a proporção, não sabe o que está retratado.

Para cada imagem, decida três coisas e anote: **qual papel**, **em que proporção entra**, **o que não pode ser cortado**.

| Formato do arquivo | Onde funciona | Onde quebra |
|---|---|---|
| **faixa** (≥2.5:1) | fundo de herói, faixa de largura total, divisor entre seções | grade, card quadrado — corta demais e perde o assunto |
| **paisagem** (1.4–2.5:1) | herói, capa de seção, card largo, lado do split | coluna estreita |
| **quadrada** (0.85–1.4:1) | grade de serviços, miniatura, avatar | fundo de largura total — amplia demais |
| **retrato** (0.5–0.85:1) | coluna lateral, card alto, destaque vertical | grade horizontal — desequilibra a linha |
| **gráfico / logo** | cabeçalho, rodapé, selo | ampliação em tela cheia — pixeliza e fica chapado |
| **fundo transparente** | sobre faixa de cor, sobre foto | sobre fundo da mesma cor da marca — some |

Regras de corte:

- **Rosto, produto e fachada ficam no centro vertical.** Se o assunto está no terço superior, use `object-position: top`.
- **Foto de ambiente aguenta corte agressivo**; foto com texto embutido, não — não corte banner que tem palavra dentro.
- **A logo nunca é cortada.** `object-fit: contain`, com respiro em volta.

Quando **não** usar imagem:

- se a única foto disponível é ruim (escura, tremida, baixa resolução), a página fica melhor sem ela — tipografia grande no lugar
- se a imagem tem preço, promoção ou texto de campanha antiga embutido
- se for foto de banco de imagens genérico: nunca

Uma foto boa usada com intenção vale mais que quatro espalhadas para preencher.

---

## 6. Hierarquia: uma coisa por tela

Em cada dobra, uma única coisa deve ser claramente a mais importante. Se dois elementos disputam, o olho não escolhe nenhum.

- **um** H1 na página, e ele nomeia o problema do cliente
- **um** CTA primário por seção; os demais são secundários e visualmente menores
- salto de tamanho entre níveis grande o bastante para ser óbvio — H2 no mínimo 1.6× o corpo
- rótulo em maiúscula pequena serve para ancorar seção, nunca para competir com o título

---

## 7. Alinhamento fino

O que o inspetor não pega, mas o olho pega:

- **Texto abaixo de um título alinha na mesma borda esquerda do título.** Não centralize um e alinhe o outro à esquerda.
- **Ícone com texto:** `display:flex; align-items:center; gap:var(--s2)`. Nunca ajuste com `margin-top` no ícone.
- **Números e preços em coluna:** `font-variant-numeric: tabular-nums`, senão as casas dançam.
- **Botões lado a lado** têm a mesma altura, mesmo com textos de tamanhos diferentes — `align-items: stretch` no container.
- **Bloco centralizado só se tudo dentro estiver centralizado.** Meio-termo lê como erro.
- **A última linha de um parágrafo não deve ficar sozinha** — `text-wrap: pretty` nos parágrafos, `text-wrap: balance` nos títulos.

---

## 8. Mobile: construa a de 390px primeiro

Não é slogan. Escreva o CSS de coluna única e depois adicione `@media (min-width: 768px)`. O caminho inverso é o que produz estouro horizontal.

Armadilhas de estouro, em ordem de frequência:

1. largura fixa em px maior que a tela (`width: 900px`)
2. `grid-template-columns: repeat(3, 1fr)` sem `auto-fit`/`minmax`
3. palavra longa sem quebra — use `overflow-wrap: anywhere` em URLs e e-mails
4. `100vw` num elemento dentro de container com padding (`100vw` ignora a barra de rolagem)
5. imagem sem `max-width: 100%`

Defesa de base, no topo do CSS:

```css
*,*::before,*::after{ box-sizing: border-box; }
img,svg,video{ max-width: 100%; height: auto; }
body{ overflow-x: clip; }   /* rede de segurança, não substituto do conserto */
```
