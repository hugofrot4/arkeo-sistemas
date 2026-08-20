// Utilidades de classificação de URL. A auditoria completa vive no job
// `enrich`; aqui fica só o que o job `details` precisa para separar "site" de
// "perfil de rede social".

const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "linktr.ee",
  "linktree.com",
  "beacons.ai",
  "bio.link",
  "linkedin.com",
  "wa.me",
  "api.whatsapp.com",
  "youtube.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
];

export type UrlKind = "site" | "social" | "invalid";

/**
 * O `websiteUri` do Places frequentemente aponta para um Instagram. Contar
 * isso como "tem site" é o falso positivo que fazia a v1 descartar justamente
 * os melhores leads: quem já mantém rede social entende presença digital e só
 * não tem site.
 */
export function classifyUrl(raw: string | null | undefined): { kind: UrlKind; url: string | null } {
  if (!raw) return { kind: "invalid", url: null };
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { kind: "invalid", url: null };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { kind: "invalid", url: null };
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isSocial = SOCIAL_HOSTS.some((s) => host === s || host.endsWith(`.${s}`));
  return { kind: isSocial ? "social" : "site", url: parsed.toString() };
}
