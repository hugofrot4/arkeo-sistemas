/**
 * Conferência do index.html enviado antes de publicar.
 *
 * A página é servida dentro de um iframe isolado (origem opaca, sem
 * `allow-same-origin`), então parte das regras não é preferência de estilo —
 * é o que funciona ou não no destino. Recurso externo não carrega,
 * `localStorage` lança exceção, e `<form>` não submete.
 *
 * Separado em erro e aviso de propósito: como agora o conteúdo pode ser
 * reaproveitado do site atual do próprio negócio, um preço na página pode ser
 * legítimo. Quem decide isso é você, que já viu o protótipo no navegador —
 * o aviso serve para você olhar de novo, não para barrar.
 */

/** O banco recusa acima disto; a skill mira em 400 KB. */
const MAX_BYTES = 800_000;
const ALERTA_BYTES = 400_000;

const HOSTS_PERMITIDOS = ["fonts.googleapis.com", "fonts.gstatic.com"];

export interface HtmlValidation {
  errors: string[];
  warnings: string[];
  title: string | null;
  bytes: number;
}

function subrecursosExternos(html: string): string[] {
  const encontrados = new Set<string>();
  // Só subrecursos: link para Instagram ou wa.me é normal e não quebra nada.
  const padroes = [
    /<script[^>]+src=["'](https?:\/\/[^"']+)["']/gi,
    /<link[^>]+rel=["']stylesheet["'][^>]*href=["'](https?:\/\/[^"']+)["']/gi,
    /<link[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*rel=["']stylesheet["']/gi,
  ];
  for (const padrao of padroes) {
    for (const match of html.matchAll(padrao)) {
      try {
        const host = new URL(match[1]).hostname.replace(/^www\./, "");
        if (!HOSTS_PERMITIDOS.includes(host)) encontrados.add(host);
      } catch {
        encontrados.add(match[1].slice(0, 60));
      }
    }
  }
  return [...encontrados];
}

function imagensExternas(html: string): string[] {
  const hosts = new Set<string>();
  for (const match of html.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi)) {
    try {
      hosts.add(new URL(match[1]).hostname.replace(/^www\./, ""));
    } catch {
      /* URL inválida cai no erro de subrecurso, se for o caso */
    }
  }
  return [...hosts];
}

/** Padrões que costumam indicar dado inventado. Aviso, não bloqueio. */
const SUSPEITAS: [RegExp, string][] = [
  [/R\$\s?\d/, "preço em reais"],
  [/\b\d{1,3}\s*(anos|décadas)\s+(de\s+)?(experiência|mercado|atuação|tradição)/i, "tempo de mercado"],
  [/\bdesde\s+(19|20)\d{2}\b/i, "ano de fundação"],
  [/\b(mais de|\+)\s*\d{2,}\s*(clientes|pacientes|atendimentos|casos)/i, "quantidade de clientes"],
  [/\b(garantimos|resultado garantido|garantia de resultado)\b/i, "promessa de resultado"],
  [/\bantes e depois\b/i, "antes e depois"],
  [/lorem ipsum/i, "lorem ipsum"],
];

export function validateHtml(html: string): HtmlValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const bytes = new TextEncoder().encode(html).length;

  if (!html.trim()) {
    return { errors: ["O arquivo está vazio."], warnings, title: null, bytes: 0 };
  }
  if (bytes > MAX_BYTES) {
    errors.push(
      `O arquivo tem ${Math.round(bytes / 1024)} KB e o limite é ${MAX_BYTES / 1024} KB. ` +
        "Quase sempre é uma imagem em data: URI grande demais.",
    );
  } else if (bytes > ALERTA_BYTES) {
    warnings.push(
      `${Math.round(bytes / 1024)} KB — acima dos 400 KB recomendados. Vai demorar a abrir no celular.`,
    );
  }

  if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) {
    errors.push("Não parece um HTML completo: faltou <html> ou <body>.");
  }
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    errors.push("Falta a meta viewport — a página abriria em versão de computador no celular.");
  }

  const externos = subrecursosExternos(html);
  if (externos.length > 0) {
    errors.push(
      `Carrega recurso externo de ${externos.join(", ")}. Dentro do iframe isso não carrega ` +
        "e a página quebra. Só Google Fonts é permitido — o resto tem que estar embutido.",
    );
  }

  if (/\b(localStorage|sessionStorage)\b/.test(html)) {
    errors.push(
      "Usa localStorage ou sessionStorage. No iframe isolado o acesso lança exceção e o script para.",
    );
  }
  if (/<form[^>]+action=/i.test(html)) {
    errors.push("Tem um <form> que submete. O envio é bloqueado no iframe — o CTA precisa ser um link wa.me.");
  }

  const externasImg = imagensExternas(html);
  if (externasImg.length > 0) {
    warnings.push(
      `Imagens vindas de ${externasImg.join(", ")}. Funcionam, mas somem se o site de origem sair do ar. ` +
        "O extrator já baixa e converte para data: URI.",
    );
  }

  const title = html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1]?.trim() || null;
  if (!title) warnings.push("Sem <title> — a aba do navegador vai mostrar a URL.");

  if (!/wa\.me|href=["']tel:/i.test(html)) {
    warnings.push("Não achei link de WhatsApp nem telefone clicável. O protótipo sem CTA não converte.");
  }

  const suspeitas = SUSPEITAS.filter(([padrao]) => padrao.test(html)).map(([, rotulo]) => rotulo);
  if (suspeitas.length > 0) {
    warnings.push(
      `A página menciona ${suspeitas.join(", ")}. Se veio do site atual do negócio, tudo bem. ` +
        "Se não, o dono vai reconhecer o dado falso — confira antes de enviar.",
    );
  }

  return { errors, warnings, title, bytes };
}

/** As 4 mensagens do `abordagem.txt`, separadas por uma linha com `---`. */
export function parseAbordagem(texto: string): { messages: string[]; errors: string[] } {
  const messages = texto
    .split(/^\s*---\s*$/m)
    .map((bloco) => bloco.trim())
    .filter(Boolean);

  const errors: string[] = [];
  if (messages.length !== 4) {
    errors.push(
      `Esperava 4 mensagens separadas por uma linha com "---", encontrei ${messages.length}.`,
    );
  }
  const longa = messages.findIndex((m) => m.length > 900);
  if (longa >= 0) errors.push(`A mensagem ${longa + 1} tem mais de 900 caracteres.`);

  return { messages, errors };
}
