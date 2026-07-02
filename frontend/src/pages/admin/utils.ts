import type { MessageStatus } from "./types";

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
