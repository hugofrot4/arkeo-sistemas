import { Award, Lock } from "lucide-react";
import { useGamification } from "./useGamification";

function AchievementsWidget() {
  const { achievements } = useGamification();
  const unlocked = achievements.filter((a) => a.unlocked);
  const nextUp = achievements.filter((a) => !a.unlocked).slice(0, 2);

  return (
    <div className="flex flex-wrap gap-2">
      {unlocked.map((a) => (
        <div
          key={a.key}
          className="border-accent/30 bg-accent/8 text-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] font-medium"
          title={a.description}
        >
          <Award size={13} aria-hidden="true" />
          {a.title}
        </div>
      ))}
      {nextUp.map((a) => (
        <div
          key={a.key}
          className="border-border text-text-muted flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[0.75rem] opacity-60"
          title={a.description}
        >
          <Lock size={12} aria-hidden="true" />
          {a.title}
        </div>
      ))}
    </div>
  );
}

export default AchievementsWidget;
