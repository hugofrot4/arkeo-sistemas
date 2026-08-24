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

/**
 * O que dizer a quem acabou de abrir o protótipo.
 *
 * Este é o único momento em que a mensagem não vem da sequência: o lead saiu
 * do cronograma porque olhou a página, e o cronograma não tem texto para isso.
 *
 * A pergunta é fechada e o "sim" já é o próximo passo, como manda a doutrina.
 * A versão anterior terminava em "qualquer coisa que queira mudar, é só
 * falar", que é a forma de encerrar a conversa: não pede nada, então não
 * recebe resposta.
 */
export function buildHotFollowUp(
  leadName: string,
  senderName: string,
  agencyName: string,
): string {
  return (
    `Oi! Aqui é a ${senderName}, da ${agencyName}. Vi que você abriu a prévia ` +
    `do site da ${leadName}.\n\n` +
    `Quer que eu ajuste alguma coisa nela antes de você mostrar para a equipe?`
  );
}

/** Assunto do e-mail correspondente, quando o canal é e-mail. */
export function hotFollowUpSubject(leadName: string): string {
  return `Sobre a prévia do site da ${leadName}`;
}
