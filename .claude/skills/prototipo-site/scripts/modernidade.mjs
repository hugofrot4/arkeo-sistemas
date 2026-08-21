/**
 * Análise de modernização do site atual do lead.
 *
 * "Seu site parece antigo" é o argumento mais fraco que existe enquanto for
 * opinião, e o mais forte quando vem com prova. Este script abre o site de
 * verdade no Chromium, tira print em duas larguras e mede sinais objetivos de
 * época — cada achado sai escrito como frase que dá para dizer ao dono.
 *
 * A auditoria do servidor já checa o que é técnico (HTTPS, viewport, título,
 * medição). Aqui é a outra metade: layout fixo, tipografia miúda, biblioteca
 * de 2011, marcação da era das tabelas. Um site pode passar em tudo que é
 * técnico e ainda parecer 2012.
 *
 * Uso:
 *   node .claude/skills/prototipo-site/scripts/modernidade.mjs <url> <slug>
 *
 * Escreve em prototipos/<slug>/atual/:
 *   mobile.png · desktop.png · relatorio.md
 *
 * **Olhe os prints.** A medição pega o que é contável; o que parece velho aos
 * olhos só se vê olhando — e é disso que sai a melhor frase da abordagem.
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

/** Cada achado vale pontos de "atraso". 100 = o site inteiro pede reforma. */
const auditoria = () => {
  const achados = [];
  const anota = (peso, codigo, frase, evidencia) =>
    achados.push({ peso, codigo, frase, evidencia });

  const doc = document.documentElement;
  const corpo = document.body;

  // ── marcação de outra época ──────────────────────────────────────────
  const depreciadas = ["center", "font", "marquee", "frameset", "big", "strike"];
  const usadas = depreciadas.filter((t) => document.getElementsByTagName(t).length > 0);
  if (usadas.length) {
    anota(12, "tags_depreciadas",
      "O site usa marcação que os navegadores mantêm só por compatibilidade — é sinal de que a página foi feita há muito tempo e não foi refeita desde então.",
      `Tags encontradas: <${usadas.join(">, <")}>`);
  }

  // Tabela usada para diagramar (não para dados) é a assinatura dos anos 2000.
  const tabelasLayout = [...document.querySelectorAll("table")].filter((t) => {
    if (t.querySelector("th") || t.getAttribute("role") === "table") return false;
    return t.getBoundingClientRect().width > doc.clientWidth * 0.5;
  });
  if (tabelasLayout.length) {
    anota(16, "layout_tabela",
      "A estrutura da página é montada com tabelas, técnica abandonada há mais de quinze anos. É o que impede o site de se adaptar ao celular.",
      `${tabelasLayout.length} tabela(s) ocupando a largura do conteúdo`);
  }

  const semantica = ["header", "nav", "main", "section", "article", "footer"]
    .filter((t) => document.getElementsByTagName(t).length > 0);
  if (semantica.length === 0) {
    anota(8, "sem_semantica",
      "A página não usa nenhuma marcação semântica, o que dificulta a leitura pelo Google e por leitores de tela.",
      "Nenhum header, nav, main, section, article ou footer");
  }

  // ── bibliotecas e CSS de época ───────────────────────────────────────
  const jq = window.jQuery?.fn?.jquery;
  if (jq) {
    const maior = parseInt(jq.split(".")[0], 10);
    if (maior <= 2) {
      anota(10, "jquery_antigo",
        `O site depende do jQuery ${jq}, uma biblioteca cuja última versão dessa linha é de mais de uma década atrás.`,
        `jQuery ${jq}`);
    }
  }

  const folhas = [...document.styleSheets];
  let regras = 0;
  let temMedia = false;
  let cssIE = false;
  for (const folha of folhas) {
    let lista;
    try {
      lista = folha.cssRules;
    } catch {
      continue; // folha de outra origem
    }
    for (const regra of lista) {
      regras++;
      if (regra.type === CSSRule.MEDIA_RULE) temMedia = true;
      const texto = regra.cssText || "";
      if (/progid:DXImageTransform|-ms-filter|\bzoom:\s*1\b/.test(texto)) cssIE = true;
    }
  }
  if (cssIE) {
    anota(10, "css_ie",
      "O CSS ainda carrega remendos escritos para versões antigas do Internet Explorer, navegador descontinuado.",
      "Filtros progid / -ms-filter / zoom:1");
  }

  // ── responsividade ───────────────────────────────────────────────────
  if (!document.querySelector('meta[name="viewport"]')) {
    anota(20, "sem_viewport",
      "A página não avisa ao celular que deve se adaptar. O telefone abre a versão de computador reduzida, e o visitante precisa dar zoom para ler.",
      "Falta a meta viewport");
  }
  if (!temMedia && regras > 0) {
    anota(18, "sem_media_query",
      "O CSS não tem nenhuma regra que mude o layout conforme o tamanho da tela — o site foi desenhado para uma largura só.",
      `${regras} regras de CSS, nenhuma condicional de tela`);
  }

  // Página absurdamente longa no celular quase sempre é layout desmontado:
  // fonte de ícone que não carregou e virou glifo gigante, imagem sem
  // limite de largura, coluna que virou pilha. É defeito visível de longe.
  if (window.innerWidth <= 500 && doc.scrollHeight > 15000) {
    anota(14, "pagina_desmontada",
      `No celular a página fica com ${Math.round(doc.scrollHeight / 1000)} mil pixels de altura — o layout não se reorganiza, ele simplesmente empilha tudo, e o visitante precisa rolar sem parar para chegar ao contato.`,
      `${doc.scrollHeight}px de altura em tela de ${window.innerWidth}px`);
  }

  const estouro = doc.scrollWidth - doc.clientWidth;
  if (estouro > 2) {
    anota(16, "rola_lado",
      "No celular a página rola para o lado, então parte do conteúdo fica fora da tela.",
      `${estouro}px além da largura da tela`);
  }

  // ── tipografia ───────────────────────────────────────────────────────
  const estiloCorpo = getComputedStyle(corpo);
  const base = parseFloat(estiloCorpo.fontSize);
  if (base && base < 15) {
    anota(10, "fonte_miuda",
      `O texto do site está em ${Math.round(base)} pixels. O padrão hoje é 16 ou mais, e abaixo disso a leitura no celular cansa.`,
      `font-size do corpo: ${base}px`);
  }

  const familias = new Set();
  for (const el of [...document.querySelectorAll("body, p, h1, h2, h3, a, li")].slice(0, 120)) {
    const f = getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim();
    if (f) familias.add(f.toLowerCase());
  }
  const sistema = ["arial", "helvetica", "times", "times new roman", "verdana",
    "tahoma", "georgia", "courier", "courier new", "sans-serif", "serif"];
  const soSistema = [...familias].every((f) => sistema.includes(f));
  if (soSistema && familias.size > 0) {
    anota(9, "sem_fonte_propria",
      "O site usa apenas as fontes padrão do sistema, sem nenhuma tipografia escolhida. É o que dá aparência de documento em vez de marca.",
      `Fontes em uso: ${[...familias].join(", ")}`);
  }

  const alturaLinha = parseFloat(estiloCorpo.lineHeight);
  if (alturaLinha && base && alturaLinha / base < 1.35) {
    anota(5, "entrelinha_apertada",
      "As linhas de texto são coladas umas nas outras, o que deixa a leitura pesada.",
      `line-height ${(alturaLinha / base).toFixed(2)}`);
  }

  // ── densidade e respiro ──────────────────────────────────────────────
  const blocos = [...document.querySelectorAll("body > *, main > *, #content > *")]
    .filter((el) => el.getBoundingClientRect().height > 40);
  if (blocos.length >= 3) {
    const respiros = blocos.map((el) => {
      const s = getComputedStyle(el);
      return parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
    });
    const medio = respiros.reduce((a, b) => a + b, 0) / respiros.length;
    if (medio < 24) {
      anota(7, "sem_respiro",
        "As seções ficam coladas umas nas outras, sem espaço entre elas. Página apertada passa sensação de amadorismo mesmo quando o conteúdo é bom.",
        `Espaçamento médio entre blocos: ${Math.round(medio)}px`);
    }
  }

  // ── imagens ──────────────────────────────────────────────────────────
  const imagens = [...document.querySelectorAll("img")].filter((i) => {
    const r = i.getBoundingClientRect();
    return r.width > 30 && r.height > 30;
  });
  const pesadas = imagens.filter((i) => i.naturalWidth > i.getBoundingClientRect().width * 2.5);
  if (pesadas.length) {
    anota(6, "imagem_pesada",
      "As imagens são enviadas em tamanho muito maior do que aparecem na tela, o que deixa o site lento no celular.",
      `${pesadas.length} imagem(ns) com o dobro ou mais da resolução necessária`);
  }
  if (imagens.length === 0) {
    anota(8, "sem_imagem",
      "A página não tem nenhuma imagem, o que deixa o site com cara de texto corrido.",
      "Nenhuma imagem de conteúdo");
  }

  // ── cor ──────────────────────────────────────────────────────────────
  const cores = new Set();
  for (const el of [...document.querySelectorAll("body *")].slice(0, 400)) {
    const s = getComputedStyle(el);
    if (s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)") cores.add(s.backgroundColor);
  }
  if (cores.size > 12) {
    anota(6, "cores_demais",
      "O site usa muitas cores de fundo diferentes, sem uma paleta definida. Isso tira a unidade visual e faz a página parecer montada aos pedaços.",
      `${cores.size} cores de fundo distintas`);
  }

  return {
    achados,
    medidas: {
      alturaPagina: doc.scrollHeight,
      larguraConteudo: Math.round(corpo.getBoundingClientRect().width),
      estouroHorizontal: estouro,
      regrasCss: regras,
      temMediaQuery: temMedia,
      fonteBase: base,
      imagens: imagens.length,
    },
  };
};

