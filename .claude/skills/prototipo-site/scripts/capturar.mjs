/**
 * Print do site atual do lead, para você olhar.
 *
 * Este script **não julga o site**. Ele abre a página no Chromium, tira print
 * em celular e computador, e relata só o que é fato inequívoco — mais os
 * sinais de que a própria captura pode ter dado errado.
 *
 * Quem julga é você, olhando os prints.
 *
 * ## Por que não pontuar automaticamente
 *
 * A versão anterior media "sinais de época" e devolvia um índice de atraso com
 * frases prontas para a abordagem. Parecia objetivo e era pior: um número dá
 * autoridade a um palpite. Rodando no primeiro lead real, o script cravou
 * "27 mil pixels de altura no celular" — o que tanto pode ser o site quanto o
 * navegador headless falhando ao carregar a fonte de ícones do cliente.
 *
 * Mandar isso na abordagem é acusar o dono de um defeito que talvez não
 * exista. Ele conhece o próprio site melhor que qualquer script, e uma
 * afirmação falsa logo na primeira mensagem encerra a conversa.
 *
 * Então: print + fatos verificáveis + aviso quando a captura for duvidosa.
 * O resto é olho.
 *
 * Uso:
 *   node .claude/skills/prototipo-site/scripts/capturar.mjs <url> <slug>
 *
 * Escreve em prototipos/<slug>/atual/:
 *   mobile.png · desktop.png · relatorio.md
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

/**
 * Só medidas objetivas. Nada aqui vira frase de venda sozinho — serve para
 * você interpretar o print com contexto.
 */
const medir = () => {
  const doc = document.documentElement;

  let regrasCss = 0;
  let temMediaQuery = false;
  let folhasBloqueadas = 0;
  for (const folha of document.styleSheets) {
    try {
      for (const regra of folha.cssRules) {
        regrasCss++;
        if (regra.type === CSSRule.MEDIA_RULE) temMediaQuery = true;
      }
    } catch {
      folhasBloqueadas++; // outra origem: não dá para ler, mas carregou
    }
  }

  const imagens = [...document.querySelectorAll("img")];
  const imagensQuebradas = imagens.filter((i) => i.complete && i.naturalWidth === 0).length;

  return {
    alturaPagina: doc.scrollHeight,
    larguraConteudo: Math.round(document.body.getBoundingClientRect().width),
    estouroHorizontal: doc.scrollWidth - doc.clientWidth,
    temViewportMeta: !!document.querySelector('meta[name="viewport"]'),
    regrasCss,
    folhasBloqueadas,
    temMediaQuery,
    fonteBase: parseFloat(getComputedStyle(document.body).fontSize) || null,
    imagens: imagens.length,
    imagensQuebradas,
    // Se o CSS pede fonte web e nenhuma carregou, o print não representa o site.
    fontesCarregadas: document.fonts ? document.fonts.size : null,
    statusFontes: document.fonts ? document.fonts.status : null,
    titulo: (document.title || "").slice(0, 90),
  };
};

/**
 * Dispara o revelar-ao-rolar antes de fotografar.
 *
 * A página anima a entrada das seções: elas nascem em `opacity: 0` e só
 * aparecem quando o `IntersectionObserver` as alcança. Fotografar a página
 * inteira sem rolar por ela antes devolve um print com metade em branco — e o
 * relatório passa a acusar defeito onde há animação funcionando.
 *
 * Rola até o fim em passos, volta ao topo, e depois força a aparecer o que
 * ainda tiver ficado invisível: observer com margem estranha, script que
 * falhou, seção fora do caminho da rolagem. Sem depender de nome de classe,
 * que muda a cada protótipo.
 */
async function revelarTudo(pagina) {
  await pagina.evaluate(async () => {
    const passo = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 250));
    window.scrollTo(0, 0);

    for (const el of document.querySelectorAll("body *")) {
      const s = getComputedStyle(el);
      const visivel = el.getBoundingClientRect().width > 0;
      if (!visivel) continue;

      // Animação presa à rolagem (`animation-timeline: view()`) fica no meio do
      // caminho na foto de página inteira: o quadro capturado é o do progresso
      // naquela posição, então as seções de baixo saem esmaecidas e o relatório
      // acusa contraste e vazamento onde há animação funcionando. Desligar a
      // linha do tempo devolve o elemento ao estado final.
      if (s.animationTimeline && s.animationTimeline !== "auto") {
        el.style.setProperty("animation", "none", "important");
        el.style.setProperty("opacity", "1", "important");
        el.style.setProperty("transform", "none", "important");
        continue;
      }

      if (parseFloat(s.opacity) === 0) {
        el.style.setProperty("opacity", "1", "important");
        el.style.setProperty("transform", "none", "important");
      }
    }
    await new Promise((r) => setTimeout(r, 120));
  });
}

