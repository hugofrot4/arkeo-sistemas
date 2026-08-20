import { useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { useAdmin } from "../../context";
import { runSourcing, runWorker } from "../../../../lib/prospecting";
import { STAGE_META, STAGE_ORDER } from "./meta";
import type { ProspectingData } from "./useProspecting";

/**
 * Operação e números. Duas perguntas: o funil está andando, e onde ele vaza.
 */
export default function OperationTab({
  data,
  refresh,
}: {
  data: ProspectingData;
  refresh: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [running, setRunning] = useState<"source" | "worker" | null>(null);

  const swept = data.grid.totalTasks - data.grid.pendingTasks;
  const sweepPct = data.grid.totalTasks
    ? Math.round((swept / data.grid.totalTasks) * 100)
    : 0;

  const byStage = new Map(data.pipeline.map((p) => [p.stage, p.count]));
  const totalLeads = data.pipeline.reduce((sum, p) => sum + p.count, 0);
  const won = byStage.get("ganho") ?? 0;
  const contacted = byStage.get("contatado") ?? 0;

  async function handleSource() {
    setRunning("source");
    try {
      const result = await runSourcing();
      if (result.skipped) showToast(result.reason ?? "Busca não rodou.");
      else
        showToast(
          `${result.totalNew} leads novos em ${result.tasksProcessed} buscas ` +
            `(${result.usage?.remaining ?? 0} chamadas restantes hoje).`,
        );
      if (result.errors?.length) {
        showToast(`${result.errors.length} busca(s) com erro — veja em search_tasks.`);
      }
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha na busca.");
    } finally {
      setRunning(null);
    }
  }

  async function handleWorker() {
    setRunning("worker");
    try {
      const result = await runWorker();
      if (result.skipped) {
        showToast(result.reason ?? "Worker não rodou.");
      } else {
        const summary = Object.entries(result.results ?? {})
          .filter(([, r]) => r.claimed > 0 || r.skipped)
          .map(([kind, r]) => (r.skipped ? `${kind}: ${r.skipped}` : `${kind}: ${r.done} ok`))
          .join(" · ");
        showToast(summary || "Nada pendente na fila.");
      }
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha no worker.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="border-border bg-surface rounded-xl border p-5">
        <h2 className="font-family-display mb-1 font-bold">Rodar agora</h2>
        <p className="text-text-muted mb-4 text-sm">
          A busca varre território novo a cada execução. O worker processa a fila
          — detalhes, auditoria e geração de protótipo.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSource}
            disabled={running !== null}
            className="bg-accent inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Play size={15} aria-hidden />
            {running === "source" ? "Buscando…" : "Buscar novos leads"}
          </button>
          <button
            onClick={handleWorker}
            disabled={running !== null}
            className="border-border hover:bg-surface-hover inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              aria-hidden
              className={running === "worker" ? "animate-spin" : undefined}
            />
            {running === "worker" ? "Processando…" : "Processar fila"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-family-display mb-3 font-bold">Cobertura do território</h2>
        <div className="border-border bg-surface rounded-xl border p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums">{sweepPct}%</span>
            <span className="text-text-muted text-sm tabular-nums">
              {swept} de {data.grid.totalTasks} buscas
            </span>
          </div>
          <div className="bg-bg h-2 overflow-hidden rounded-full">
            <div className="bg-accent h-full rounded-full" style={{ width: `${sweepPct}%` }} />
          </div>
          <p className="text-text-muted mt-3 text-xs">
            {data.grid.deadCells} células descartadas por não terem negócio nenhum —
            mar, área vazia ou fora da cidade.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-family-display mb-3 font-bold">Funil</h2>
        <ul className="space-y-1.5">
          {STAGE_ORDER.map((stage) => {
            const count = byStage.get(stage) ?? 0;
            const pct = totalLeads ? (count / totalLeads) * 100 : 0;
            return (
              <li key={stage} className="flex items-center gap-3">
                <span className="text-text-muted w-36 shrink-0 text-sm">
                  {STAGE_META[stage].label}
                </span>
                <div className="bg-surface h-6 flex-1 overflow-hidden rounded">
                  <div
                    className={`h-full ${stage === "perdido" ? "bg-danger/40" : "bg-accent/40"}`}
                    style={{ width: `${Math.max(pct, count ? 1.5 : 0)}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
        {contacted + won > 0 && (
          <p className="text-text-muted mt-3 text-sm">
            {won} fechado{won === 1 ? "" : "s"} de {totalLeads} leads na base.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-family-display mb-3 font-bold">Fila de processamento</h2>
        {data.jobs.length === 0 ? (
          <p className="text-text-muted text-sm">Fila vazia.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.jobs.map((job) => (
              <span
                key={`${job.kind}:${job.status}`}
                className={`rounded-lg px-3 py-2 text-sm ${
                  job.status === "failed"
                    ? "bg-danger/12 text-danger"
                    : job.status === "running"
                      ? "bg-warning/12 text-warning"
                      : "bg-surface text-text-muted"
                }`}
              >
                <strong className="tabular-nums">{job.count}</strong> {job.kind} · {job.status}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
