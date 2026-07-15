import { Star } from "lucide-react";
import { useGamification } from "./useGamification";

interface LevelBadgeProps {
  compact?: boolean;
}

function LevelBadge({ compact }: LevelBadgeProps) {
  const { level, levelTitle, xpIntoLevel, xpForNextLevel, progressPct } =
    useGamification();

  if (compact) {
    return (
      <div
        className="border-border bg-surface text-text-muted flex items-center gap-1.5 rounded-full border px-2.75 py-1.25 text-[0.72rem] font-semibold"
        title={`${levelTitle} — ${xpIntoLevel}/${xpForNextLevel} XP`}
      >
        <Star size={12} className="text-accent" aria-hidden="true" />
        Nv. {level}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="border-border bg-accent/10 text-accent font-family-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[1.1rem] font-bold">
        {level}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-text truncate text-[0.875rem] font-semibold">
            {levelTitle}
          </span>
          <span className="text-text-muted shrink-0 text-[0.72rem]">
            {xpIntoLevel} / {xpForNextLevel} XP
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="bg-accent h-full rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default LevelBadge;
