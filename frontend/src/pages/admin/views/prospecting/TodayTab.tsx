import { useState } from "react";
import { Flame, MessageCircle, Play, RefreshCw, Search, Wand2 } from "lucide-react";
import { useAdmin } from "../../context";
import { runSourcing, runWorker } from "../../../../lib/prospecting";
import type { ProspectingData } from "./useProspecting";

/**
 * O que fazer agora.
 *
 * As abas mostravam informação sem dizer o que fazer com ela, e o processo
 * começava na quarta delas: quem entrava caía na fila de hoje, que fica vazia
 * até a busca, a auditoria e a geração terem acontecido — sem nada indicando
 * isso.
 *
 * Aqui os passos são calculados do estado real e ordenados por urgência. Cada
 * um traz o botão que o resolve. Nada de gráfico que não leve a uma ação.
 */
export default function TodayTab({
  data,
  refresh,
  irPara,
}: {
  data: ProspectingData;
  refresh: () => Promise<void>;
  irPara: (aba: "leads" | "fila") => void;
}) {
  const { showToast } = useAdmin();
  const [rodando, setRodando] = useState<"busca" | "fila" | null>(null);

  const porEstagio = new Map(data.pipeline.map((p) => [p.stage, p.count]));
  const qualificados = porEstagio.get("qualificado") ?? 0;
  const prototiposProntos = porEstagio.get("prototipo_pronto") ?? 0;
  const totalLeads = data.pipeline.reduce((soma, p) => soma + p.count, 0);
  const ganhos = porEstagio.get("ganho") ?? 0;

  const jobsPendentes = data.jobs
    .filter((j) => j.status === "pending" || j.status === "running")
    .reduce((soma, j) => soma + j.count, 0);
  const jobsFalhos = data.jobs
    .filter((j) => j.status === "failed")
    .reduce((soma, j) => soma + j.count, 0);

  const capDiaria = data.settings?.dailyOutreachCap ?? 40;
  const restamHoje = Math.max(0, capDiaria - data.sentToday);
  const naFila = Math.min(data.queue.length, restamHoje);

  async function buscar() {
    setRodando("busca");
    try {
      const r = await runSourcing();
      showToast(
        r.skipped
          ? (r.reason ?? "Busca não rodou.")
          : `${r.totalNew} leads novos em ${r.tasksProcessed} buscas.`,
      );
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha na busca.");
    } finally {
      setRodando(null);
    }
  }

  async function processar() {
    setRodando("fila");
    try {
      const r = await runWorker();
      if (r.skipped) {
        showToast(r.reason ?? "Worker não rodou.");
      } else {
        const feito = Object.values(r.results ?? {}).reduce((s, x) => s + x.done, 0);
        showToast(
          feito > 0 ? `${feito} lead(s) processados.` : "Nada pendente no momento.",
        );
      }
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao processar.");
    } finally {
      setRodando(null);
    }
  }

  // Ordem de urgência: quem já demonstrou interesse vem antes de tudo, e a
  // descoberta de leads novos vem por último — não adianta encher a base se o
  // que já está nela não foi trabalhado.
  const passos: Passo[] = [];

  if (data.hot.length > 0) {
    passos.push({
      chave: "quentes",
      tom: "quente",
      icone: <Flame size={18} aria-hidden />,
      titulo: `${data.hot.length} ${data.hot.length === 1 ? "lead abriu" : "leads abriram"} o protótipo`,
      texto:
        "Abriram a página que você mandou. Falar agora converte muito acima de qualquer toque agendado.",
      acao: { rotulo: "Falar com eles", ao: () => irPara("fila") },
    });
  }

  if (naFila > 0) {
    passos.push({
      chave: "fila",
      tom: "acao",
      icone: <MessageCircle size={18} aria-hidden />,
      titulo: `${naFila} ${naFila === 1 ? "mensagem" : "mensagens"} para enviar hoje`,
      texto:
        data.sentToday > 0
          ? `Você já enviou ${data.sentToday} de ${capDiaria} hoje.`
          : "Toques agendados que venceram. Envie de cima para baixo.",
      acao: { rotulo: "Abrir a fila", ao: () => irPara("fila") },
    });
  }

  if (qualificados > 0) {
    passos.push({
      chave: "gerar",
      tom: "acao",
      icone: <Wand2 size={18} aria-hidden />,
      titulo: `${qualificados} ${qualificados === 1 ? "lead pronto" : "leads prontos"} para gerar protótipo`,
      texto:
        "Já foram auditados e pontuados. Gerar o protótipo é o que os coloca na fila de abordagem.",
      acao: { rotulo: "Ver leads", ao: () => irPara("leads") },
    });
  }

  if (jobsPendentes > 0) {
    passos.push({
      chave: "processar",
      tom: "neutro",
      icone: <RefreshCw size={18} aria-hidden className={rodando === "fila" ? "animate-spin" : ""} />,
      titulo: `${jobsPendentes} ${jobsPendentes === 1 ? "lead esperando" : "leads esperando"} auditoria`,
      texto:
        "A auditoria é o que dá nota ao lead e argumento para a mensagem. Roda em lotes de cinco por clique.",
      acao: { rotulo: rodando === "fila" ? "Processando…" : "Processar agora", ao: processar },
    });
  }

  if (data.grid.pendingTasks > 0 && qualificados < 10) {
    const varrido = data.grid.totalTasks
      ? Math.round(((data.grid.totalTasks - data.grid.pendingTasks) / data.grid.totalTasks) * 100)
      : 0;
    passos.push({
      chave: "buscar",
      tom: "neutro",
      icone: <Search size={18} aria-hidden />,
      titulo: "Buscar leads novos",
      texto: `${varrido}% do território já foi varrido. Cada busca cobre um pedaço novo da cidade.`,
      acao: { rotulo: rodando === "busca" ? "Buscando…" : "Buscar agora", ao: buscar },
    });
  }

  return (
    <div className="space-y-5">
      {passos.length === 0 ? (
        <div className="border-good/30 bg-good/6 rounded-xl border p-6">
          <h2 className="font-family-display mb-1 font-bold">Tudo em dia por hoje.</h2>
          <p className="text-text-muted text-sm">
            Sem toque vencido, sem lead esperando auditoria e ninguém novo abriu o
            protótipo. Os próximos toques voltam sozinhos na data agendada.
          </p>
          <button
            onClick={buscar}
            disabled={rodando !== null}
            className="border-border hover:bg-surface-hover mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Play size={15} aria-hidden />
            {rodando === "busca" ? "Buscando…" : "Buscar mais leads"}
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {passos.map((passo, i) => (
            <CartaoPasso
              key={passo.chave}
              passo={passo}
              primeiro={i === 0}
              ocupado={rodando !== null}
            />
          ))}
        </ul>
      )}

      {jobsFalhos > 0 && (
        <p className="border-danger/25 bg-danger/6 text-danger rounded-lg border px-4 py-3 text-sm">
          {jobsFalhos} lead(s) falharam no processamento depois de várias tentativas.
          Costuma ser site fora do ar ou cota de API esgotada.
        </p>
      )}

      {/* Números de acompanhamento, no rodapé e em uma linha: são contexto, não
          tarefa. Antes ocupavam uma aba inteira em forma de gráfico e não
          levavam a nenhuma ação. */}
      <p className="text-text-muted border-border border-t pt-4 text-xs">
        {totalLeads} leads na base · {qualificados} prontos para protótipo ·{" "}
        {prototiposProntos} com protótipo · {ganhos} ganhos ·{" "}
        {data.grid.totalTasks - data.grid.pendingTasks} de {data.grid.totalTasks} buscas
        feitas
      </p>
    </div>
  );
}

