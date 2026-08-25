# Restrições técnicas e checklist

## O arquivo

Um único `prototipos/<slug>/index.html`. Tudo dentro: CSS em `<style>`, JS em `<script>`, SVG inline.

O sistema serve esse HTML dentro de um **iframe isolado** em `arkeosistemas.com.br/p/<slug>`. As consequências práticas estão abaixo — não são preferências, são o que funciona ou não no destino final.

### Permitido

- **Google Fonts** — único host externo que carrega. `<link>` para `fonts.googleapis.com` funciona normalmente.
- **Material Symbols** — a biblioteca de ícones do Google, servida por `fonts.googleapis.com`. É a forma padrão de colocar ícone no protótipo. Ver **Ícones** abaixo.
- **SVG inline** e `data:` URI para texturas pequenas e marcas de rede social.
- **JS baunilha** — `IntersectionObserver`, `querySelector`, listeners. Roda normalmente.
- **CSS moderno** — `backdrop-filter` (com o prefixo `-webkit-`), `color-mix()`, `clamp()`, `@supports`, `@media (prefers-reduced-motion)`, animações e transições. Tudo nativo, nada a carregar.
- `target="_blank"` em links — abre certo.

### Proibido

- **Qualquer outro host externo** — sem CDN, sem Tailwind por CDN, sem Font Awesome, sem Lucide, sem Iconify, sem imagem de Unsplash. Não carrega e a página quebra.
- **Ícone desenhado à mão em SVG** quando existe equivalente no Material Symbols. Ver **Ícones**.
- **`opacity: 0` de partida escrito direto no CSS** — se o script não rodar, a seção nunca aparece e a página fica em branco. Prenda o estado escondido a uma classe que o JS acrescenta. Ver `design.md`, seção *Movimento*.
- **`localStorage` e `sessionStorage`** — o iframe roda em origem opaca e o acesso **lança exceção**. Se usar, envolva em `try/catch` — ou melhor, não use.
- **`<form>` que submete** — o envio é bloqueado. O CTA é sempre um link `wa.me`.
- **Framework** — sem React, sem Vue, sem build. É um arquivo estático.
- **Barra da Arkeo** — não escreva. O sistema adiciona por fora do iframe, para que o HTML seja só o site do cliente.

### Cabeçalho obrigatório

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><!-- Nome do negócio — o que ele faz, no bairro --></title>
  <meta name="description" content="<!-- até 160 caracteres -->">
```

### Tamanho

Abaixo de **400 KB**. O sistema recusa acima de 800 KB. Se estiver passando, o culpado é quase sempre um `data:` URI grande — troque por CSS.

---

## Ícones

**Use biblioteca, não desenhe.** Ícone traçado à mão em `<path>` sai com peso de traço, canto e grade óptica diferentes do resto e é o que denuncia protótipo montado às pressas. A biblioteca resolve consistência de graça.

A única biblioteca que carrega dentro do iframe é o **Material Symbols**, servido pelo Google Fonts. Peça só os ícones que for usar, por `icon_names`:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=call,place,schedule,arrow_outward,dentistry&display=block">
```

```css
.ms{font-family:'Material Symbols Rounded';font-weight:normal;font-style:normal;
    line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;
    white-space:nowrap;direction:ltr;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}
```

```html
<span class="ms" aria-hidden="true">call</span>
```

Variantes: `Material+Symbols+Rounded`, `+Outlined` ou `+Sharp`. Escolha uma e não misture — o arredondamento tem que combinar com o raio de canto do layout.

### Valide os nomes antes de entregar

Duas armadilhas silenciosas:

1. **Nome inexistente** não dá erro — o Google devolve a **fonte inteira, de 1,2 MB**, e a ligadura não renderiza: a página mostra a palavra crua (`call`) no lugar do desenho.
2. **`icon_names` fora de ordem alfabética** faz a requisição voltar como página de erro HTML, e aí *nenhum* ícone carrega. Ordene a lista.

Subset correto pesa 2 a 7 KB. Confira:

```bash
u=$(curl -s "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=call,place,dentistry" | grep -o 'https://fonts.gstatic.com[^)]*')
curl -s "$u" | wc -c   # milhares = ok · ~1200000 = nome errado · 0 = lista fora de ordem
```

Use `&display=block` no `<link>`: enquanto a fonte carrega, o texto da ligadura fica invisível em vez de piscar a palavra na tela.

### A exceção: marca de rede social

WhatsApp, Instagram e Facebook não existem no Material Symbols, e não há host permitido que os sirva. Esses ficam em **SVG inline**, com o `viewBox` e o traçado oficiais da marca. É a única exceção — para tudo mais, biblioteca.

---

## Contato

