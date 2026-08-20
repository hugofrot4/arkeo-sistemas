/**
 * Validação do JSON colado de volta do Claude Code.
 *
 * Escrito à mão, sem biblioteca de schema, por dois motivos: as mensagens
 * saem em português apontando o campo exato ("services.items precisa de 3 a 6
 * itens, veio 2"), que é o que se lê às pressas ao colar; e o mesmo código
 * guarda a página pública em /p/:slug, onde um conteúdo malformado apareceria
 * quebrado na frente do prospect.
 */

import { TEMPLATE_IDS } from "./types";
import type { PrototypeContent, PrototypeCopy, TemplateId } from "./types";

type Check = (value: unknown, path: string, errors: string[]) => void;

const HEX = /^#[0-9a-fA-F]{6}$/;

function str(max: number, min = 1): Check {
  return (value, path, errors) => {
    if (typeof value !== "string") {
      errors.push(`${path}: precisa ser texto.`);
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length < min) errors.push(`${path}: está vazio.`);
    // Limite de caractere não é capricho: o template quebra o layout se o
    // título ocupar três linhas onde cabia uma.
    else if (trimmed.length > max) {
      errors.push(`${path}: ${trimmed.length} caracteres, o limite é ${max}.`);
    }
  };
}

const hex: Check = (value, path, errors) => {
  if (typeof value !== "string" || !HEX.test(value)) {
    errors.push(`${path}: precisa ser cor em hex no formato #RRGGBB (veio ${JSON.stringify(value)}).`);
  }
};

function obj(shape: Record<string, Check>): Check {
  return (value, path, errors) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${path}: faltou ou não é um objeto.`);
      return;
    }
    const record = value as Record<string, unknown>;
    for (const [key, check] of Object.entries(shape)) {
      check(record[key], path ? `${path}.${key}` : key, errors);
    }
  };
}

function arr(min: number, max: number, item: Check): Check {
  return (value, path, errors) => {
    if (!Array.isArray(value)) {
      errors.push(`${path}: precisa ser uma lista.`);
      return;
    }
    if (value.length < min || value.length > max) {
      const range = min === max ? `${min}` : `de ${min} a ${max}`;
      errors.push(`${path}: precisa ${min === max ? "de " : ""}${range} itens, veio ${value.length}.`);
      return;
    }
    value.forEach((entry, i) => item(entry, `${path}[${i}]`, errors));
  };
}

const oneOf = (options: readonly string[]): Check => (value, path, errors) => {
  if (typeof value !== "string" || !options.includes(value)) {
    errors.push(`${path}: precisa ser um de ${options.join(", ")} (veio ${JSON.stringify(value)}).`);
  }
};

const COPY_SHAPE: Record<string, Check> = {
  template: oneOf(TEMPLATE_IDS),
  palette: obj({ primary: hex, accent: hex, surface: hex, ink: hex }),
  tagline: str(60),
  hero: obj({ headline: str(90), subheadline: str(220), ctaPrimary: str(30) }),
  services: obj({
    title: str(80),
    items: arr(3, 6, obj({ name: str(60), description: str(200) })),
  }),
  about: obj({ title: str(80), body: str(700) }),
  proof: obj({ title: str(80), note: str(400) }),
  faq: obj({ title: str(80), items: arr(3, 5, obj({ q: str(120), a: str(420) })) }),
  location: obj({ title: str(80), note: str(300) }),
  seo: obj({ title: str(65), description: str(160) }),
  placeholders: arr(2, 6, str(60)),
  diagnosis: obj({ headline: str(120), points: arr(2, 4, str(220)) }),
  outreach: obj({ opener: str(420), followups: arr(3, 3, str(420)) }),
};

const checkCopy = obj(COPY_SHAPE);

/**
 * Rede de segurança contra invenção, do mesmo jeito que rodava no servidor.
 * O prompt já proíbe, mas instrução em linguagem natural falha de vez em
 * quando e isto aqui é determinístico.
 */
const FORBIDDEN: [RegExp, string][] = [
  [/R\$\s?\d/, "preço em reais"],
  [/\b\d{1,3}\s*(anos|décadas)\s+(de\s+)?(experiência|mercado|atuação|tradição)/i, "tempo de mercado"],
  [/\bdesde\s+(19|20)\d{2}\b/i, "ano de fundação"],
  [/\b(mais de|\+)\s*\d{2,}\s*(clientes|pacientes|atendimentos|casos|obras|projetos)/i, "quantidade de clientes"],
  [/\b(prêmio|premiad[ao]|certificad[ao])\b/i, "prêmio ou certificação"],
  [/\b(garantimos|garantia de resultado|resultado garantido)\b/i, "promessa de resultado"],
  [/\bantes e depois\b/i, "antes e depois"],
];

export function findFabrications(copy: unknown): string[] {
  const haystack = JSON.stringify(copy);
  return FORBIDDEN.filter(([pattern]) => pattern.test(haystack)).map(([, label]) => label);
}

export interface CopyValidation {
  copy: PrototypeCopy | null;
  errors: string[];
}

export function validateCopy(value: unknown, label = "conteúdo"): CopyValidation {
  const errors: string[] = [];
  checkCopy(value, "", errors);

  // Roda sempre, mesmo com erro de estrutura: um campo faltando é chateação,
  // um dado inventado sobre a empresa da pessoa é o que encerra a conversa.
  // Deixar o segundo escondido atrás do primeiro seria o pior dos dois.
  const fabrications = findFabrications(value);
  if (fabrications.length > 0) {
    errors.unshift(
      `${label}: o texto inventou ${fabrications.join(", ")}. ` +
        "Peça para reescrever sem isso — o dono do negócio vai reconhecer o dado falso.",
    );
  }

  return { copy: errors.length === 0 ? (value as PrototypeCopy) : null, errors };
}

/**
 * Extrai o JSON da resposta. Aceita bloco cercado com ```json, bloco sem
 * linguagem, ou JSON puro — o modelo varia e não vale forçar o operador a
 * limpar o texto na mão.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Cole a resposta do Claude Code aqui.");

  const fenced = trimmed.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error(
      "Não consegui ler o JSON. Cole a resposta inteira, incluindo o bloco ```json.",
    );
  }
}

