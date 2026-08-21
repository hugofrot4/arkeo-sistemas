import { chromium } from "playwright";
const perfil = process.argv[2];
const saida  = process.argv[3];
const nav = await chromium.launch({ args:["--disable-blink-features=AutomationControlled"] });
const ctx = await nav.newContext({
  viewport:{width:1280,height:1400},
  locale:"pt-BR",
  userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
});
const p = await ctx.newPage();
// junta toda URL de imagem que passar pela rede
const daRede = new Set();
p.on("response", r => {
  const u = r.url();
  if (/scontent[^/]*\.cdninstagram\.com|fbcdn\.net/.test(u) && /\.(jpg|jpeg|webp|png)/.test(u)) daRede.add(u);
});
await p.goto("https://www.instagram.com/"+perfil+"/", { waitUntil:"domcontentloaded", timeout:60000 });
await p.waitForTimeout(6000);
await p.mouse.wheel(0, 2500); await p.waitForTimeout(3000);
await p.mouse.wheel(0, 2500); await p.waitForTimeout(3000);

const info = await p.evaluate(() => ({
  titulo: document.title,
  og: document.querySelector('meta[property="og:image"]')?.content || null,
  desc: document.querySelector('meta[property="og:description"]')?.content || null,
  imgs: [...document.images].map(i => ({src:i.src, alt:i.alt, w:i.naturalWidth, h:i.naturalHeight}))
              .filter(i => /cdninstagram|fbcdn/.test(i.src)),
  temLogin: !!document.querySelector('input[name="username"]'),
}));
await p.screenshot({ path: saida+"/ig-perfil.png", fullPage:false });
console.log(JSON.stringify({ ...info, rede:[...daRede] }, null, 1));
await nav.close();
