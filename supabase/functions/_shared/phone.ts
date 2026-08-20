// Validação de telefone brasileiro para WhatsApp.
//
// A v1 fazia `digits.length <= 11 ? "55" + digits : digits`, então um fixo de
// 10 dígitos como (85) 3333-3333 virava wa.me/5585333333 — um link para um
// número que não existe. Aqui fixo é reconhecido como fixo e simplesmente não
// gera link.
//
// A validação vive só aqui de propósito: o resultado é gravado em
// `leads.phone_e164` / `leads.whatsapp_valid`, e o frontend lê a coluna em vez
// de repetir a regra.

const VALID_DDD = new Set([
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

export interface BrPhone {
  /** "+5585987654321" — só quando o número é celular válido. */
  e164: string | null;
  isMobile: boolean;
}

export function parseBrPhone(raw: string | null | undefined): BrPhone {
  const miss: BrPhone = { e164: null, isMobile: false };
  if (!raw) return miss;

  let digits = raw.replace(/\D/g, "");
  // O Places devolve `nationalPhoneNumber` sem DDI, mas dado migrado da v1
  // pode já vir com 55 na frente.
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  if (digits.length !== 10 && digits.length !== 11) return miss;

  const ddd = Number(digits.slice(0, 2));
  if (!VALID_DDD.has(ddd)) return miss;

  let subscriber = digits.slice(2);

  // Celular atual: 9 dígitos começando em 9.
  if (subscriber.length === 9) {
    if (subscriber[0] !== "9") return miss;
    return { e164: `+55${ddd}${subscriber}`, isMobile: true };
  }

  // 8 dígitos: 2–5 é fixo; 6–9 é celular antigo, anterior ao nono dígito.
  const first = subscriber[0];
  if (first >= "2" && first <= "5") return miss;
  if (first >= "6" && first <= "9") {
    subscriber = `9${subscriber}`;
    return { e164: `+55${ddd}${subscriber}`, isMobile: true };
  }
  return miss;
}
