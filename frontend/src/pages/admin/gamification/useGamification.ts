import { useMemo } from "react";
import { useAdmin } from "../context";
import {
  ACHIEVEMENTS,
  levelForXp,
  nextLevelThreshold,
  type AchievementContext,
  type AchievementDef,
} from "./constants";
import { computeWeeklyStreak, type StreakResult } from "./streak";

export interface AchievementStatus extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface GamificationInfo {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  weekStreak: StreakResult;
  achievements: AchievementStatus[];
}

export function useGamification(): GamificationInfo {
  const { state } = useAdmin();

  return useMemo(() => {
    const totalXp = state.xpEvents.reduce((sum, e) => sum + e.xp, 0);
    const level = levelForXp(totalXp);
    const nextThreshold = nextLevelThreshold(level);
    const xpIntoLevel = totalXp - level.minXp;
    const xpForNextLevel = nextThreshold - level.minXp;
    const progressPct = xpForNextLevel > 0
      ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))
      : 100;

    const weekStreak = computeWeeklyStreak(state.xpEvents);

    const ctx: AchievementContext = {
      conversions: state.xpEvents.filter((e) => e.action === "lead_converted")
        .length,
      firstResponses: state.xpEvents.filter(
        (e) => e.action === "lead_first_response",
      ).length,
      weekStreak,
      entityCounts: {
        metrics: state.metrics.length,
        services: state.services.length,
        process: state.process.length,
        differentials: state.differentials.length,
        portfolio: state.portfolio.length,
        faq: state.faq.length,
      },
    };

    const unlockedMap = new Map(
      state.achievementsUnlocked.map((a) => [a.key, a.unlockedAt]),
    );
    const achievements: AchievementStatus[] = ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: unlockedMap.has(def.key) || def.isUnlocked(ctx),
      unlockedAt: unlockedMap.get(def.key) ?? null,
    }));

    return {
      totalXp,
      level: level.level,
      levelTitle: level.title,
      xpIntoLevel,
      xpForNextLevel,
      progressPct,
      weekStreak,
      achievements,
    };
  }, [
    state.xpEvents,
    state.achievementsUnlocked,
    state.metrics,
    state.services,
    state.process,
    state.differentials,
    state.portfolio,
    state.faq,
  ]);
}
