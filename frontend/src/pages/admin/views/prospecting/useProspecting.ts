import { useCallback, useEffect, useState } from "react";
import {
  countSentToday,
  getGridProgress,
  getJobQueue,
  getCoberturaContato,
  getCoberturaPrototipos,
  getPipelineCounts,
  getProspectingSettings,
  listHotLeads,
  listOutreachQueue,
  type HotLead,
  type JobQueueSummary,
  type CoberturaContato,
  type CoberturaPrototipos,
  type PipelineCounts,
  type ProspectingSettings,
  type QueueItem,
} from "../../../../lib/prospecting";

/**
 * O que espera ação hoje.
 *
 * Calculado num lugar só porque estava em dois e divergiu: o crachá da aba
 * somava fila mais quentes sem deduplicar — lead que abriu o protótipo E tem
 * toque vencido contava duas vezes — e ignorava a régua diária, que a aba
 * aplica ao exibir. Onze no crachá, cinco na tela.
 */
export interface Pendencias {
  /** Abriram o protótipo. Vêm antes de tudo. */
  quentes: number;
  /** Toques vencidos que cabem na régua de hoje, sem os que já estão em `quentes`. */
  naFila: number;
  total: number;
}

export interface ProspectingData {
  queue: QueueItem[];
  hot: HotLead[];
  sentToday: number;
  pipeline: PipelineCounts[];
  jobs: JobQueueSummary[];
  grid: { totalTasks: number; pendingTasks: number; deadCells: number };
  cobertura: CoberturaPrototipos;
  pendencias: Pendencias;
  contato: CoberturaContato;
  settings: ProspectingSettings | null;
}

const EMPTY: ProspectingData = {
  queue: [],
  hot: [],
  sentToday: 0,
  pipeline: [],
  jobs: [],
  grid: { totalTasks: 0, pendingTasks: 0, deadCells: 0 },
  cobertura: { prontosParaGerar: 0, semPrototipo: 0, comPrototipo: 0 },
  pendencias: { quentes: 0, naFila: 0, total: 0 },
  contato: { comWhatsapp: 0, comEmail: 0, comAmbos: 0, semNada: 0 },
  settings: null,
};

/** Busca pura: não toca em estado, só devolve os dados. */
async function fetchAll(): Promise<ProspectingData> {
  const [queue, hot, sentToday, pipeline, jobs, grid, cobertura, contato, settings] =
    await Promise.all([
      listOutreachQueue(),
      listHotLeads(),
      countSentToday(),
      getPipelineCounts(),
      getJobQueue(),
      getGridProgress(),
      getCoberturaPrototipos(),
      getCoberturaContato(),
      getProspectingSettings(),
    ]);
  const capDiaria = settings?.dailyOutreachCap ?? 40;
  const restamHoje = Math.max(0, capDiaria - sentToday);
  // Quem tem toque vencido é contado na fila, mesmo tendo aberto o protótipo:
  // é lá que ele aparece. O bloco quente só carrega quem abriu e não tem toque
  // hoje — senão o mesmo lead entrava duas vezes.
  const idsNaFila = new Set(queue.map((t) => t.leadId));
  const quentesSemToque = hot.filter((h) => !idsNaFila.has(h.leadId)).length;
  const naFila = Math.min(queue.length, restamHoje);

  return {
    queue, hot, sentToday, pipeline, jobs, grid, cobertura, contato, settings,
    pendencias: { quentes: quentesSemToque, naFila, total: quentesSemToque + naFila },
  };
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
