# Revisão: as duas passadas de especialista

Nenhum protótipo vai para o usuário sem passar por aqui. São duas passadas com olhares diferentes, e a ordem importa: primeiro o que é mensurável, depois o que é julgamento.

Ler o próprio código não pega erro de layout. Desalinhamento, card irregular, foto esticada e estouro horizontal só existem depois que o navegador aplica o CSS — por isso a revisão abre o arquivo de verdade e **olha**.

---

## Passada 1 — Inspetor de frontend

```bash
node .claude/skills/prototipo-site/scripts/revisar.mjs prototipos/<slug>/index.html
```

Abre o arquivo no Chromium a 390px e 1280px, mede o DOM renderizado e escreve em `prototipos/<slug>/revisao/`: `mobile.png`, `desktop.png` e `relatorio.json`.

O que ele mede, com o seletor do elemento culpado e a diferença em pixels:

| Categoria | O que pega |
|---|---|
| Alinhamento | seção que começa fora da régua da página · larguras de container divergentes |
| Grade | itens lado a lado com bases que não fecham |
| Imagem | proporção esticada · ampliação além do arquivo · falta de espaço reservado |
| Responsivo | estouro horizontal e qual elemento o causou |
| Tipografia | fonte abaixo de 14px · entrelinha apertada · linha longa demais |
| Contraste | par de cores abaixo de 4.5:1 (ou 3:1 em texto grande) |
| Toque | alvo com menos de 44px de altura no mobile |
| Conteúdo | texto vazando de caixa com altura fixa |
| Console | erro de JavaScript na página |

**Todo `ERRO` é corrigido antes de seguir.** Não há "depois eu vejo": o inspetor aponta o seletor e o número, então o conserto é direto.

`aviso` é julgamento — corrija salvo motivo claro, e diga qual foi o motivo.

Rode de novo depois de corrigir. Repita até zerar os erros.

---

## Passada 2 — Designer de UI/UX

Agora **abra os dois prints e olhe**. Não é opcional e não dá para substituir por leitura de CSS.

### Antes de julgar, descreva

Escreva em 4 linhas o que você **vê** em `mobile.png`, de cima para baixo, como se descrevesse para alguém que não está olhando. Descrever antes de avaliar é o que impede aprovar por inércia o que você mesmo acabou de escrever.

### Rubrica

Percorra as sete, uma a uma:

**1. Primeira dobra.** Em 3 segundos dá para saber o que o negócio faz e onde fica? O título nomeia o problema do cliente ou a especialidade da empresa? O CTA está visível sem rolar?

**2. Hierarquia.** Em cada tela, uma coisa é claramente a mais importante? Ou dois elementos disputam? Os saltos de tamanho entre título, subtítulo e corpo são óbvios ou tímidos?

**3. Ritmo.** As distâncias entre seções são iguais? Alguma seção está espremida ou solta demais? A página respira ou está apertada?

**4. Imagens.** Cada foto está no papel certo para a proporção dela? Alguma está cortada num ponto ruim — rosto pela metade, produto fora do quadro, texto cortado? Alguma foi usada só para preencher espaço? A logo tem respiro?

**5. Cor.** A paleta parece escolhida para este negócio ou é a padrão? Quantas cores competem? O acento aparece pouco o bastante para significar "clique aqui"?

**6. Tipografia.** Dá para dizer que são duas fontes com personalidades diferentes? O título tem presença suficiente? Alguma linha ficou órfã ou com quebra feia?

**7. O teste do dono.** Ele abre isso no celular e pensa "melhor do que o meu"? Ou pensa "template"? Seja honesto — esta é a única pergunta que importa.

### O resultado

Liste **pelo menos três** melhorias concretas, cada uma com o elemento e a mudança. Se não conseguir listar três, você não olhou com atenção suficiente — volte aos prints.

Depois aplique as que valem a pena e rode a passada 1 de novo, porque mudança de layout costuma criar problema novo.

---

## Quando parar

Pare quando:

- o inspetor devolver **zero erros** nas duas larguras
- os avisos restantes forem decisões conscientes que você consegue justificar
- a rubrica visual não produzir mais nada além de preferência pessoal

Aí sim entregue, informando ao usuário o que a revisão pegou e o que você mudou — é o que dá a ele motivo para confiar no arquivo sem reconferir tudo.

---

## Se o inspetor não rodar

Ele depende do Playwright, instalado dentro da pasta de scripts da skill:

```bash
cd .claude/skills/prototipo-site/scripts && npm install
```

Os navegadores já ficam no cache do sistema, então isso baixa só o pacote.

Sem o inspetor, a passada 1 vira leitura de CSS contra `composicao.md` — muito pior, mas melhor que nada. Nesse caso avise o usuário que a conferência de layout foi parcial.
