import type { LeadSegment } from "./prospecting";

/**
 * O primeiro toque de WhatsApp, montado aqui em vez de escrito à mão.
 *
 * Ele deixou de ser copy. Quando o toque 1 oferecia o protótipo, cada lead
 * precisava do seu texto: dependia do defeito encontrado na auditoria e do que
 * o protótipo resolvia. A abordagem nova não oferece nada — pergunta com quem
 * falar sobre o site —, e essa pergunta é a mesma para todo mundo.
 *
 * O WhatsApp que aparece no Google é quase sempre a recepção, que não decide
 * sobre site mas sabe quem decide. Perguntar isso é administrativo e fácil de
 * responder; oferecer serviço a ela é gastar a mensagem com quem não pode
 * dizer sim — e mensagem fria com link é o padrão que restringiu o número.
 *
 * Por isso o texto não cita o defeito do site: o argumento é de quem decide, e
 * reclamar do site na frente de quem atende soa como crítica ao trabalho dela.
 *
 * Ver `.claude/skills/prototipo-site/references/abordagem.md`.
 */

/**
 * Como o nicho entra na frase "a gente cria sites para ___ aqui no Ceará".
 *
 * Plural e no jargão que o dono usa para se descrever, não o rótulo da
 * interface: "Dentista" vira "clínicas odontológicas", que é como uma clínica
 * se reconhece.
 */
const NICHO_NA_FRASE: Record<string, string> = {
  dentist: "clínicas odontológicas",
  lawyer: "escritórios de advocacia",
  real_estate_agency: "imobiliárias",
  physiotherapist: "clínicas de fisioterapia",
  accounting: "escritórios de contabilidade",
  veterinary_care: "clínicas veterinárias",
  architect: "escritórios de arquitetura",
  insurance_agency: "corretoras de seguros",
  gym: "academias",
  beauty_salon: "salões de beleza",
  hair_salon: "salões de beleza",
  spa: "espaços de estética",
  car_repair: "oficinas",
  restaurant: "restaurantes",
  pet_store: "pet shops",
};

/** Segmentos em que existe um site para o qual apontar. */
const TEM_SITE: LeadSegment[] = ["site_quebrado", "site_obsoleto", "site_ok"];

export interface OpenerInput {
  leadName: string;
  niche: string;
  segment: LeadSegment;
  senderName: string;
  agencyName: string;
}

export function buildRoutingOpener({
  leadName,
  niche,
  segment,
  senderName,
  agencyName,
}: OpenerInput): string {
  const nicho = NICHO_NA_FRASE[niche] ?? "negócios locais";
  const apresentacao =
    `Oi, tudo bem? Aqui é a ${senderName}, da ${agencyName} — ` +
    `a gente cria sites para ${nicho} aqui no Ceará.`;

  // Sem site, não há "nele" para apontar, e perguntar quem cuida do site de
  // quem não tem site expõe o erro logo na primeira linha.
  const pergunta = TEM_SITE.includes(segment)
    ? "Quem cuida do site de vocês? Queria falar com essa pessoa sobre uma " +
      "coisa que reparei nele. Tem um e-mail dela?"
    : `Quem cuida da parte de internet de vocês? Queria falar com essa pessoa ` +
      `sobre uma ideia que tive para a ${leadName}. Tem um e-mail dela?`;

  return `${apresentacao}\n\n${pergunta}`;
}
