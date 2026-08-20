// Auditoria HTTP do site atual do lead.
//
// É daqui que sai o argumento de venda. Uma abordagem que diz "seu site não
// abre no celular" converte; "olá, faço sites" não. Cada achado registrado
// aqui é um fato verificável sobre o negócio da pessoa.
//
// Só regex, sem parser de DOM: as checagens são todas sobre presença de tag ou
// padrão, e uma dependência de parser não pagaria o custo de bundle.

import type { Finding } from "./database.ts";

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 600_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; ArkeoSitesBot/1.0; +https://www.arkeosistemas.com.br)";

export interface SiteAudit {
  reachable: boolean;
  httpStatus: number | null;
  finalUrl: string | null;
  httpsOk: boolean;
  hasViewport: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  hasContactLink: boolean;
  hasForm: boolean;
  hasAnalytics: boolean;
  platform: string | null;
  copyrightYear: number | null;
  /** Página monta o conteúdo no navegador — o HTML servido não prova quase nada. */
  jsRendered: boolean;
  pageText: string;
  title: string | null;
  email: string | null;
  findings: Finding[];
}

function emptyAudit(): SiteAudit {
  return {
    reachable: false,
    httpStatus: null,
    finalUrl: null,
    httpsOk: false,
    hasViewport: false,
    hasTitle: false,
    hasDescription: false,
    hasContactLink: false,
    hasForm: false,
    hasAnalytics: false,
    platform: null,
    copyrightYear: null,
    jsRendered: false,
    pageText: "",
    title: null,
    email: null,
    findings: [],
  };
}

async function fetchWithTimeout(url: string, method: "GET" | "HEAD") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR,pt;q=0.9" },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Lê no máximo MAX_HTML_BYTES: página gigante não pode travar o worker. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c.subarray(0, Math.min(c.length, total - offset)), offset);
    offset += c.length;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

const PLATFORM_PATTERNS: [RegExp, string][] = [
  [/sites\.google\.com|business\.site|negocio\.site/i, "google_sites"],
  [/wix\.com|wixsite\.com|parastorage\.com/i, "wix"],
  [/squarespace/i, "squarespace"],
  [/godaddysites|websitebuilder\.godaddy/i, "godaddy"],
  [/shopify/i, "shopify"],
  [/name=["']generator["'][^>]*content=["']WordPress/i, "wordpress"],
  [/\/wp-content\/|\/wp-includes\//i, "wordpress"],
  [/webflow/i, "webflow"],
];

function detectPlatform(html: string, finalUrl: string): string | null {
  const haystack = `${finalUrl}\n${html.slice(0, 40_000)}`;
  for (const [pattern, name] of PLATFORM_PATTERNS) {
    if (pattern.test(haystack)) return name;
  }
  return null;
}

function stripTags(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ano de copyright mais recente na página — site parado em 2019 se denuncia. */
function extractCopyrightYear(text: string): number | null {
  const matches = text.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,25}((?:19|20)\d{2})/gi);
  let latest: number | null = null;
  for (const m of matches) {
    const year = Number(m[1]);
    if (!latest || year > latest) latest = year;
  }
  return latest;
}

