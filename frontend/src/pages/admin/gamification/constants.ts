import type { XpAction } from "../types";
import type { StreakResult } from "./streak";

export interface Level {
  level: number;
  title: string;
  minXp: number;
}

/** Curva de nível: até o nível 8 os thresholds são fixos; depois disso, +1000 XP por nível. */
export const LEVELS: Level[] = [
  { level: 1, title: "Estagiário(a) Digital", minXp: 0 },
  { level: 2, title: "Assistente de Growth", minXp: 100 },
  { level: 3, title: "Analista de Conversão", minXp: 250 },
  { level: 4, title: "Gestor(a) de Contas", minXp: 500 },
  { level: 5, title: "Especialista em Leads", minXp: 900 },
  { level: 6, title: "Head de Operações", minXp: 1400 },
  { level: 7, title: "Sócio(a) Arkeo", minXp: 2000 },
  { level: 8, title: "Lenda Arkeo", minXp: 2800 },
];

const LAST_LEVEL_STEP = 1000;

export function levelForXp(totalXp: number): Level {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.minXp) current = lvl;
    else break;
  }
  if (totalXp < LEVELS[LEVELS.length - 1].minXp) return current;

  const last = LEVELS[LEVELS.length - 1];
  const extraLevels = Math.floor((totalXp - last.minXp) / LAST_LEVEL_STEP);
  if (extraLevels <= 0) return last;
  return {
    level: last.level + extraLevels,
    title: last.title,
    minXp: last.minXp + extraLevels * LAST_LEVEL_STEP,
  };
}

export function nextLevelThreshold(level: Level): number {
  const idx = LEVELS.findIndex((l) => l.level === level.level);
  if (idx >= 0 && idx + 1 < LEVELS.length) return LEVELS[idx + 1].minXp;
  return level.minXp + LAST_LEVEL_STEP;
}

/** Leads dominam a economia de XP — manutenção de conteúdo vale bem menos. */
export const XP_VALUES: Record<XpAction, number> = {
  lead_converted: 40,
  lead_first_response: 15,
  content_created: 8,
  lead_descartado: 5,
  content_updated: 4,
  hero_updated: 4,
  settings_updated: 3,
};

export interface AchievementContext {
  conversions: number;
  firstResponses: number;
  weekStreak: StreakResult;
  entityCounts: {
    metrics: number;
    services: number;
    process: number;
    differentials: number;
    portfolio: number;
    faq: number;
  };
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "first_response",
    title: "Primeiro Contato",
    description: "Responda seu primeiro lead novo.",
    isUnlocked: (ctx) => ctx.firstResponses >= 1,
  },
  {
    key: "first_conversion",
    title: "Primeira Conversão",
    description: "Converta seu primeiro lead em cliente.",
    isUnlocked: (ctx) => ctx.conversions >= 1,
  },
  {
    key: "ten_conversions",
    title: "Motor de Vendas",
    description: "Converta 10 leads em clientes.",
    isUnlocked: (ctx) => ctx.conversions >= 10,
  },
  {
    key: "twentyfive_conversions",
    title: "Fechador(a) Lendário(a)",
    description: "Converta 25 leads em clientes.",
    isUnlocked: (ctx) => ctx.conversions >= 25,
  },
  {
    key: "streak_4",
    title: "Constância",
    description: "Mantenha uma sequência de 4 semanas ativas.",
    isUnlocked: (ctx) =>
      ctx.weekStreak.current >= 4 || ctx.weekStreak.longest >= 4,
  },
  {
    key: "streak_12",
    title: "Disciplina de Ferro",
    description: "Mantenha uma sequência de 12 semanas ativas.",
    isUnlocked: (ctx) => ctx.weekStreak.longest >= 12,
  },
  {
    key: "site_complete",
    title: "Site Completo",
    description:
      "Tenha ao menos 1 item em métricas, serviços, processo, diferenciais, portfólio e FAQ.",
    isUnlocked: (ctx) =>
      Object.values(ctx.entityCounts).every((count) => count >= 1),
  },
  {
    key: "portfolio_curator",
    title: "Curador(a) de Portfólio",
    description: "Adicione 5 projetos ao portfólio.",
    isUnlocked: (ctx) => ctx.entityCounts.portfolio >= 5,
  },
];