interface Passo {
  chave: string;
  tom: "quente" | "acao" | "neutro";
  icone: React.ReactNode;
  titulo: string;
  texto: string;
  acao: { rotulo: string; ao: () => void };
}

const TONS = {
  quente: { caixa: "border-good/30 bg-good/6", icone: "text-good", botao: "bg-good text-white" },
  acao: { caixa: "border-accent/30 bg-accent/6", icone: "text-accent", botao: "bg-accent text-white" },
  neutro: { caixa: "border-border bg-surface", icone: "text-text-muted", botao: "border-border border" },
};

function CartaoPasso({
  passo,
  primeiro,
  ocupado,
}: {
  passo: Passo;
  primeiro: boolean;
  ocupado: boolean;
}) {
  const tom = TONS[passo.tom];
  return (
    <li className={`flex flex-wrap items-start gap-4 rounded-xl border p-4 sm:p-5 ${tom.caixa}`}>
      <span className={`mt-0.5 shrink-0 ${tom.icone}`}>{passo.icone}</span>
      <div className="min-w-0 flex-1">
        <h3 className="font-family-display font-bold">{passo.titulo}</h3>
        <p className="text-text-muted mt-0.5 text-sm">{passo.texto}</p>
      </div>
      <button
        onClick={passo.acao.ao}
        disabled={ocupado}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
          primeiro ? tom.botao : "border-border border"
        }`}
      >
        {passo.acao.rotulo}
      </button>
    </li>
  );
}
