// Pontuação do lead (0–100).
//
// A ideia é ordenar a fila por quem realmente fecha, não por quem apareceu
// primeiro. Três perguntas, nesta ordem de peso:
//   1. A dor é real e visível? (segmento)
//   2. O negócio tem movimento para pagar? (volume de avaliações)
//   3. Dá para falar com ele hoje? (WhatsApp válido)
//
// A reputação entra com peso menor e invertido do esperado: nota baixa não é
// oportunidade — é um problema que site nenhum resolve.

import type { LeadSegment } from "./database.ts";

/** Dor visível, 0–40. */
const PAIN: Record<LeadSegment, number> = {
  site_quebrado: 40,   // site fora do ar é o argumento mais fácil que existe
  sem_presenca: 35,
  so_rede_social: 32,  // já entende presença digital, só não tem site
  site_obsoleto: 28,
  site_ok: 5,          // não descarta: vira upsell
  nao_auditado: 0,
};

/**
 * Volume de avaliações, 0–30. É o melhor proxy grátis de faturamento: quem
 * tem 200 avaliações atende gente todo dia. Faixas em vez de fórmula porque
 * a UI precisa explicar a nota para quem opera.
 */
const REVIEW_TIERS: [min: number, points: number][] = [
  [300, 30],
  [150, 27],
  [50, 22],
  [15, 15],
  [5, 10],
  [1, 4],
  [0, 0],
];

/** Nichos de ticket alto: o mesmo esforço de venda rende mais. */
const HIGH_TICKET = new Set([
  "dentist",
  "lawyer",
  "real_estate_agency",
  "accounting",
  "insurance_agency",
  "architect",
  "physiotherapist",
  "veterinary_care",
]);

export interface ScoreInput {
  segment: LeadSegment;
  niche: string;
  rating: number | null;
  userRatingCount: number | null;
  whatsappValid: boolean;
  hasPhone: boolean;
}

export interface ScoreBreakdown {
  total: number;
  pain: number;
  capacity: number;
  reputation: number;
  reachability: number;
  highTicket: boolean;
}

export function scoreLead(input: ScoreInput): ScoreBreakdown {
  const pain = PAIN[input.segment] ?? 0;

  const reviews = input.userRatingCount ?? 0;
  const capacity = REVIEW_TIERS.find(([min]) => reviews >= min)?.[1] ?? 0;

  let reputation: number;
  if (input.rating === null) reputation = 6;
  else if (input.rating >= 4.5) reputation = 15;
  else if (input.rating >= 4.0) reputation = 10;
  else reputation = 3;

  const reachability = input.whatsappValid ? 15 : input.hasPhone ? 5 : 0;

  const highTicket = HIGH_TICKET.has(input.niche);
  const raw = (pain + capacity + reputation + reachability) * (highTicket ? 1.15 : 1);

  return {
    total: Math.max(0, Math.min(100, Math.round(raw))),
    pain,
    capacity,
    reputation,
    reachability,
    highTicket,
  };
}