export interface ParsedResponse {
  copies: PrototypeCopy[];
  errors: string[];
}

/** Aceita um objeto ou um array — o prompt em lote devolve array. */
export function parseCopyResponse(text: string, expected: number): ParsedResponse {
  const parsed = extractJson(text);
  const list = Array.isArray(parsed) ? parsed : [parsed];

  if (list.length !== expected) {
    return {
      copies: [],
      errors: [
        `Vieram ${list.length} resultado(s) e eram esperados ${expected}. ` +
          "Confira se a resposta está completa.",
      ],
    };
  }

  const copies: PrototypeCopy[] = [];
  const errors: string[] = [];
  list.forEach((entry, i) => {
    const label = expected > 1 ? `Negócio ${i + 1}` : "Conteúdo";
    const result = validateCopy(entry, label);
    if (result.copy) copies.push(result.copy);
    else errors.push(...result.errors.map((e) => (e.startsWith(label) ? e : `${label} — ${e}`)));
  });

  return { copies: errors.length === 0 ? copies : [], errors };
}

/** Guarda da página pública: o jsonb do banco tem `facts` além da copy. */
export function isPrototypeContent(value: unknown): value is PrototypeContent {
  const errors: string[] = [];
  checkCopy(value, "", errors);
  if (errors.length > 0) return false;

  const facts = (value as Record<string, unknown>).facts;
  return (
    !!facts &&
    typeof facts === "object" &&
    typeof (facts as Record<string, unknown>).name === "string"
  );
}

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (TEMPLATE_IDS as readonly string[]).includes(value);
}
