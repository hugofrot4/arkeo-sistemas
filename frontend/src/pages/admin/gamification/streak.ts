const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Segunda-feira (00:00 UTC) da semana que contém `date`. */
function startOfWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayFromMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayFromMonday);
  return d;
}

/** Chave estável por semana (segunda-feira em ISO date), única por semana civil. */
export function getIsoWeekKey(date: Date): string {
  return startOfWeek(date).toISOString().slice(0, 10);
}

export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * Streak semanal: conta semanas consecutivas com pelo menos 1 evento de XP.
 * `current` zera se a última semana ativa foi antes da semana passada (sem
 * grace period diário — streak é semanal por design, ver plano de gamificação).
 */
export function computeWeeklyStreak(
  xpEvents: { createdAt: string }[],
  now: Date = new Date(),
): StreakResult {
  if (xpEvents.length === 0) return { current: 0, longest: 0 };

  const weekIndexes = Array.from(
    new Set(
      xpEvents.map((ev) =>
        Math.round(startOfWeek(new Date(ev.createdAt)).getTime() / MS_PER_WEEK),
      ),
    ),
  ).sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < weekIndexes.length; i++) {
    run = weekIndexes[i] === weekIndexes[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const nowWeekIndex = Math.round(startOfWeek(now).getTime() / MS_PER_WEEK);
  const lastWeekIndex = weekIndexes[weekIndexes.length - 1];
  if (lastWeekIndex < nowWeekIndex - 1) {
    return { current: 0, longest };
  }

  let current = 1;
  for (let i = weekIndexes.length - 1; i > 0; i--) {
    if (weekIndexes[i] === weekIndexes[i - 1] + 1) current += 1;
    else break;
  }
  return { current, longest };
}
