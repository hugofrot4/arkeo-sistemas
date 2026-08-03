import type { MessageItem, MessageStatus, ProspectStatus } from "./types";

export function str(value: string | number | undefined): string {
  return value == null ? "" : String(value);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatRelative(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function getLast7DaysLeadCounts(messages: MessageItem[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), day: WEEKDAY_LABELS[d.getDay()], value: 0 };
  });

  messages.forEach((m) => {
    const key = dayKey(new Date(m.date));
    const bucket = days.find((d) => d.key === key);
    if (bucket) bucket.value++;
  });

  return days.map(({ day, value }) => ({ day, value }));
}

export const statusMeta: Record<
  MessageStatus,
  { label: string; className: string }
> = {
  novo: { label: "Novo", className: "text-accent bg-accent/12" },
  contato: { label: "Em contato", className: "text-warning bg-warning/12" },
  convertido: { label: "Convertido", className: "text-good bg-good/12" },
  descartado: {
    label: "Descartado",
    className: "text-text-muted bg-text-muted/12",
  },
};

export const prospectStatusMeta: Record<
  ProspectStatus,
  { label: string; className: string }
> = {
  novo: { label: "Novo", className: "text-accent bg-accent/12" },
  contatado_whatsapp: {
    label: "Contatado",
    className: "text-warning bg-warning/12",
  },
  respondeu: { label: "Respondeu", className: "text-warning bg-warning/12" },
  convertido: { label: "Convertido", className: "text-good bg-good/12" },
  nao_contatar: {
    label: "Não contatar",
    className: "text-danger bg-danger/12",
  },
  descartado: {
    label: "Descartado",
    className: "text-text-muted bg-text-muted/12",
  },
};

/** Normaliza telefone (formato "national" do Google Places, sem DDI) para o formato exigido pelo link wa.me. */
export function normalizePhoneForWa(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

/** Substitui placeholders `{{chave}}` do template pela mensagem final. */
export function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}
