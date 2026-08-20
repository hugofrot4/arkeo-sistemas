/**
 * Monta o prompt que você roda no Claude Code para escrever o conteúdo dos
 * protótipos.
 *
 * A geração saiu de dentro do sistema de propósito: não há chave de API para
 * guardar, não há custo por lead, e o prompt fica visível e editável em vez de
 * escondido numa Edge Function. O que o sistema aporta é o que vale — os
 * fatos verificados do lead, os achados da auditoria e o playbook do ramo.
 *
 * O prompt é autocontido: funciona no Claude Code, no claude.ai ou em qualquer
 * lugar que aceite texto.
 */

import type { Finding, Lead } from "../lib/prospecting";
import { PLAYBOOKS, complianceFor, templateForNiche } from "./playbooks";
import type { TemplateId } from "./types";

export interface PromptLead {
  lead: Lead;
  findings: Finding[];
  /** Texto extraído do site atual, quando a auditoria conseguiu ler. */
  siteText: string | null;
  cityName: string;
}

/** Quantos leads cabem num prompt sem a resposta ficar longa demais e degradar. */
export const MAX_BATCH = 5;

const SCHEMA_SPEC = `type Copy = {
  template: "clinica" | "servico-local" | "food" | "beleza" | "juridico"

  palette: {
    primary: string   // hex #RRGGBB — fundo das faixas de destaque; texto BRANCO fica por cima
    accent:  string   // hex — botões e links; precisa contrastar com branco E com surface
    surface: string   // hex — fundo das seções claras; bem claro, quase branco
    ink:     string   // hex — texto principal sobre surface; bem escuro
  }

  tagline: string                    // até 60 caracteres, aparece acima do título
  hero: {
    headline:    string              // até 90
    subheadline: string              // até 220
    ctaPrimary:  string              // até 30, texto do botão
  }

  services: {
    title: string                    // até 80
    items: Array<{                   // de 3 a 6 itens
      name:        string            // até 60
      description: string            // até 200
    }>
  }

  about:    { title: string, body: string }   // body até 700
  proof:    { title: string, note: string }   // note até 400 — SEM NÚMERO, ver regra abaixo
  faq:      { title: string, items: Array<{ q: string, a: string }> }  // de 3 a 5; q até 120, a até 420
  location: { title: string, note: string }   // note até 300

  seo: {
    title:       string              // até 65
    description: string              // até 160
  }

  placeholders: string[]             // de 2 a 6 itens, até 60 cada

  diagnosis: {                       // NÃO vai para o site — é a munição do vendedor
    headline: string                 // até 120
    points:   string[]               // de 2 a 4, até 220 cada
  }

  outreach: {                        // NÃO vai para o site — mensagens de WhatsApp
    opener:    string                // até 420
    followups: [string, string, string]  // exatamente 3, até 420 cada
  }
}`;

const CORE_RULES = `## Regra absoluta: não invente fato sobre o negócio

Você recebe abaixo TUDO que se sabe sobre cada negócio. É pouco de propósito — foi coletado do Google Maps e de uma auditoria automática do site, sem nenhum contato com o dono.

Nunca escreva:
- preço, valor, faixa de preço, "a partir de", desconto, promoção ou condição de pagamento
- tempo de mercado ("há 15 anos", "desde 1998", "tradição de décadas")
- quantidade de clientes, pacientes, atendimentos, casos, obras ou projetos
- prêmio, certificação, título, especialização ou registro profissional
- nome de pessoa, sócio ou equipe
- depoimento de cliente, real ou ilustrativo
- horário de funcionamento, convênio aceito ou forma de pagamento
- promessa de resultado

Se um bloco pediria esse tipo de informação, escreva em volta dela e registre o que falta em \`placeholders\`. Esse campo aparece na página, aberto, como "entra com o seu material" — é honesto e vira gancho de conversa.

Este protótipo é enviado ao dono do negócio. Um dado inventado sobre a empresa dele encerra a conversa no primeiro minuto. É melhor um bloco mais curto do que um bloco preenchido com invenção.

## O que você pode usar
Só o que estiver nos dados de cada negócio: nome, ramo, bairro, cidade, e os serviços que qualquer negócio daquele ramo costuma oferecer. Descreva serviços em termos genéricos do setor, sem afirmar que aquele negócio específico os presta de um jeito particular.

## Bloco proof
Escreva apenas o texto de apoio. A nota do Google e o número de avaliações são inseridos pelo sistema, a partir do banco. Não escreva número nenhum nesse bloco.

## Tom
Português do Brasil, direto, frases curtas. Escreva para o cliente FINAL do negócio — o paciente, quem vai comer, quem vai contratar — nunca para o dono.
Fora da lista de clichês de cada ramo, evite em qualquer texto: "soluções", "excelência", "referência no mercado", "inovador", "transformamos", "seu parceiro ideal".

## Bloco diagnosis
Não aparece no site. É o que o vendedor vai dizer na conversa. Baseie nos achados da auditoria, citando o problema concreto — não generalidade sobre presença digital.

## Bloco outreach
Mensagens de WhatsApp que o vendedor envia, em primeira pessoa do singular, como quem escreve na hora.
- \`opener\`: entrega o protótipo sem pedir nada em troca. Menciona um fato verificável do negócio. Sem "espero que esteja bem", sem apresentação longa. NÃO inclua o link — o sistema anexa.
- \`followups\`: três mensagens, cada uma mais curta que a anterior. A primeira retoma um achado da auditoria. A segunda oferece uma conversa rápida. A terceira encerra educadamente e avisa que o protótipo sai do ar.`;

