# Restrições técnicas e checklist

## O arquivo

Um único `prototipos/<slug>/index.html`. Tudo dentro: CSS em `<style>`, JS em `<script>`, SVG inline.

O sistema serve esse HTML dentro de um **iframe isolado** em `arkeosistemas.com.br/p/<slug>`. As consequências práticas estão abaixo — não são preferências, são o que funciona ou não no destino final.

### Permitido

- **Google Fonts** — único host externo que carrega. `<link>` para `fonts.googleapis.com` funciona normalmente.
- **SVG inline** e `data:` URI para ícones ou texturas pequenas.
- **JS baunilha** — `IntersectionObserver`, `querySelector`, listeners. Roda normalmente.
- `target="_blank"` em links — abre certo.

### Proibido

- **Qualquer outro host externo** — sem CDN, sem Tailwind por CDN, sem Font Awesome, sem imagem de Unsplash. Não carrega e a página quebra.
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
- [ ] Logo e fotos vieram de `fonte/imagens/` — nada de banco de imagens

### Design

- [ ] A direção declarada no passo 3 está visível no resultado
- [ ] Não caiu no padrão proibido de `design.md`
- [ ] Duas fontes, com contraste real de tamanho entre display e corpo
- [ ] `--surface` não é `#FFFFFF`
- [ ] Contraste do corpo ≥ 4.5:1; botões e texto grande ≥ 3:1
- [ ] Nenhuma foto de banco de imagens

### Funcionamento

- [ ] Abre em 380px sem rolagem horizontal
- [ ] Botão de WhatsApp alcançável sem rolar até o fim
- [ ] Alvos de toque ≥ 44px
- [ ] Todo link tem `href` real — nenhum `href="#"` sem destino
- [ ] Nenhum host externo além de `fonts.googleapis.com` / `fonts.gstatic.com`
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
