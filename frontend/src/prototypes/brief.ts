/**
 * Monta o brief que você cola no Claude Code junto com `/prototipo-site`.
 *
 * O sistema não escreve mais o site. O que ele aporta é o que dá trabalho
 * reunir: os fatos verificados do lead, os achados da auditoria e — o mais
 * importante — o endereço do site atual, de onde a skill extrai logo, fotos,
 * cores e serviços reais.
 */

import type { Finding, Lead } from "../lib/prospecting";

/** Nomes dos tipos da Places API em português. */
const RAMOS: Record<string, string> = {
  dentist: "Dentista / odontologia",
  lawyer: "Advocacia",
  real_estate_agency: "Imobiliária",
  physiotherapist: "Fisioterapia",
  accounting: "Contabilidade",
  veterinary_care: "Veterinária",
  architect: "Arquitetura",
  insurance_agency: "Corretora de seguros",
  gym: "Academia",
  beauty_salon: "Salão de beleza",
  hair_salon: "Cabeleireiro / barbearia",
  spa: "Spa / estética",
  car_repair: "Oficina mecânica",
  restaurant: "Restaurante",
  pet_store: "Pet shop",
};

const SITUACAO: Record<string, string> = {
  sem_presenca: "Sem site e sem página em rede social.",
  so_rede_social: "Só tem rede social, não tem site.",
  site_quebrado: "Tem endereço de site, mas ele não abre.",
  site_obsoleto: "Tem site, mas desatualizado ou quebrado no celular.",
  site_ok: "Tem site em condições — caso de reformulação, não de urgência.",
  nao_auditado: "Ainda não auditado.",
};

export function slugFor(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "site"
  );
}

export interface BriefInput {
  lead: Lead;
  findings: Finding[];
  cityName: string;
}

export function buildBrief({ lead, findings, cityName }: BriefInput): string {
  const slug = slugFor(lead.name);

  const linhas: string[] = [
    `# Brief — ${lead.name}`,
    "",
    `- **Slug:** ${slug}`,
    `- **Ramo:** ${RAMOS[lead.niche] ?? lead.niche} (\`${lead.niche}\`)`,
    `- **Cidade:** ${cityName}`,
  ];

  if (lead.neighborhood) linhas.push(`- **Bairro:** ${lead.neighborhood}`);
  if (lead.address) linhas.push(`- **Endereço:** ${lead.address}`);

  if (lead.whatsappValid && lead.phoneE164) {
    linhas.push(`- **WhatsApp:** ${lead.phoneE164.replace(/\D/g, "")} (use em \`wa.me/\`)`);
  } else if (lead.phone) {
    linhas.push(`- **Telefone:** ${lead.phone} — **não é celular**, use \`tel:\`, não \`wa.me\``);
  } else {
    linhas.push(`- **Telefone:** nenhum. O CTA vira âncora para a seção de contato.`);
  }

  linhas.push(
    lead.rating !== null
      ? `- **Google:** nota ${lead.rating} com ${lead.userRatingCount} avaliações (use o valor exato, ou não use)`
      : `- **Google:** ainda sem avaliações — não invente nota`,
  );

  linhas.push(`- **Situação:** ${SITUACAO[lead.segment] ?? lead.segment}`);
  linhas.push("");

  if (lead.website) {
    linhas.push(
      "## Site atual — extraia o material antes de desenhar",
      "",
      "```bash",
      `python3 .claude/skills/prototipo-site/scripts/extrair.py ${lead.website} ${slug}`,
      "```",
      "",
      "Logo, fotos, cores e serviços reais saem daí. O que estiver publicado nesse",
      "site é afirmação do próprio negócio e pode ser reaproveitado com fidelidade.",
      "",
    );
  } else if (lead.socialUrl) {
    linhas.push(
      "## Sem site",
      "",
      `Só rede social: ${lead.socialUrl}`,
      "",
      "Não há material para extrair. Trate a falta de imagem como manda a doutrina de design.",
      "",
    );
  } else {
    linhas.push(
      "## Sem site",
      "",
      "Nenhuma presença digital encontrada. Sem material para extrair.",
      "",
    );
  }

  if (findings.length > 0) {
    linhas.push(
      "## Achados da auditoria",
      "",
      "Servem para a mensagem de abordagem, não para a página.",
      "",
      ...findings.map((f) => `- [${f.severity}] ${f.evidence}`),
      "",
    );
  }

  linhas.push(
    "---",
    "",
    `Gere o protótipo em \`prototipos/${slug}/\`.`,
  );

  return linhas.join("\n");
}
