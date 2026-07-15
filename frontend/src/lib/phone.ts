function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Máscara de celular/fixo brasileiro sem DDI: "(11) 99999-9999" / "(11) 9999-9999". */
export function formatBrPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return "";

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `(${ddd}`;

  const num = digits.slice(2);
  if (num.length <= 4) return `(${ddd}) ${num}`;
  if (digits.length <= 10) return `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
  return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
}

/** Máscara de celular/fixo brasileiro com DDI: "+55 11 99999-9999" / "+55 11 9999-9999". */
export function formatBrPhoneWithCountryCode(value: string): string {
  let digits = onlyDigits(value);
  if (digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length === 0) return "";

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `+55 ${ddd}`;

  const num = digits.slice(2);
  if (num.length <= 4) return `+55 ${ddd} ${num}`;
  if (digits.length <= 10) return `+55 ${ddd} ${num.slice(0, 4)}-${num.slice(4)}`;
  return `+55 ${ddd} ${num.slice(0, 5)}-${num.slice(5)}`;
}
