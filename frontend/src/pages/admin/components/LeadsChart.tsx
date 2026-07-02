import { useState } from "react";
import { useAdmin } from "../context";

interface TooltipState {
  x: number;
  y: number;
  day: string;
  value: number;
}

function LeadsChart() {
  const { state } = useAdmin();
  const data = state.leadsLast7Days;
  const max = Math.max(...data.map((d) => d.value), 1);
  const maxIdx = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0,
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  return (
    <div
      className="relative flex h-37.5 items-end gap-2.5 px-1 pb-6.5"
      aria-label="Gráfico de barras: leads recebidos nos últimos 7 dias"
    >
      <div className="border-border pointer-events-none absolute right-0 bottom-6.5 left-0 border-t" />
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, 3);
        return (
          <div
            key={d.day + i}
            className="relative flex h-full flex-1 flex-col items-center justify-end"
            onMouseMove={(e) =>
              setTooltip({ x: e.clientX, y: e.clientY, day: d.day, value: d.value })
            }
            onMouseLeave={() => setTooltip(null)}
          >
            {i === maxIdx && (
              <span className="font-family-display text-text absolute -top-5 left-1/2 -translate-x-1/2 text-[0.72rem] font-bold whitespace-nowrap">
                {d.value}
              </span>
            )}
            <div
              className="bg-accent w-full max-w-6 rounded-t transition-all duration-200 hover:scale-x-105 hover:brightness-125"
              style={{ height: `${h}%`, minHeight: "4px" }}
            />
            <span className="text-text-muted absolute bottom-0 text-[0.68rem]">
              {d.day}
            </span>
          </div>
        );
      })}

      {tooltip && (
        <div
          className="border-accent bg-bg-alt shadow-md pointer-events-none fixed z-500 -translate-x-1/2 -translate-y-[110%] rounded-lg border px-2.75 py-1.75 text-[0.75rem]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="font-family-display text-text font-bold">
            {tooltip.value} {tooltip.value === 1 ? "lead" : "leads"}
          </span>{" "}
          <span className="text-text-muted">{tooltip.day}</span>
        </div>
      )}
    </div>
  );
}

export default LeadsChart;