O número do WhatsApp vem no brief. Use exatamente ele, no formato internacional só com dígitos:

```html
<a href="https://wa.me/5585987654321?text=Ol%C3%A1%21%20Vi%20o%20site%20e%20queria%20saber%20mais">
```

Se o brief disser que **não há WhatsApp válido** (só telefone fixo, ou sem telefone), use `tel:` com o número que houver — e se não houver nenhum, o CTA vira uma âncora para a seção de contato, com o endereço. Nunca invente um número.

---

## Seção de placeholders

Obrigatória, perto do fim, antes do rodapé. Diz abertamente o que entra com o material do cliente:

> **Entra com o seu material** — Este é um protótipo montado a partir de informações públicas do seu negócio. No site definitivo, estes pontos entram com o conteúdo real: fotos do consultório · convênios atendidos · horário de atendimento

Parece contraintuitivo mostrar isso ao cliente. É o contrário: deixa claro o que é protótipo, explica por que faltam fotos, e é o gancho natural da conversa.

---

## Checklist antes de entregar

Rode item por item. O primeiro bloco é o que queima o lead se falhar.

### Verdade

Para **cada** afirmação sobre o negócio na página, uma de duas coisas tem que ser verdade: ou está no `fonte/relatorio.md` extraído do site atual dele, ou está no brief. Não havendo nenhuma das duas, sai da página e vai para placeholders.

- [ ] Todo preço, tempo de mercado, quantidade, prêmio, nome de pessoa, depoimento, horário ou convênio na página veio do site atual dele — e está citado com fidelidade, sem arredondar nem estender
- [ ] Nenhuma promessa de resultado, mesmo que o site atual dele faça
- [ ] Nota do Google e nº de avaliações: só do brief, com o valor exato
- [ ] Nenhum `lorem ipsum` e nenhum "Texto de exemplo"
- [ ] Ramo regulamentado: as restrições de `nichos.md` foram respeitadas **inclusive sobre o que foi copiado do site atual**
- [ ] Nenhuma foto de banco dá a entender que é o espaço, a equipe ou a fachada do negócio
- [ ] Toda imagem de banco usada está declarada nos placeholders como ilustrativa

### Design

- [ ] A direção declarada no passo 3 está visível no resultado
- [ ] Não caiu no padrão proibido de `design.md`
- [ ] Duas fontes, com contraste real de tamanho entre display e corpo
- [ ] `--surface` não é `#FFFFFF`
- [ ] Havendo logo, a paleta veio dela — não da referência nem do padrão do ramo
- [ ] Contraste do corpo ≥ 4.5:1; botões e texto grande ≥ 3:1
- [ ] Nenhuma foto de banco de imagens
- [ ] Há **2 ou 3 superfícies de vidro**, cada uma com fundo que valha desfocar por trás
- [ ] O texto sobre vidro passa em 4.5:1 **contra o ponto mais claro** que rola por trás — conferido no print, não no código
- [ ] Existe `@supports not (backdrop-filter: ...)` com fundo opaco de reserva
- [ ] Há **2 ou 3 efeitos de movimento**, nomeados no passo 4, nenhum deles em texto de corpo
- [ ] O revelar ao rolar escalona os itens da grade, em vez de disparar todos juntos
- [ ] `@media (prefers-reduced-motion: reduce)` está no arquivo
- [ ] Com o JS desligado a página aparece inteira — o estado escondido depende de classe posta por script

### Funcionamento

- [ ] Abre em 380px sem rolagem horizontal
- [ ] Botão de WhatsApp alcançável sem rolar até o fim
- [ ] Alvos de toque ≥ 44px
- [ ] Todo link tem `href` real — nenhum `href="#"` sem destino
- [ ] Nenhum host externo além de `fonts.googleapis.com` / `fonts.gstatic.com`
- [ ] Ícones vindos do Material Symbols, com os nomes validados pelo `curl` — nada de `<path>` desenhado à mão, exceto marca de rede social
- [ ] Nenhum `localStorage`, `sessionStorage` ou `<form>` que submete
- [ ] `<title>` e `<meta description>` preenchidos com o negócio real
- [ ] `@media (prefers-reduced-motion: reduce)` respeitado
- [ ] Arquivo abaixo de 400 KB

### Entrega

- [ ] `prototipos/<slug>/index.html` existe
- [ ] `prototipos/<slug>/abordagem.txt` com as 4 mensagens separadas por `---`
- [ ] Mensagem 1 não contém o link (o sistema anexa)

---

## Visualizar

```
xdg-open prototipos/<slug>/index.html
```

Ou abra o caminho `file://` direto no navegador. Não precisa de servidor — é um arquivo só.

Para conferir o mobile: DevTools → modo dispositivo → 390px.
