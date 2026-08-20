import { useCallback, useEffect, useState } from "react";
import {
  countSentToday,
  getGridProgress,
  getJobQueue,
  getPipelineCounts,
  getProspectingSettings,
  listHotLeads,
  listOutreachQueue,
  type HotLead,
  type JobQueueSummary,
  type PipelineCounts,
  type ProspectingSettings,
  type QueueItem,
} from "../../../../lib/prospecting";

export interface ProspectingData {
  queue: QueueItem[];
  hot: HotLead[];
  sentToday: number;
  pipeline: PipelineCounts[];
  jobs: JobQueueSummary[];
  grid: { totalTasks: number; pendingTasks: number; deadCells: number };
  settings: ProspectingSettings | null;
}

const EMPTY: ProspectingData = {
  queue: [],
  hot: [],
  sentToday: 0,
  pipeline: [],
  jobs: [],
  grid: { totalTasks: 0, pendingTasks: 0, deadCells: 0 },
  settings: null,
};

/** Busca pura: não toca em estado, só devolve os dados. */
async function fetchAll(): Promise<ProspectingData> {
  const [queue, hot, sentToday, pipeline, jobs, grid, settings] = await Promise.all([
    listOutreachQueue(),
    listHotLeads(),
    countSentToday(),
    getPipelineCounts(),
    getJobQueue(),
    getGridProgress(),
    getProspectingSettings(),
  ]);
  return { queue, hot, sentToday, pipeline, jobs, grid, settings };
}

/**
 * Estado da prospecção, fora do AdminContext.
 *
 * O AdminContext já tem centenas de linhas e ~15 flags de carregamento;
 * pendurar mais um módulo nele faria a tela inteira do admin reagir a cada
 * ação de prospecção. Aqui o escopo é a própria aba.
 */
export function useProspecting() {
  const [data, setData] = useState<ProspectingData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fail(err: unknown) {
    setError(err instanceof Error ? err.message : "Falha ao carregar a prospecção.");
  }

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((next) => {
        if (!active) return;
        setData(next);
        setError(null);
      })
      .catch((err) => active && fail(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setData(await fetchAll());
      setError(null);
    } catch (err) {
      fail(err);
    }
  }, []);

  return { data, loading, error, refresh };
}
