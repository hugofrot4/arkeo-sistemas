/**
 * Validação de celular brasileiro para WhatsApp.
 *
 * Espelho de `supabase/functions/_shared/phone.ts`, que roda no Deno e não é
 * importável daqui. São duas cópias de uma função pura em runtimes
 * diferentes — se mudar a regra num lado, mude no outro.
 *
 * No servidor isto classifica o telefone que vem do Google. Aqui serve para
 * dar retorno imediato enquanto o admin corrige o número à mão.
 */

const DDD_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export interface TelefoneBr {
  /** "+5585987654321" — só quando é celular válido. */
  e164: string | null;
  isMobile: boolean;
  /** Por que não serve, quando não serve. */
  motivo: string | null;
}

export function parseTelefoneBr(bruto: string | null | undefined): TelefoneBr {
  if (!bruto?.trim()) return { e164: null, isMobile: false, motivo: null };

  let digitos = bruto.replace(/\D/g, "");
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) {
    return { e164: null, isMobile: false, motivo: "Precisa ter DDD + 8 ou 9 dígitos." };
  }

  const ddd = Number(digitos.slice(0, 2));
  if (!DDD_VALIDOS.has(ddd)) {
    return { e164: null, isMobile: false, motivo: `DDD ${digitos.slice(0, 2)} não existe.` };
  }

  let assinante = digitos.slice(2);

  if (assinante.length === 9) {
    if (assinante[0] !== "9") {
      return { e164: null, isMobile: false, motivo: "Celular de 9 dígitos começa com 9." };
    }
    return { e164: `+55${ddd}${assinante}`, isMobile: true, motivo: null };
  }

  // 8 dígitos: 2–5 é fixo; 6–9 é celular antigo, anterior ao nono dígito.
  const primeiro = assinante[0];
  if (primeiro >= "2" && primeiro <= "5") {
    return { e164: null, isMobile: false, motivo: "É telefone fixo — não tem WhatsApp." };
  }
  if (primeiro >= "6" && primeiro <= "9") {
    assinante = `9${assinante}`;
    return { e164: `+55${ddd}${assinante}`, isMobile: true, motivo: null };
  }
  return { e164: null, isMobile: false, motivo: "Número não reconhecido." };
}

/** Máscara para exibição: "(85) 98765-4321". */
export function formatarTelefoneBr(bruto: string): string {
  const d = bruto.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
