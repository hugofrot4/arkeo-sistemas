/**
 * Coletor de perfil público do Instagram, por navegador de verdade.
 *
 * Auxiliar de `instagram.py` — não se roda sozinho. O Python cuida do
 * tratamento de imagem, da paleta e do relatório; aqui só se colhe.
 *
 * ## Por que navegador, e não requisição
 *
 * O endpoint interno (`/api/v1/users/web_profile_info/`) responde **429** com
 * facilidade, e aí `curl` no perfil devolve o *login wall*: 600 KB de HTML sem
 * um único `scontent`, sem `profile_pic_url`, com `<title>Instagram</title>`.
 * O perfil público é montado por JavaScript.
 *
 * Chromium executa esse JavaScript e a página vem inteira. Duas armadilhas:
 *
 * - **O download tem que sair do mesmo contexto do navegador**, com `referer`.
 *   Puxar a URL assinada por fora dá 403.
 * - **A URL da foto de perfil é assinada para aquele recorte.** Trocar
 *   `s150x150` por `s320x320` ou tirar o `stp` invalida a assinatura — 403 nos
 *   quatro casos testados. Quando só houver 150px, é isso que existe: não
 *   amplie o selo além disso no protótipo.
 *
 * Nada aqui depende de texto em português: as imagens do feed são achadas pelo
 * `href` do post (`/p/`, `/reel/`), não pelo texto alternativo, que vem em
 * inglês mesmo com o locale em pt-BR.
 *
 * Uso (chamado pelo instagram.py):
 *     node _ig_navegador.mjs <handle> <dir_saida> <qtd_fotos>
 *
 * Escreve `logo.bin` e `post-N.bin` em <dir_saida> e imprime um JSON no stdout.
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const [, , handle, destino, qtdBruta] = process.argv;
if (!handle || !destino) {
  console.error("uso: node _ig_navegador.mjs <handle> <dir_saida> [qtd]");
  process.exit(2);
}
const qtd = Math.max(1, Math.min(24, Number(qtdBruta) || 6));

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const nav = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled"] });
const ctx = await nav.newContext({
  viewport: { width: 1400, height: 1500 },
  locale: "pt-BR",
  userAgent: UA,
});

function encerrar(codigo, mensagem) {
  console.error(mensagem);
  nav.close().finally(() => process.exit(codigo));
}

const pagina = await ctx.newPage();
try {
  await pagina.goto(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
} catch (erro) {
  encerrar(1, "não consegui abrir o perfil: " + erro.message);
}

// O feed monta depois do primeiro paint; rolar traz as fotos seguintes.
await pagina.waitForTimeout(6000);
for (let i = 0; i < 4; i++) {
  await pagina.mouse.wheel(0, 2200);
  await pagina.waitForTimeout(2200);
}

const colhido = await pagina.evaluate(() => {
  const texto = (s) => (s || "").trim();

  // A meta description traz a bio literal, e é a fonte mais estável que existe
  // sem login: "N seguidores, N seguindo, N posts — Nome (@handle) no
  // Instagram: "bio"". O header renderizado tem números mais frescos.
  const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
  const aspas = metaDesc.match(/:\s*[""](.*)[""]\s*$/s);

  const numeroPt = (s) => {
    const limpo = texto(s).replace(/[^\d.,]/g, "");
    if (!limpo) return null;
    // "5.958" (pt) e "5,943" (en) são ambos milhares aqui
    const n = Number(limpo.replace(/[.,]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const cabecalho = document.querySelector("header")?.innerText || "";
  const seguidores =
    numeroPt((cabecalho.match(/([\d.,]+)\s*seguidores/i) || [])[1]) ??
    numeroPt((metaDesc.match(/([\d.,]+)\s*seguidores/i) || [])[1]);
  const publicacoes = numeroPt((metaDesc.match(/([\d.,]+)\s*posts/i) || [])[1]);

  // Instagram embrulha o link da bio em l.instagram.com/?u=<destino>
  let site = null;
  for (const a of document.querySelectorAll('header a[href*="l.instagram.com"]')) {
    try {
      const u = new URL(a.href).searchParams.get("u");
      if (u) { site = u; break; }
    } catch {}
  }

  const destaques = [...document.querySelectorAll('header a[href^="/stories/highlights/"]')]
    .map((a) => texto(a.innerText))
    .filter(Boolean);

  const nome = (document.title.split("(@")[0] || "").trim() || null;

  // As fotos do feed são achadas **pela própria imagem**, não pelo seletor do
  // link. Duas razões: o texto alternativo vem em inglês mesmo com locale
  // pt-BR, e o href do post é `/<perfil>/p/<codigo>/`, não `/p/<codigo>/` —
  // um seletor de prefixo em `/p/` não encontra nada.
  //
  // O que separa feed de avatar é o tamanho: feed vem em 480 ou 640, avatar e
  // capa de destaque vêm em 150.
  const doCdn = (i) => /cdninstagram|fbcdn/.test(i.src || "");
  const grande = (i) => i.naturalWidth >= 200 || /[sp]640x640/.test(i.src || "");

  const vistos = new Set();
  const posts = [];
  for (const img of document.images) {
    if (!doCdn(img) || !grande(img)) continue;
    const a = img.closest("a");
    const href = a ? a.getAttribute("href") : null;
    const chave = href || img.src;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    posts.push({
      src: img.src,
      alt: texto(img.alt),
      href,
      tipo: /\/reel\//.test(href || "") ? "vídeo (capa)" : "foto",
    });
  }

  // A foto de perfil é a imagem pequena do header que não é capa de destaque.
  const logo =
    [...(document.querySelector("header")?.querySelectorAll("img") || [])]
      .filter((i) => doCdn(i) && !i.closest('a[href*="/stories/highlights/"]'))
      .map((i) => i.src)[0] || null;

  return {
    nome,
    bio: aspas ? aspas[1].trim() : "",
    seguidores,
    publicacoes,
    site,
    destaques,
    logo,
    posts,
    parecePrivado: /Esta conta é privada|This Account is Private/i.test(document.body.innerText),
  };
});

if (colhido.parecePrivado) encerrar(1, "perfil privado — não há material público");
if (!colhido.logo && colhido.posts.length === 0)
  encerrar(1, "a página abriu mas não veio imagem nenhuma — perfil vazio ou bloqueio");

fs.mkdirSync(destino, { recursive: true });

/**
 * Baixa pelo contexto do navegador. Sem o `referer` o CDN devolve 403.
 * As variantes maiores são tentadas primeiro, mas a assinatura costuma
 * recusá-las — daí a URL original ser sempre a última tentativa.
 */
