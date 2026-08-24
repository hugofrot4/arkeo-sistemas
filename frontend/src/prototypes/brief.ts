/**
 * Monta o brief que você cola no Claude Code junto com `/prototipo-site`.
 *
 * O sistema não escreve mais o site. O que ele aporta é o que dá trabalho
 * reunir: os fatos verificados do lead, os achados da auditoria e — o mais
 * importante — o endereço do site atual, de onde a skill extrai logo, fotos,
 * cores e serviços reais.
 */

import { canalDoLead, type Finding, type Lead } from "../lib/prospecting";

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
  nao_auditado:
    "Auditoria ainda não rodou. Trabalhe com o que houver de material e não invente achado sobre o site.",
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
  senderName: string;
  agencyName: string;
}

export function buildBrief({
  lead,
  findings,
  cityName,
  senderName,
  agencyName,
}: BriefInput): string {
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
      "## Sem site — só rede social",
      "",
      lead.socialUrl,
      "",
      "Extraia o material antes de desenhar:",
      "",
      "```bash",
      `python3 .claude/skills/prototipo-site/scripts/instagram.py ${lead.socialUrl} ${slug} 6`,
      "```",
      "",
      "Traz a foto de perfil como logo, as fotos do feed, a bio e a categoria —",
      "fotos reais do negócio, que valem muito mais que imagem de banco.",
      "",
      "Se o script falhar (o endpoint é interno do Instagram e responde 429 quando",
      "se insiste), o caminho manual continua valendo: abra o perfil, salve a logo",
      `em \`prototipos/${slug}/fonte/imagens/\` e confira as observações abaixo.`,
      "",
    );
  } else {
    linhas.push(
      "## Sem presença digital",
      "",
      "Nem site nem rede social. Não há material para extrair — o protótipo se",
      "sustenta em tipografia e cor, como manda a doutrina de design.",
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

  if (lead.notes.trim()) {
    linhas.push(
      "## Observações do admin",
      "",
      "Anotado à mão por quem conferiu o lead. **Trate como fato do negócio** —",
      "vale o mesmo que conteúdo publicado por ele.",
      "",
      lead.notes.trim(),
      "",
    );
  }

  if (lead.verifiedByHuman) {
    linhas.push(
      "> Este lead foi conferido à mão: os dados de contato e endereço acima",
      "> valem mais que qualquer coisa que a coleta automática tenha dito.",
      "",
    );
  }

  // O canal não decide mais o que escrever: as duas escadas vão no arquivo
  // sempre, e o sistema coloca cada bloco no toque certo. O que ele decide é
  // qual delas começa — e é isso que o gerador precisa saber para calibrar a
  // primeira mensagem.
  const canalDaSequencia = canalDoLead(lead);
  linhas.push(
    "## Canal da abordagem",
    "",
    "**Escreva as duas escadas**, WhatsApp e e-mail, separadas por",
    "`=== E-MAIL ===`. O canal de um toque muda no meio da sequência — é para",
    "isso que o primeiro toque de WhatsApp pede o contato de quem decide —, e",
    "sem as duas o card fica com o texto do canal errado.",
    "",
    canalDaSequencia === "email"
      ? [
          `**Começa por e-mail** (${lead.email}).`,
          "Tendo o e-mail, não se gasta toque perguntando com quem falar: o",
          "bloco 1 da parte de e-mail já entrega o protótipo, com `{{link}}`.",
          "Link em e-mail é esperado e não custa reputação.",
        ].join(" ")
      : [
          "**Começa por WhatsApp**, e o primeiro toque não vende: ele descobre",
          "com quem falar. Este lead não tem e-mail, e o WhatsApp do Google é",
          "quase sempre a recepção — que não decide sobre site, mas sabe quem",
          "decide. Então o bloco 1 de WhatsApp se identifica e pergunta *quem",
          "cuida do site e qual o e-mail dessa pessoa*, em duas ou três linhas.",
          "Sem link, sem oferta e sem citar o defeito: o argumento é para quem",
          "decide, não para quem atende. Mensagem fria com link para quem não",
          "tem você nos contatos é o padrão que restringiu o número da Arkeo,",
          "mesmo com menos de vinte envios por dia. O `{{link}}` e a entrega vão",
          "no bloco 2 de WhatsApp.",
        ].join(" "),
    "",
    lead.phoneE164 && lead.email
      ? "Os dois contatos são pessoas diferentes: o WhatsApp é a recepção, o e-mail chega mais perto de quem decide. A sequência tem quatro toques no total, não quatro por canal."
      : "",
    "",
    "Regras de tamanho, papel de cada bloco e a ordem das duas escadas em",
    "`references/abordagem.md`. Não há teto que recuse — a entrega é a mensagem",
    "longa, as outras encolhem a partir dela.",
    "",
    "## Quem assina a abordagem",
    "",
    `**${senderName}**, do atendimento da **${agencyName}**.`,
    "",
    "As quatro mensagens vão em nome dela, representando a empresa — não em",
    "nome de um profissional autônomo. Tom profissional, sem gíria e sem",
    "abreviação. Ver o passo 7 da skill para as regras e os exemplos.",
    "",
    "---",
    "",
    `Gere o protótipo em \`prototipos/${slug}/\`.`,
  );

  return linhas.join("\n");
}
