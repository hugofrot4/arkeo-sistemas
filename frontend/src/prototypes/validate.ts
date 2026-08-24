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

/**
 * As 4 mensagens do `abordagem.txt`, separadas por uma linha com `---`.
 *
 * O endereço do protótipo entra como `{{link}}` no texto: o slug só é gerado
 * na publicação, então não há como escrevê-lo antes.
 */
export function parseAbordagem(
  texto: string,
  canal: "whatsapp" | "email" = "whatsapp",
): {
  messages: string[];
  emailMessages: (string | null)[];
  subjects: (string | null)[];
  errors: string[];
  warnings: string[];
} {
  // O arquivo pode trazer as duas redações: os quatro blocos de WhatsApp e,
  // depois de uma linha `=== E-MAIL ===`, os quatro de e-mail. As sequências
  // estão deslocadas de um toque — em e-mail a entrega vai no 1, no WhatsApp
  // no 2 —, então não são a mesma frase em dois tamanhos: precisam ser
  // escritas separadamente. Sem a segunda parte o card cai no texto de
  // WhatsApp e avisa.
  const [parteWa, parteEmail] = texto.split(/^\s*={3,}\s*E-?MAIL\s*={3,}\s*$/im);

  const separar = (t: string) =>
    t
      .split(/^\s*---\s*$/m)
      .map((bloco) => bloco.trim())
      .filter(Boolean);

  const blocos = separar(parteWa ?? "");

  // Um bloco pode abrir com "Assunto: ..." numa linha só. Serve ao canal
  // e-mail; no WhatsApp a linha é ignorada, então a mesma abordagem atende os
  // dois canais sem o autor precisar escrever duas versões.
  const subjects: (string | null)[] = [];
  const messages = blocos.map((bloco) => {
    const m = bloco.match(/^\s*assunto:\s*(.+?)\s*\n+([\s\S]*)$/i);
    if (m) {
      subjects.push(m[1].trim());
      return m[2].trim();
    }
    subjects.push(null);
    return bloco;
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  // A linha `Assunto:` só importa nos blocos de e-mail: é o canal que a usa.
  const emailMessages: (string | null)[] = [null, null, null, null];
  if (parteEmail !== undefined) {
    separar(parteEmail).forEach((bloco, i) => {
      if (i > 3) return;
      const m = bloco.match(/^\s*assunto:\s*(.+?)\s*\n+([\s\S]*)$/i);
      if (m) {
        subjects[i] = m[1].trim();
        emailMessages[i] = m[2].trim();
      } else {
        emailMessages[i] = bloco;
      }
    });
    const n = emailMessages.filter(Boolean).length;
    if (n !== 4) {
      errors.push(
        `A parte de e-mail tem ${n} mensagem(ns) — esperava 4, separadas por "---".`,
      );
    }
    // Em e-mail a entrega vai no toque 1: link ali é esperado e não custa
    // reputação, ao contrário do WhatsApp.
    if (emailMessages[0] && !emailMessages[0].includes("{{link}}")) {
      warnings.push(
        "A primeira mensagem de e-mail não tem {{link}}. É ela que entrega o " +
          "protótipo nesse canal — o endereço vai ser colado no fim dela.",
      );
    }
  } else {
    warnings.push(
      'Sem a parte "=== E-MAIL ===". Se o canal do toque virar e-mail, o card ' +
        "vai usar o texto de WhatsApp, que tem outro tamanho e outro tom.",
    );
  }

  // Duas saudações no mesmo bloco significam dois textos colados sem revisão —
  // aconteceu ao fundir o cutucão com o pedido de conversa, e passou até o
  // operador ler a mensagem na fila, prestes a mandar.
  const saudacao = /(^|\n)\s*(oi|olá|ola|bom dia|boa tarde|boa noite)\b/gi;
  [...messages, ...emailMessages].forEach((m, i) => {
    if (!m) return;
    const n = (m.match(saudacao) ?? []).length;
    if (n > 1) {
      const onde = i < 4 ? `${i + 1} de WhatsApp` : `${i - 3} de e-mail`;
      errors.push(`A mensagem ${onde} abre duas vezes — tem ${n} saudações.`);
    }
  });

  // O sistema abre uma conversa nova a cada toque, não responde à anterior, e
  // o canal pode ter mudado no caminho. Quem lê o toque 3 pode nunca ter lido
  // o 1: sem identificação, é um estranho cobrando resposta.
  [2, 3].forEach((i) => {
    const m = messages[i];
    if (m && !/\barkeo\b/i.test(m)) {
      warnings.push(
        `A mensagem ${i + 1} de WhatsApp não diz quem está falando. Cada toque ` +
          "pode ser o primeiro que a pessoa lê — o canal muda no meio da sequência.",
      );
    }
  });

  if (messages.length !== 4) {
    errors.push(
      `Esperava 4 mensagens separadas por uma linha com "---", encontrei ${messages.length}.`,
    );
  }
  const longa = messages.findIndex((m) => m.length > 900);
  if (longa >= 0) errors.push(`A mensagem ${longa + 1} tem mais de 900 caracteres.`);

  // Em que mensagem o link entra depende do canal. Em e-mail é a primeira: ali
  // link é esperado. No WhatsApp é a segunda — a primeira é fria, e mensagem
  // fria com link para quem não tem você nos contatos é o padrão que restringiu
  // o número da Arkeo, mesmo com menos de vinte envios por dia.
  const indiceDoLink = canal === "whatsapp" ? 1 : 0;
  const comLink = messages
    .map((m, i) => (m.includes("{{link}}") ? i : -1))
    .filter((i) => i >= 0);

  if (canal === "whatsapp" && comLink.includes(0)) {
    errors.push(
      "A primeira mensagem tem o marcador {{link}}, e no WhatsApp ela não pode " +
        "levar link: é a mensagem fria, e é esse padrão que faz a plataforma " +
        "restringir o número. Mova o {{link}} para a segunda.",
    );
  }
  if (messages.length > indiceDoLink && !comLink.includes(indiceDoLink)) {
    warnings.push(
      `A mensagem ${indiceDoLink + 1} não tem o marcador {{link}} — é ela que ` +
        `entrega o protótipo neste canal. O endereço vai ser colado no fim dela; ` +
        `se preferir no meio da frase, escreva {{link}} onde quiser.`,
    );
  }
  const repetido = comLink.filter((i) => i !== indiceDoLink && i !== 0);
  if (repetido.length > 0) {
    warnings.push(
      `A mensagem ${repetido[0] + 1} também repete o link. Repetir em todo toque soa automatizado.`,
    );
  }

  const semAssunto = subjects.filter((a) => !a).length;
  if (semAssunto > 0 && semAssunto < subjects.length) {
    warnings.push(
      `${semAssunto} mensagem(ns) sem linha "Assunto:". No canal e-mail elas caem num assunto genérico.`,
    );
  }

  return { messages, emailMessages, subjects, errors, warnings };
}