async function baixar(url, nome) {
  const variantes = [
    url.replace(/s150x150/, "s640x640").replace(/p150x150/, "p640x640"),
    url,
  ];
  for (const [indice, tentativa] of variantes.entries()) {
    try {
      const r = await ctx.request.get(tentativa, {
        headers: { referer: "https://www.instagram.com/" },
      });
      if (!r.ok()) continue;
      const corpo = await r.body();
      if (corpo.length < 2000) continue;
      fs.writeFileSync(path.join(destino, nome), corpo);
      return { arquivo: nome, bytes: corpo.length, ampliada: indice === 0 };
    } catch {}
  }
  return null;
}

const saida = {
  handle,
  nome: colhido.nome,
  bio: colhido.bio,
  seguidores: colhido.seguidores,
  publicacoes: colhido.publicacoes,
  site: colhido.site,
  destaques: colhido.destaques,
  logo: null,
  posts: [],
};

if (colhido.logo) {
  const r = await baixar(colhido.logo, "logo.bin");
  if (r) saida.logo = { ...r, url: colhido.logo };
}
for (let i = 0; i < Math.min(qtd, colhido.posts.length); i++) {
  const post = colhido.posts[i];
  const r = await baixar(post.src, `post-${i}.bin`);
  if (r) saida.posts.push({ ...r, alt: post.alt, tipo: post.tipo, href: post.href });
}

console.log(JSON.stringify(saida));
await nav.close();