function extractEmail(html: string, text: string): string | null {
  const mailto = html.match(/mailto:([^"'?\s>]+@[^"'?\s>]+)/i)?.[1];
  const loose = text.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/)?.[0];
  const found = mailto ?? loose;
  if (!found) return null;
  // Endereço de exemplo em template não é contato real.
  if (/(example|seudominio|dominio|email)@/i.test(found)) return null;
  return found.toLowerCase().slice(0, 200);
}

export async function auditSite(url: string): Promise<SiteAudit> {
  const audit = emptyAudit();
  let res: Response;
  try {
    res = await fetchWithTimeout(url, "GET");
  } catch (err) {
    audit.findings.push({
      code: "site_fora_do_ar",
      severity: "alta",
      evidence: err instanceof Error && err.name === "AbortError"
        ? "O site não respondeu em 8 segundos."
        : "O endereço do site não abre.",
    });
    return audit;
  }

  audit.httpStatus = res.status;
  audit.finalUrl = res.url || url;
  audit.reachable = res.ok;

  if (!res.ok) {
    await res.body?.cancel().catch(() => {});
    audit.findings.push({
      code: "site_com_erro",
      severity: "alta",
      evidence: `O site responde com erro ${res.status}.`,
    });
    return audit;
  }

  const html = await readCapped(res);
  const text = stripTags(html);

  audit.httpsOk = audit.finalUrl.startsWith("https://");
  audit.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  audit.hasForm = /<form[\s>]/i.test(html);
  audit.hasContactLink = /wa\.me|api\.whatsapp\.com|href=["']tel:/i.test(html);
  audit.hasAnalytics =
    /googletagmanager|google-analytics|gtag\(|fbq\(|connect\.facebook\.net|clarity\.ms/i.test(html);
  audit.platform = detectPlatform(html, audit.finalUrl);
  // Um SPA serve uma casca vazia e monta tudo no navegador. Sem isto, todo
  // site React seria acusado de não ter formulário, contato nem medição — e
  // uma acusação falsa sobre o negócio da pessoa encerra a conversa.
  audit.jsRendered =
    text.length < 250 &&
    /<div[^>]+id=["'](root|app|__next|__nuxt)["']/i.test(html) &&
    /<script[^>]+(type=["']module["']|src=["'][^"']*\.m?js)/i.test(html);
  audit.copyrightYear = extractCopyrightYear(text);
  audit.pageText = text.slice(0, 3000);
  audit.email = extractEmail(html, text);

  const title = html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1]?.trim() ?? null;
  audit.title = title;
  audit.hasTitle = !!title && title.length > 3;

  const description = html
    .match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]
    ?.trim();
  audit.hasDescription = !!description && description.length > 20;

  const currentYear = new Date().getUTCFullYear();
  if (!audit.httpsOk) {
    audit.findings.push({
      code: "sem_https",
      severity: "alta",
      evidence: "O site não usa HTTPS — o navegador mostra aviso de 'não seguro' para quem entra.",
    });
  }
  if (!audit.hasViewport) {
    audit.findings.push({
      code: "sem_viewport",
      severity: "alta",
      evidence: "A página não declara viewport, então abre em versão de computador no celular.",
    });
  }
  if (audit.platform === "google_sites") {
    audit.findings.push({
      code: "plataforma_limitada",
      severity: "alta",
      evidence: "O site é um Google Sites / site gratuito do Perfil da Empresa.",
    });
  }
  // Daqui em diante, só achados que o HTML servido comprova. Numa página
  // renderizada por JS, rodapé, formulário e scripts de medição podem estar
  // no bundle — afirmar que não existem seria mentira.
  if (audit.jsRendered) return audit;

  if (audit.copyrightYear && audit.copyrightYear <= currentYear - 3) {
    audit.findings.push({
      code: "site_desatualizado",
      severity: "media",
      evidence: `O rodapé ainda marca ${audit.copyrightYear}.`,
    });
  }
  if (!audit.hasContactLink) {
    audit.findings.push({
      code: "sem_contato_direto",
      severity: "media",
      evidence: "Não há link de WhatsApp nem telefone clicável — quem entra pelo celular precisa copiar o número.",
    });
  }
  if (!audit.hasForm && !audit.hasContactLink) {
    audit.findings.push({
      code: "sem_captura",
      severity: "alta",
      evidence: "A página não tem formulário nem contato clicável: visita não vira contato.",
    });
  }
  if (!audit.hasTitle || !audit.hasDescription) {
    audit.findings.push({
      code: "seo_incompleto",
      severity: "media",
      evidence: "Falta título ou descrição — é o texto que aparece no resultado do Google.",
    });
  }
  if (!audit.hasAnalytics) {
    audit.findings.push({
      code: "sem_medicao",
      severity: "baixa",
      evidence: "Não há ferramenta de medição instalada: não dá para saber quantas pessoas visitam.",
    });
  }

  return audit;
}

/**
 * Quando o Places não traz site, tenta o domínio óbvio antes de cravar
 * "sem presença". Confirma com um token do nome do negócio no conteúdo —
 * sem isso, um nome genérico casaria com qualquer site alheio.
 */
export async function guessWebsite(name: string): Promise<string | null> {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (slug.length < 5 || slug.length > 30) return null;

  const token = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 5)[0];
  if (!token) return null;

  for (const candidate of [`https://${slug}.com.br`, `https://${slug}.com`]) {
    try {
      const res = await fetchWithTimeout(candidate, "GET");
      if (!res.ok) {
        await res.body?.cancel().catch(() => {});
        continue;
      }
      const html = await readCapped(res);
      if (stripTags(html).toLowerCase().includes(token)) return res.url || candidate;
    } catch {
      // Domínio não existe ou não responde — segue para o próximo palpite.
    }
  }
  return null;
}
