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
- **a paleta** — as cores do CSS são a identidade dele, não a sua preferência
- **os serviços reais** — a estrutura de títulos diz o que o negócio de fato oferece
- **os contatos** — telefone e redes publicados por ele

O relatório informa quantos KB cada imagem custa em `data:` URI. O arquivo final fica abaixo de 400 KB, então escolha: **a logo sempre entra**; duas ou três fotos boas valem mais que oito medianas.

Se o script falhar, é lead de site quebrado — siga sem material e trate a falta de imagem como em `references/design.md`.

### 3. Leia as referências visuais

Para cada imagem enviada, extraia e anote:

- **Paleta** — nomeie os hexadecimais que você vê, não "azul e branco".
- **Tipografia** — a personalidade (grotesca, serifada editorial, condensada, geométrica) e o contraste de tamanho entre título e corpo.
- **Estrutura** — como o espaço é dividido. Simétrico ou assimétrico? Onde respira? Onde adensa?
- **Um movimento distintivo** — a coisa específica que faz aquela peça não parecer genérica.

Você empresta **estrutura, ritmo e clima**. Nunca copia conteúdo, marca, foto ou texto da referência.

### 4. Declare a direção antes de escrever código

Escreva 5 linhas, mostre ao usuário e siga em frente — não espere aprovação:

```
Ideia estrutural: <a ÚNICA ideia que organiza a página>
Paleta:           <4 hexadecimais com o papel de cada um>
Tipografia:       <par de fontes do Google Fonts + por quê>
Movimento:        <o detalhe que diferencia>
Risco:            <o que pode não funcionar>
```

Este passo existe para impedir o padrão automático. Se a direção couber em "hero centrado, três cards com ícone, rodapé escuro", **descarte e escolha outra**.

### 5. Faça o casting das imagens e fixe as medidas

Duas decisões que, tomadas antes do markup, evitam a maior parte do retrabalho.

**Casting.** O `fonte/relatorio.md` traz um elenco com formato, proporção, tipo e papel sugerido de cada arquivo. **Abra as imagens e olhe** — o script sabe a proporção, não sabe o que está retratado. Para cada uma que for usar, anote:

```
<arquivo>  →  <papel na página>  |  proporção <x:y>  |  não cortar: <o quê>
```

Proporção errada é o que produz foto esticada e corte no meio do rosto. A tabela de qual formato serve para qual papel está em `references/composicao.md`.

**Medidas.** Escreva o `:root` com a escala de espaço, o container e o ritmo vertical **antes** da primeira seção. Depois disso, nenhum valor solto no CSS. É o que impede as bordas de cada seção começarem num lugar diferente.

### 6. Construa

Um arquivo: `prototipos/<slug>/index.html`.

`<slug>` é o nome do negócio em minúsculas, sem acento, com hífen. Ex.: `clinica-sorriso-vivo`.

Ícone é sempre de biblioteca — **Material Symbols pelo Google Fonts**, com os nomes validados. Nada de `<path>` desenhado à mão, fora marca de rede social. O porquê e o como estão em `references/tecnico.md`.

Contrato de layout — container único, grade que fecha a base, imagem com proporção reservada — em `references/composicao.md`. Restrições do arquivo em `references/tecnico.md`. O que cada ramo precisa em `references/nichos.md` — **leia a seção do ramo do lead antes de escrever a primeira linha de copy**.

### 7. Escreva a abordagem

`prototipos/<slug>/abordagem.txt` — quatro mensagens de WhatsApp separadas por uma linha com `---`, nesta ordem:

1. Entrega o protótipo sem pedir nada. Cita um fato verificável do negócio. Sem "espero que esteja bem". **Não inclua o link** — o sistema anexa.
2. Retoma um achado concreto da auditoria.
3. Oferece uma conversa de 10 minutos.
4. Encerra educadamente e avisa que o protótipo sai do ar.

Primeira pessoa do singular, como quem escreve na hora. Cada uma mais curta que a anterior.

### 8. Revise como especialista — duas passadas obrigatórias

Protótipo nenhum vai para o usuário sem isto. O protocolo completo está em `references/revisao.md`.

**Passada 1 — inspetor de frontend.** Abre o arquivo no Chromium a 390px e 1280px, mede o DOM renderizado e aponta o elemento culpado de cada problema:

```bash
node .claude/skills/prototipo-site/scripts/revisar.mjs prototipos/<slug>/index.html
```

Pega desalinhamento de borda, container divergente, card com base irregular, foto esticada, estouro horizontal, contraste insuficiente, fonte pequena, texto vazando e erro de JavaScript. **Todo `ERRO` é corrigido antes de seguir**, e o script roda de novo até zerar.

**Passada 2 — designer de UI/UX.** Abra `revisao/mobile.png` e `revisao/desktop.png` e **olhe**. Descreva o que vê antes de julgar, percorra a rubrica de sete pontos de `references/revisao.md` e liste ao menos três melhorias concretas. Aplique e rode a passada 1 outra vez — mudança de layout costuma criar problema novo.

Depois disso, a checklist de verdade e conteúdo de `references/tecnico.md`. Ela não é formalidade: o item sobre fato inventado é o que impede o protótipo de queimar o lead.

### 9. Entregue

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
| `references/revisao.md` | No passo 8. As duas passadas de especialista e a rubrica visual. |