async function main() {
  const [url, slug] = process.argv.slice(2);
  if (!url || !slug) {
    console.error("Uso: node modernidade.mjs <url> <slug>");
    process.exit(2);
  }
  const alvo = /^https?:\/\//.test(url) ? url : `https://${url}`;
  const destino = join("prototipos", slug, "atual");
  mkdirSync(destino, { recursive: true });

  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: MOBILE,
    // User-Agent de navegador comum, de propósito: a análise precisa ver o que
    // um visitante real vê. Com UA de robô, CDN e plugin de cache servem versão
    // degradada — e aí o relatório acusaria o cliente de um defeito que é do
    // nosso próprio acesso.
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    locale: "pt-BR",
  });
  const relatorio = { url: alvo, larguras: {} };

  try {
    for (const [nome, viewport] of [["mobile", MOBILE], ["desktop", DESKTOP]]) {
      const pagina = await contexto.newPage();
      await pagina.setViewportSize(viewport);
      await pagina.goto(alvo, { waitUntil: "networkidle", timeout: 45000 });
      await pagina.waitForTimeout(500);
      await pagina.screenshot({ path: join(destino, `${nome}.png`), fullPage: true });
      relatorio.larguras[nome] = await pagina.evaluate(auditoria);
      await pagina.close();
    }
  } catch (erro) {
    console.error(`ERRO ao abrir ${alvo}: ${erro.message.slice(0, 140)}`);
    console.error("Se o site não abre, isso já é o argumento — trate como lead de site quebrado.");
    await navegador.close();
    process.exit(1);
  }
  await navegador.close();

  // Layout que não muda entre 390px e 1280px é layout fixo, o sinal mais forte.
  const larguraMobile = relatorio.larguras.mobile?.medidas.larguraConteudo ?? 0;
  const larguraDesktop = relatorio.larguras.desktop?.medidas.larguraConteudo ?? 0;
  const fixo = larguraMobile > 0 && Math.abs(larguraMobile - larguraDesktop) < 20;

  // Um achado por código, ficando com a versão de maior peso.
  const porCodigo = new Map();
  for (const largura of Object.values(relatorio.larguras)) {
    for (const a of largura.achados) {
      if (!porCodigo.has(a.codigo) || porCodigo.get(a.codigo).peso < a.peso) {
        porCodigo.set(a.codigo, a);
      }
    }
  }
  if (fixo) {
    porCodigo.set("layout_fixo", {
      peso: 20,
      codigo: "layout_fixo",
      frase:
        "O site tem largura fixa: a página que abre no celular é exatamente a mesma do computador, apenas reduzida. Hoje a maior parte das visitas vem do telefone.",
      evidencia: `Conteúdo com ${larguraDesktop}px tanto em tela de 1280px quanto de 390px`,
    });
  }

  const achados = [...porCodigo.values()].sort((a, b) => b.peso - a.peso);
  const atraso = Math.min(100, achados.reduce((soma, a) => soma + a.peso, 0));

  const veredito =
    atraso >= 55 ? "O site é de outra época. Refazer é a conversa certa."
    : atraso >= 30 ? "O site tem problemas visíveis que sustentam uma proposta de nova versão."
    : atraso >= 12 ? "O site está razoável. A conversa é de melhoria pontual, não de reforma."
    : "O site está em dia. Não force o argumento de modernização — procure outro ângulo.";

  const linhas = [
    `# Análise de modernização — ${alvo}`, "",
    `**Índice de atraso: ${atraso}/100.** ${veredito}`, "",
    "Prints do site atual em `atual/mobile.png` e `atual/desktop.png`.",
    "**Olhe os dois.** A medição abaixo pega o que é contável; o que parece velho",
    "aos olhos — cor, ícone, foto, estilo de botão — só se vê olhando, e costuma",
    "render a melhor frase da abordagem.", "",
  ];

  if (achados.length === 0) {
    linhas.push("Nenhum sinal de atraso detectado.", "");
  } else {
    linhas.push("## Achados", "",
      "Escritos como frase para dizer ao dono. Use **no máximo dois** por mensagem —",
      "lista de defeitos soa como ataque, e o objetivo é abrir conversa.", "");
    for (const a of achados) {
      linhas.push(`### ${a.frase}`, "", `*Evidência:* ${a.evidencia} · peso ${a.peso}`, "");
    }
  }

  const m = relatorio.larguras.desktop?.medidas;
  if (m) {
    linhas.push("## Medidas", "",
      `- Largura do conteúdo: ${larguraDesktop}px no desktop, ${larguraMobile}px no celular`,
      `- Regras de CSS: ${m.regrasCss}${m.temMediaQuery ? " (tem regra de tela)" : " (nenhuma regra de tela)"}`,
      `- Fonte base: ${m.fonteBase ? Math.round(m.fonteBase) + "px" : "—"}`,
      `- Imagens de conteúdo: ${m.imagens}`, "");
  }

  writeFileSync(join(destino, "relatorio.md"), linhas.join("\n"));
  writeFileSync(join(destino, "relatorio.json"), JSON.stringify({ atraso, achados, relatorio }, null, 2));

  console.log(`\nÍndice de atraso: ${atraso}/100 — ${veredito}\n`);
  for (const a of achados) console.log(`  [${String(a.peso).padStart(2)}] ${a.frase.slice(0, 96)}`);
  console.log(`\nPrints e relatório em ${destino}/`);
}

main();
