/**
 * Contrato do protótipo gerado para um lead.
 *
 * A separação entre `facts` e o resto é a defesa contra alucinação, e ela é
 * estrutural, não uma instrução no prompt: `facts` é preenchido por código a
 * partir do banco, e a IA não tem como escrever nesses campos. Repare que não
 * existe campo para preço, anos de experiência, número de clientes, prêmio ou
 * depoimento — o modelo não pode inventar o que o formato não comporta.
 *
 * O que o protótipo não tem de verdade vai em `placeholders`, mostrado
 * abertamente na página. Mandar para o dono do negócio um site com dado
 * inventado sobre a empresa dele encerra a conversa no primeiro minuto.
 */

export const TEMPLATE_IDS = [
  "clinica",
  "servico-local",
  "food",
  "beleza",
  "juridico",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** Dados verificados, vindos do banco. A IA não escreve aqui. */
export interface PrototypeFacts {
  name: string;
  niche: string;
  address: string | null;
  neighborhood: string | null;
  phoneDisplay: string | null;
  whatsapp: string | null;
  rating: number | null;
  reviewCount: number | null;
}

export interface Palette {
  /** Cor de fundo das áreas de destaque. Hex. */
  primary: string;
  /** Cor dos botões e links. Hex. */
  accent: string;
  /** Fundo das seções claras. Hex. */
  surface: string;
  /** Cor do texto principal. Hex. */
  ink: string;
}

export interface ServiceItem {
  name: string;
  description: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** Tudo isto é escrito pelo modelo. */
export interface PrototypeCopy {
  template: TemplateId;
  palette: Palette;
  tagline: string;
  hero: {
    headline: string;
    subheadline: string;
    ctaPrimary: string;
  };
  services: { title: string; items: ServiceItem[] };
  about: { title: string; body: string };
  /** Nota sobre reputação. A nota e a contagem vêm de `facts`, não daqui. */
  proof: { title: string; note: string };
  faq: { title: string; items: FaqItem[] };
  location: { title: string; note: string };
  seo: { title: string; description: string };
  /** O que o site definitivo precisa e o protótipo não tem. Aparece na página. */
  placeholders: string[];
  /** Munição do pitch. Não é renderizado no site do lead. */
  diagnosis: { headline: string; points: string[] };
  /** Mensagens de abordagem. Também não é renderizado. */
  outreach: { opener: string; followups: string[] };
}

export interface PrototypeContent extends PrototypeCopy {
  facts: PrototypeFacts;
}

export interface TemplateProps {
  content: PrototypeContent;
}