async function main() {
  const [url, slug] = process.argv.slice(2);
  if (!url || !slug) {
    console.error("Uso: node capturar.mjs <url> <slug>");
    process.exit(2);
  }
  const alvo = /^https?:\/\//.test(url) ? url : `https://${url}`;
  const destino = join("prototipos", slug, "atual");
  mkdirSync(destino, { recursive: true });

  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: MOBILE,
    // User-Agent de navegador comum de propósito: com identificação de robô,
    // CDN e plugin de cache servem versão degradada, e aí o print mostraria um
    // site que nenhum visitante vê.
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    locale: "pt-BR",
  });

  const falhas = [];
  const errosConsole = [];
  contexto.on("requestfailed", (r) => {
    falhas.push({
      url: r.url().slice(0, 110),
      tipo: r.resourceType(),
      erro: r.failure()?.errorText ?? "",
    });
  });

  const medidas = {};
  try {
    for (const [nome, viewport] of [["mobile", MOBILE], ["desktop", DESKTOP]]) {
      const pagina = await contexto.newPage();
      pagina.on("pageerror", (e) => errosConsole.push(String(e).slice(0, 120)));
      await pagina.setViewportSize(viewport);
      await pagina.goto(alvo, { waitUntil: "networkidle", timeout: 45000 });
      await pagina.evaluate(() => document.fonts?.ready).catch(() => {});
      await pagina.waitForTimeout(600);
      await revelarTudo(pagina).catch(() => {});
      await pagina.screenshot({ path: join(destino, `${nome}.png`), fullPage: true });
      medidas[nome] = await pagina.evaluate(medir);
      await pagina.close();
    }
  } catch (erro) {
    console.error(`ERRO ao abrir ${alvo}: ${erro.message.slice(0, 150)}`);
    console.error("Se o site realmente não abre, isso já é o argumento — mas confirme");
    console.error("no seu próprio navegador antes de dizer isso ao dono.");
    await navegador.close();
    process.exit(1);
  }
  await navegador.close();

  // ── a captura é confiável? ───────────────────────────────────────────
  const m = medidas.mobile;
  const ressalvas = [];

  // Conteúdo misto é defeito do site, não da captura: a página é servida em
  // HTTPS mas pede o próprio CSS em HTTP, e TODO navegador bloqueia. Acontece
  // com qualquer visitante, então é fato citável — e explica por que o print
  // saiu sem estilo, o que de outra forma pareceria falha nossa.
  const mistas = falhas.filter((f) => /mixed-content/i.test(f.erro));
  const falhasReais = falhas.filter((f) => !/mixed-content/i.test(f.erro));

  const falhasCss = falhasReais.filter((f) => f.tipo === "stylesheet").length;
  const falhasFonte = falhasReais.filter((f) => f.tipo === "font").length;
  const falhasImagem = falhasReais.filter((f) => f.tipo === "image").length;

  if (falhasCss > 0) {
    ressalvas.push(`${falhasCss} folha(s) de estilo não carregaram — o print pode estar sem parte do visual real.`);
  }
  if (falhasFonte > 0) {
    ressalvas.push(`${falhasFonte} fonte(s) não carregaram. Fonte de ícone que falha vira glifo gigante ou quadrado, e isso é defeito da captura, não do site.`);
  }
  if (falhasImagem > 2) {
    ressalvas.push(`${falhasImagem} imagens não carregaram.`);
  }
  if (m.imagensQuebradas > 2) {
    ressalvas.push(`${m.imagensQuebradas} imagens ficaram quebradas na página.`);
  }
  if (m.regrasCss === 0 && m.folhasBloqueadas === 0) {
    ressalvas.push("Nenhuma regra de CSS foi lida. Ou o site é sem estilo mesmo, ou o CSS não chegou.");
  }
  if (m.alturaPagina > 15000 && mistas.length === 0) {
    ressalvas.push(`A página ficou com ${m.alturaPagina}px de altura no celular. Pode ser o site empilhando tudo, mas também é o sintoma clássico de fonte de ícone que não carregou. Confira no print antes de concluir.`);
  }
  if (errosConsole.length > 0) {
    ressalvas.push(`${errosConsole.length} erro(s) de JavaScript na página — parte do conteúdo pode não ter aparecido.`);
  }

  // ── relatório ────────────────────────────────────────────────────────
  const linhas = [
    `# Site atual — ${alvo}`, "",
    "Prints em `atual/mobile.png` e `atual/desktop.png`.", "",
    "**Este relatório não julga o site.** Ele traz os fatos que dá para afirmar",
    "com segurança e avisa quando a própria captura é duvidosa. A avaliação é",
    "sua, olhando os prints.", "",
  ];

  if (ressalvas.length) {
    linhas.push(
      "## ⚠ A captura pode não representar o site", "",
      "Leia isto **antes** de concluir qualquer coisa a partir dos prints:", "",
      ...ressalvas.map((r) => `- ${r}`), "",
      "Nada do que estiver nesta lista pode virar afirmação na abordagem sem você",
      "confirmar abrindo o site no seu próprio navegador. O dono conhece o site",
      "dele — uma acusação falsa na primeira mensagem encerra a conversa.", "",
    );
  } else {
    linhas.push("## Captura", "", "Tudo carregou: os prints representam o site.", "");
  }

  linhas.push("## Fatos verificáveis", "",
    "Estes não dependem de interpretação e são seguros de citar:", "");

  const fato = (condicao, texto) => { if (condicao) linhas.push(`- ${texto}`); };

  if (mistas.length) {
    const css = mistas.filter((f) => f.tipo === "stylesheet").length;
    const js = mistas.filter((f) => f.tipo === "script").length;
    linhas.push(
      `- **O site bloqueia o próprio visual.** A página é servida em HTTPS mas ` +
      `chama ${css} folha(s) de estilo e ${js} script(s) por HTTP. Todo navegador ` +
      `recusa esse conteúdo misto, então o site abre desmontado **para qualquer ` +
      `visitante** — não é problema da nossa captura. É o print de \`mobile.png\`.`,
    );
  }

  fato(!m.temViewportMeta,
    "**A página não declara viewport.** No celular ela abre a versão de computador reduzida — o visitante precisa dar zoom. É o fato mais fácil de o dono confirmar sozinho.");
  fato(m.temViewportMeta && !m.temMediaQuery && m.regrasCss > 0,
    `**O CSS não tem nenhuma regra que mude o layout por tamanho de tela** (${m.regrasCss} regras lidas). O site foi desenhado para uma largura só.`);
  fato(m.estouroHorizontal > 2,
    `**No celular a página rola para o lado** (${m.estouroHorizontal}px além da tela). Confirme no print — é visível.`);
  fato(Math.abs(m.larguraConteudo - medidas.desktop.larguraConteudo) < 20 && m.larguraConteudo > 500,
    `**Largura fixa:** o conteúdo mede ${medidas.desktop.larguraConteudo}px tanto em tela de 1280px quanto de 390px. A página não se reorganiza.`);
  fato(m.fonteBase && m.fonteBase < 14,
    `**Texto do corpo em ${Math.round(m.fonteBase)}px**, abaixo do confortável para leitura no celular.`);
  fato(m.imagens === 0,
    "**A página não tem nenhuma imagem de conteúdo.**");

  if (!linhas.some((l) => l.startsWith("- **"))) {
    linhas.push("- Nenhum fato técnico inequívoco. O que houver de crítica sai do print, não daqui.", "");
  }
  linhas.push("");

  linhas.push(
    "## O que olhar nos prints", "",
    "Abra os dois e responda para si mesmo:", "",
    "1. **Em 3 segundos dá para saber o que o negócio faz e onde fica?**",
    "2. **O que salta como datado?** Botão com relevo, degradê, fonte padrão do sistema, ícone pixelado, foto esticada, cor sem paleta.",
    "3. **Onde está o contato?** Precisa rolar muito para achar telefone ou WhatsApp?",
    "4. **No celular está usável** ou é a versão de computador espremida?",
    "5. **O que ali está bom?** Se a marca é boa ou o conteúdo é forte, aproveite no protótipo em vez de descartar — e diga isso na abordagem.",
    "",
    "A resposta 5 importa tanto quanto as outras. Abordagem que só lista defeito",
    "soa como ataque; abordagem que reconhece o que já funciona e mostra o que",
    "dá para melhorar abre conversa.", "",
  );

  linhas.push("## Medidas", "",
    `| | celular | computador |`,
    `|---|---|---|`,
    `| altura da página | ${m.alturaPagina}px | ${medidas.desktop.alturaPagina}px |`,
    `| largura do conteúdo | ${m.larguraConteudo}px | ${medidas.desktop.larguraConteudo}px |`,
    `| regras de CSS lidas | ${m.regrasCss} | — |`,
    `| regra de tela no CSS | ${m.temMediaQuery ? "sim" : "não"} | — |`,
    `| meta viewport | ${m.temViewportMeta ? "sim" : "não"} | — |`,
    `| imagens | ${m.imagens} (${m.imagensQuebradas} quebradas) | — |`,
    `| recursos bloqueados por conteúdo misto | ${mistas.length} | — |`,
    `| outros recursos que falharam | ${falhasReais.length} | — |`,
    "");

  writeFileSync(join(destino, "relatorio.md"), linhas.join("\n"));

  console.log(`\nPrints em ${destino}/mobile.png e desktop.png`);
  if (mistas.length) {
    console.log(`\n${mistas.length} recurso(s) bloqueados por conteúdo misto (HTTPS pedindo HTTP).`);
    console.log("Isso é defeito do site e atinge todo visitante — fato citável, não ressalva.");
  }
  if (ressalvas.length) {
    console.log(`\n⚠ ${ressalvas.length} ressalva(s) sobre a captura — leia o relatório antes de concluir algo:`);
    for (const r of ressalvas) console.log(`   • ${r.slice(0, 108)}`);
  } else {
    console.log("Captura limpa: os prints representam o site.");
  }
  console.log(`\nRelatório: ${join(destino, "relatorio.md")}`);
  console.log("Abra os prints e olhe — o julgamento é seu, não do script.");
}

main();
