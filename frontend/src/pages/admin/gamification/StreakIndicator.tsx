import { Flame } from "lucide-react";
import { useGamification } from "./useGamification";

function StreakIndicator() {
  const { weekStreak } = useGamification();
  const active = weekStreak.current > 0;

  return (
    <div
      className="text-text-muted inline-flex items-center gap-1.5 text-[0.78rem] font-medium"
      title={`Sequência mais longa: ${weekStreak.longest} ${weekStreak.longest === 1 ? "semana" : "semanas"}`}
    >
      <Flame
        size={15}
        className={active ? "text-warning" : "text-text-muted"}
        aria-hidden="true"
      />
      {active
        ? `${weekStreak.current} ${weekStreak.current === 1 ? "semana seguida" : "semanas seguidas"}`
        : "Sem sequência ativa"}
    </div>
  );
}

export default StreakIndicator;