function playbookSection(template: TemplateId): string {
  const p = PLAYBOOKS[template];
  return `### Playbook — ${p.label} (template \`${template}\`)

**Quem lê:** ${p.audience}

**O que faz decidir:** ${p.decisionDriver}

**O que trava a decisão (a FAQ existe para responder isto):**
${p.objections.map((o) => `- ${o}`).join("\n")}

**Função de cada bloco neste ramo:**
- hero: ${p.sections.hero}
- services: ${p.sections.services}
- about: ${p.sections.about}
- proof: ${p.sections.proof}
- faq: ${p.sections.faq}
- location: ${p.sections.location}

**Cor:** ${p.palette}

**Clichês deste ramo, proibidos:**
${p.avoid.map((a) => `- ${a}`).join("\n")}

**Costuma faltar (candidatos a \`placeholders\`):** ${p.placeholderHints.join(", ")}`;
}

function complianceSection(niches: string[]): string {
  const blocks = [...new Set(niches)]
    .map((niche) => [niche, complianceFor(niche)] as const)
    .filter(([, rules]) => rules.length > 0)
    .map(([niche, rules]) => `**${niche}:**\n${rules.map((r) => `- ${r}`).join("\n")}`);

  if (blocks.length === 0) return "";

  return `## Restrições de publicidade da profissão

Estes ramos têm código de publicidade próprio. Respeite como limite de redação — o protótipo não pode afirmar nada disso. Quem confirma o enquadramento antes do site definitivo é o próprio profissional junto ao conselho dele.

${blocks.join("\n\n")}`;
}

function leadBlock(entry: PromptLead, index: number, total: number): string {
  const { lead, findings, siteText, cityName } = entry;
  const header = total > 1 ? `### Negócio ${index + 1} — id ${lead.id}` : `### O negócio`;

  const lines = [
    `- Nome: ${lead.name}`,
    `- Ramo (tipo do Google Places): ${lead.niche}`,
    `- Cidade: ${cityName}`,
    lead.neighborhood ? `- Bairro: ${lead.neighborhood}` : null,
    lead.address ? `- Endereço: ${lead.address}` : null,
    lead.rating !== null
      ? `- Reputação no Google: nota ${lead.rating} com ${lead.userRatingCount} avaliações — NÃO escreva esses números, o sistema insere`
      : `- Reputação no Google: ainda sem avaliações`,
    `- Situação da presença digital: ${lead.segment}`,
    `- Template a usar: ${templateForNiche(lead.niche)}`,
  ].filter(Boolean);

  const auditPart = findings.length
    ? `\n**Achados da auditoria do site atual:**\n${findings
        .map((f) => `- [${f.severity}] ${f.evidence}`)
        .join("\n")}`
    : `\n**Auditoria:** nenhum site encontrado para auditar.`;

  const sitePart = siteText
    ? `\n**Texto extraído do site atual** (use só para entender o que o negócio faz; não copie):\n> ${siteText.slice(0, 1800).replace(/\n/g, " ")}`
    : "";

  return `${header}\n${lines.join("\n")}\n${auditPart}${sitePart}`;
}

/**
 * Monta o prompt completo. Vários leads no mesmo prompt só são agrupados
 * quando compartilham o template — playbooks diferentes no mesmo pedido
 * diluem a orientação e a copy sai genérica.
 */
export function buildPrompt(entries: PromptLead[]): string {
  if (entries.length === 0) throw new Error("Nenhum lead selecionado.");
  if (entries.length > MAX_BATCH) {
    throw new Error(`No máximo ${MAX_BATCH} leads por prompt.`);
  }

  const templates = new Set(entries.map((e) => templateForNiche(e.lead.niche)));
  if (templates.size > 1) {
    throw new Error(
      "Os leads selecionados usam templates diferentes. Gere um prompt por template.",
    );
  }
  const template = [...templates][0];
  const many = entries.length > 1;

  const compliance = complianceSection(entries.map((e) => e.lead.niche));

  const output = many
    ? `Responda com um ARRAY JSON de ${entries.length} objetos \`Copy\`, na mesma ordem dos negócios acima, dentro de um único bloco \`\`\`json.`
    : "Responda com um único objeto JSON `Copy`, dentro de um bloco ```json.";

  return `Você vai escrever o conteúdo de ${many ? `${entries.length} protótipos de site` : "um protótipo de site"} para ${many ? "pequenos negócios brasileiros" : "um pequeno negócio brasileiro"}.

Contexto: uma agência de sites monta o protótipo ANTES de falar com o dono, e manda o link por WhatsApp. O protótipo é o argumento de venda — quem recebe é o próprio dono do negócio.

${CORE_RULES}

${playbookSection(template)}
${compliance ? `\n${compliance}\n` : ""}
## Formato da resposta

${output} Sem texto antes ou depois do bloco. Respeite os limites de caracteres — o sistema recusa o que passar.

\`\`\`ts
${SCHEMA_SPEC}
\`\`\`

## Dados

${entries.map((entry, i) => leadBlock(entry, i, entries.length)).join("\n\n")}
`;
}
