/**
 * Inspeção do protótipo construído: tira print e mede o layout renderizado.
 *
 * A leitura do código não pega erro de layout — desalinhamento, card com altura
 * diferente, foto esticada e estouro horizontal só aparecem depois de o
 * navegador aplicar o CSS. Este script abre o arquivo de verdade no Chromium,
 * mede o DOM já renderizado em duas larguras e devolve os problemas com o
 * seletor de cada elemento.
 *
 * Uso:
 *   node .claude/skills/prototipo-site/scripts/revisar.mjs prototipos/<slug>/index.html
 *
 * Escreve em prototipos/<slug>/revisao/:
 *   mobile.png    390px, página inteira
 *   desktop.png   1280px, página inteira
 *   relatorio.json
 *
 * Olhe os prints. O relatório pega o que é mensurável; o que é feio só se vê.
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const LARGURAS = [
  { nome: "mobile", width: 390, height: 844 },
  { nome: "desktop", width: 1280, height: 900 },
];

/** Abaixo disto o texto fica ilegível no celular. */
const MIN_FONT = 14;
/** Alvo de toque confortável, recomendação de acessibilidade consolidada. */
const MIN_TOQUE = 44;

// Roda dentro do navegador: recebe os limiares por argumento porque o corpo
// da função é serializado e não enxerga o escopo do módulo.
const auditoria = ({ MIN_FONT, MIN_TOQUE }) => {
  const achados = [];
  const anota = (severidade, tipo, alvo, detalhe) =>
    achados.push({ severidade, tipo, alvo, detalhe });

  const seletor = (el) => {
    if (!el || el === document.body) return "body";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    const texto = (el.textContent || "").trim().slice(0, 28);
    return `${tag}${id}${cls}${texto ? ` «${texto}»` : ""}`;
  };

  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };

  // ── estouro horizontal ────────────────────────────────────────────────
  const doc = document.documentElement;
  const estouro = doc.scrollWidth - doc.clientWidth;
  if (estouro > 1) {
    anota("erro", "estouro-horizontal", "página",
      `A página rola ${estouro}px para o lado. No celular isso é o defeito mais visível que existe.`);
    for (const el of document.querySelectorAll("body *")) {
      if (!visivel(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 1 && r.width > 40) {
        anota("erro", "elemento-estoura", seletor(el),
          `Passa ${Math.round(r.right - doc.clientWidth)}px da borda direita.`);
        break;
      }
    }
  }

  // ── alinhamento das bordas ────────────────────────────────────────────
  // Site bem construído tem uma margem só, repetida. A borda mais frequente é
  // a régua; qualquer seção fora dela é o desalinho — e é ela que interessa
  // nomear, mesmo que aconteça uma vez só.
  const secoes = [...document.querySelectorAll("section, main > div, header, footer")].filter(visivel);
  const candidatos = [];
  for (const secao of secoes) {
    for (const filho of [...secao.children].filter(visivel)) {
      const r = filho.getBoundingClientRect();
      // Elemento que sangra até a borda é decisão de layout, não desalinho.
      if (r.width >= doc.clientWidth - 2 || r.width < 120) continue;
      candidatos.push({ el: filho, left: Math.round(r.left), width: Math.round(r.width) });
    }
  }

  const frequencia = new Map();
  for (const c of candidatos) frequencia.set(c.left, (frequencia.get(c.left) || 0) + 1);
  const regua = [...frequencia.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  let desalinhados = 0;
  if (regua !== undefined) {
    for (const c of candidatos) {
      if (Math.abs(c.left - regua) <= 4) continue;
      desalinhados++;
      if (desalinhados <= 4) {
        anota("erro", "borda-desalinhada", seletor(c.el),
          `Começa em ${c.left}px enquanto o resto da página começa em ${regua}px ` +
          `(${Math.abs(c.left - regua)}px de diferença). Use o mesmo container das outras seções.`);
      }
    }
    if (desalinhados > 4) {
      anota("erro", "borda-desalinhada", "seções",
        `Mais ${desalinhados - 4} blocos fora da régua de ${regua}px.`);
    }
  }

  // Larguras de container: uma medida, repetida. Duas já é descuido.
  const larguras = new Map();
  for (const c of candidatos) {
    const w = Math.round(c.width / 8) * 8;
    larguras.set(w, (larguras.get(w) || 0) + 1);
  }
  if (larguras.size > 2) {
    const lista = [...larguras.entries()].sort((a, b) => b[1] - a[1])
      .map(([w, n]) => `${w}px (${n}x)`).join(", ");
    anota("aviso", "containers-diferentes", "seções",
      `${larguras.size} larguras de container diferentes: ${lista}. Devia ser uma.`);
  }

  // ── cards de alturas diferentes na mesma grade ───────────────────────
  // Duas ressalvas, sem as quais isto vira ruído:
  //   • layout de duas colunas assimétricas (rótulo à esquerda, conteúdo à
  //     direita) é assimétrico DE PROPÓSITO — só interessa quando as colunas
  //     têm a mesma largura, ou seja, quando é de fato uma fileira de cards;
  //   • base irregular só incomoda quando há borda visível. Blocos de texto
  //     sem caixa podem ter alturas diferentes à vontade.
  const temCaixa = (el) => {
    const s = getComputedStyle(el);
    const pai = el.parentElement ? getComputedStyle(el.parentElement).backgroundColor : "";
    const fundoProprio = s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== pai;
    const borda = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
    return fundoProprio || borda || s.boxShadow !== "none";
  };

  for (const grade of document.querySelectorAll("*")) {
    const s = getComputedStyle(grade);
    if (s.display !== "grid" && s.display !== "flex") continue;
    if (s.display === "flex" && s.flexDirection.startsWith("column")) continue;

    const filhos = [...grade.children].filter(visivel);
    if (filhos.length < 2) continue;

    const caixas = filhos.map((f) => f.getBoundingClientRect());
    // Só quando estão lado a lado: empilhado no mobile é normal variar.
    if (new Set(caixas.map((r) => Math.round(r.top))).size > 1) continue;

    const larguras = caixas.map((r) => r.width);
    const larguraMin = Math.min(...larguras), larguraMax = Math.max(...larguras);
    if (larguraMax - larguraMin > larguraMax * 0.12) continue;   // colunas desiguais = layout, não cards
    if (!filhos.every(temCaixa)) continue;                        // sem borda visível, ninguém repara

    const alturas = caixas.map((r) => Math.round(r.height));
    const min = Math.min(...alturas), max = Math.max(...alturas);
    if (max - min > 12) {
      anota("erro", "cards-irregulares", seletor(grade),
        `Cards lado a lado com alturas de ${min}px a ${max}px — as bases não fecham. ` +
        `Use align-items: stretch e empurre o rodapé do card com margin-top: auto.`);
    }
  }

  // ── imagens ──────────────────────────────────────────────────────────
  for (const img of document.querySelectorAll("img")) {
    if (!visivel(img)) continue;
    const r = img.getBoundingClientRect();
    const s = getComputedStyle(img);
    const nat = img.naturalWidth / (img.naturalHeight || 1);
    const rend = r.width / (r.height || 1);

    if (!img.getAttribute("alt")) {
      anota("aviso", "img-sem-alt", seletor(img), "Sem alt.");
    }
    // Distorção: a única causa de foto "achatada" ou "esticada".
    if (img.naturalWidth && Math.abs(nat - rend) / nat > 0.03 &&
        s.objectFit !== "cover" && s.objectFit !== "contain") {
      anota("erro", "img-distorcida", seletor(img),
        `Proporção natural ${nat.toFixed(2)}:1, renderizada ${rend.toFixed(2)}:1. ` +
        `A imagem está esticada. Use object-fit: cover com aspect-ratio.`);
    }
    if (img.naturalWidth && r.width > img.naturalWidth * 1.5) {
      anota("aviso", "img-ampliada", seletor(img),
        `Exibida a ${Math.round(r.width)}px, mas o arquivo tem ${img.naturalWidth}px. Vai aparecer borrada.`);
    }
    if (!img.getAttribute("width") && !img.getAttribute("height") &&
        s.aspectRatio === "auto" && getComputedStyle(img.parentElement).aspectRatio === "auto") {
      anota("aviso", "img-sem-reserva",  seletor(img),
        "Sem width/height nem aspect-ratio: o layout salta quando ela carrega.");
    }
  }

  // ── tipografia ───────────────────────────────────────────────────────
  for (const el of document.querySelectorAll("p, li, td, span, a, div")) {
    if (!visivel(el)) continue;
    const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
    if (texto.length < 12) continue;
    const s = getComputedStyle(el);
    const tamanho = parseFloat(s.fontSize);
    // Rótulo curto em maiúscula com espacejamento é recurso tipográfico, e
    // vive bem em 12px. O limite de 14px vale para texto que se lê de fato.
    const rotulo = s.textTransform === "uppercase" && texto.length <= 40;
    const piso = rotulo ? 11 : MIN_FONT;
    if (tamanho < piso) {
      anota("erro", "fonte-pequena", seletor(el),
        `${tamanho}px${rotulo ? " (rótulo)" : ""}. Mínimo legível é ${piso}px.`);
    }
    const linha = parseFloat(s.lineHeight);
    if (linha && tamanho && linha / tamanho < 1.3 && texto.length > 80) {
      anota("aviso", "entrelinha-apertada", seletor(el),
        `line-height ${(linha / tamanho).toFixed(2)} em bloco de texto. Abaixo de 1.4 cansa a leitura.`);
    }
    const r = el.getBoundingClientRect();
    const chars = r.width / (tamanho * 0.5);
    if (chars > 95 && texto.length > 120) {
      anota("aviso", "linha-longa", seletor(el),
        `Linha com ~${Math.round(chars)} caracteres. Acima de 75 o olho perde a próxima linha.`);
    }
  }

  // ── contraste ────────────────────────────────────────────────────────
  const lum = (cor) => {
    const m = cor.match(/[\d.]+/g);
    if (!m) return null;
    const [r, g, b, a] = m.map(Number);
    if (a !== undefined && a < 0.95) return null;
    const c = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const fundoDe = (el) => {
    let atual = el;
    while (atual && atual !== document.documentElement) {
      const bg = getComputedStyle(atual).backgroundColor;
      const m = bg.match(/[\d.]+/g);
      if (m && (m[3] === undefined || Number(m[3]) > 0.95)) return bg;
      atual = atual.parentElement;
    }
    return "rgb(255,255,255)";
  };

  const vistos = new Set();
  for (const el of document.querySelectorAll("p, h1, h2, h3, h4, a, li, span, button")) {
    if (!visivel(el)) continue;
    const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
    if (texto.length < 4) continue;
    const s = getComputedStyle(el);
    const lf = lum(s.color), lb = lum(fundoDe(el));
    if (lf === null || lb === null) continue;
    const razao = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
    const tamanho = parseFloat(s.fontSize);
    const grande = tamanho >= 24 || (tamanho >= 18.66 && parseInt(s.fontWeight) >= 700);
    const minimo = grande ? 3 : 4.5;
    if (razao < minimo) {
      const chave = `${s.color}|${fundoDe(el)}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      anota("erro", "contraste-baixo", seletor(el),
        `${razao.toFixed(2)}:1 (${s.color} sobre ${fundoDe(el)}), mínimo ${minimo}:1. ` +
        `No celular sob sol isso some.`);
    }
  }

  // ── alvos de toque ───────────────────────────────────────────────────
  if (window.innerWidth <= 500) {
    for (const el of document.querySelectorAll("a, button")) {
      if (!visivel(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < MIN_TOQUE && r.width < 200) {
        anota("aviso", "toque-pequeno", seletor(el),
          `${Math.round(r.width)}×${Math.round(r.height)}px. Mínimo confortável é ${MIN_TOQUE}px de altura.`);
      }
    }
  }

  // ── texto vazando de altura fixa ─────────────────────────────────────
  // Só o elemento mais interno: o pai vaza por consequência, e apontar a
  // cadeia inteira esconde qual é a altura fixa a remover.
  const vazando = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visivel(el)) continue;
    const s = getComputedStyle(el);
    if (s.overflow !== "visible" || s.height === "auto") continue;
    // Margem folgada: descendente de fonte e arredondamento fazem qualquer
    // título passar por 2–3%. Transbordo de verdade é desproporcional.
    if (el.scrollHeight > el.clientHeight + 8 &&
        el.scrollHeight > el.clientHeight * 1.1 &&
        el.textContent.trim().length > 20) {
      vazando.push(el);
    }
  }
  for (const el of vazando) {
    if (vazando.some((outro) => outro !== el && el.contains(outro))) continue;
    anota("erro", "texto-vazando", seletor(el),
      `Conteúdo de ${el.scrollHeight}px numa caixa de ${el.clientHeight}px. Tire a altura fixa.`);
  }

  return {
    achados,
    metricas: {
      altura: doc.scrollHeight,
      estouroHorizontal: estouro,
      secoes: secoes.length,
      imagens: document.querySelectorAll("img").length,
      reguaEsquerda: regua ?? null,
      blocosDesalinhados: desalinhados,
    },
  };
};

async function main() {
  const alvo = process.argv[2];
  if (!alvo) {
    console.error("Uso: node revisar.mjs prototipos/<slug>/index.html");
    process.exit(2);
  }
  const caminho = resolve(alvo);
  const saida = join(dirname(caminho), "revisao");
  mkdirSync(saida, { recursive: true });

  const navegador = await chromium.launch();
  const relatorio = { arquivo: alvo, prints: {}, porLargura: {} };
  const erroConsole = [];

  for (const largura of LARGURAS) {
    const pagina = await navegador.newPage({
      viewport: { width: largura.width, height: largura.height },
      deviceScaleFactor: 2,
    });
    pagina.on("pageerror", (e) => erroConsole.push(String(e).slice(0, 200)));
    await pagina.goto("file://" + caminho, { waitUntil: "networkidle" });
    // Espera as fontes assentarem: medir antes disso dá altura errada.
    await pagina.evaluate(() => document.fonts?.ready);
    await pagina.waitForTimeout(350);

    const print = join(saida, `${largura.nome}.png`);
    await pagina.screenshot({ path: print, fullPage: true });
    relatorio.prints[largura.nome] = print;
    relatorio.porLargura[largura.nome] = await pagina.evaluate(auditoria, { MIN_FONT, MIN_TOQUE });
    await pagina.close();
  }

  await navegador.close();
  relatorio.errosDeConsole = [...new Set(erroConsole)];

  writeFileSync(join(saida, "relatorio.json"), JSON.stringify(relatorio, null, 2));

  // Resumo no terminal, erro antes de aviso.
  let erros = 0, avisos = 0;
  for (const [nome, dados] of Object.entries(relatorio.porLargura)) {
    const lista = dados.achados.sort((a, b) => (a.severidade === "erro" ? -1 : 1));
    console.log(`\n── ${nome} (${dados.metricas.altura}px de altura) ──`);
    if (!lista.length) console.log("  nenhum problema mensurável");
    for (const a of lista) {
      a.severidade === "erro" ? erros++ : avisos++;
      console.log(`  ${a.severidade === "erro" ? "ERRO " : "aviso"} [${a.tipo}] ${a.alvo}`);
      console.log(`        ${a.detalhe}`);
    }
  }
  if (relatorio.errosDeConsole.length) {
    console.log("\n── erros de JavaScript ──");
    for (const e of relatorio.errosDeConsole) console.log("  " + e);
  }
  console.log(`\n${erros} erro(s), ${avisos} aviso(s).`);
  console.log(`Prints: ${saida}/mobile.png e ${saida}/desktop.png — abra os dois.`);
  process.exit(erros > 0 ? 1 : 0);
}

main();
