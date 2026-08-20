import type { LeadSegment, LeadStage, LostReason } from "../../../../lib/prospecting";

/**
 * Rótulos e cores da prospecção. O segmento e o estágio são a linguagem da
 * operação, então valem uma fonte única — a v1 espalhava esses textos entre a
 * view e o utils.
 */

export const SEGMENT_META: Record<LeadSegment, { label: string; hint: string; className: string }> = {
  site_quebrado: {
    label: "Site fora do ar",
    hint: "O endereço não abre ou responde com erro.",
    className: "bg-danger/15 text-danger",
  },
  sem_presenca: {
    label: "Sem presença",
    hint: "Nem site nem página em rede social.",
    className: "bg-warning/15 text-warning",
  },
  so_rede_social: {
    label: "Só rede social",
    hint: "Tem Instagram ou Facebook, não tem site.",
    className: "bg-accent/15 text-accent",
  },
  site_obsoleto: {
    label: "Site obsoleto",
    hint: "Não abre bem no celular, sem HTTPS ou parado há anos.",
    className: "bg-warning/15 text-warning",
  },
  site_ok: {
    label: "Site em dia",
    hint: "Passou na auditoria. Vale como upsell, não como prioridade.",
    className: "bg-good/15 text-good",
  },
  nao_auditado: {
    label: "Não auditado",
    hint: "A auditoria ainda não rodou para este lead.",
    className: "bg-text-muted/12 text-text-muted",
  },
};

export const STAGE_ORDER: LeadStage[] = [
  "novo",
  "qualificado",
  "prototipo_pronto",
  "contatado",
  "visualizou",
  "em_conversa",
  "proposta",
  "ganho",
  "perdido",
];

export const STAGE_META: Record<LeadStage, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-text-muted/12 text-text-muted" },
  qualificado: { label: "Qualificado", className: "bg-accent/12 text-accent" },
  prototipo_pronto: { label: "Protótipo pronto", className: "bg-accent/18 text-accent" },
  contatado: { label: "Contatado", className: "bg-warning/15 text-warning" },
  visualizou: { label: "Abriu o protótipo", className: "bg-good/18 text-good" },
  em_conversa: { label: "Em conversa", className: "bg-good/15 text-good" },
  proposta: { label: "Proposta", className: "bg-good/22 text-good" },
  ganho: { label: "Ganho", className: "bg-good/25 text-good" },
  perdido: { label: "Perdido", className: "bg-danger/12 text-danger" },
};

export const LOST_REASONS: { value: LostReason; label: string }[] = [
  { value: "sem_interesse", label: "Sem interesse" },
  { value: "tem_agencia", label: "Já tem agência" },
  { value: "sem_verba", label: "Sem verba" },
  { value: "sem_resposta", label: "Não respondeu" },
  { value: "numero_errado", label: "Número errado" },
  { value: "outro", label: "Outro" },
];

/** Nomes dos tipos da Places API em português — o admin não deve ler "veterinary_care". */
export const NICHE_LABELS: Record<string, string> = {
  dentist: "Dentista",
  lawyer: "Advocacia",
  real_estate_agency: "Imobiliária",
  physiotherapist: "Fisioterapia",
  accounting: "Contabilidade",
  veterinary_care: "Veterinária",
  architect: "Arquitetura",
  insurance_agency: "Seguros",
  gym: "Academia",
  beauty_salon: "Salão de beleza",
  hair_salon: "Cabeleireiro",
  spa: "Spa",
  car_repair: "Oficina",
  restaurant: "Restaurante",
  pet_store: "Pet shop",
};

export function nicheLabel(niche: string) {
  return NICHE_LABELS[niche] ?? niche;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ontem" : `há ${days} dias`;
}
