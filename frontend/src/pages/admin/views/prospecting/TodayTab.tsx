import { useState } from "react";
import { Flame, History, MessageCircle, Play, RefreshCw, Search, Wand2 } from "lucide-react";
import { useAdmin } from "../../context";
import { restartOutreach, runSourcing, runWorker } from "../../../../lib/prospecting";
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
  const [rodando, setRodando] = useState<"busca" | "fila" | "reinicio" | null>(null);

  const porEstagio = new Map(data.pipeline.map((p) => [p.stage, p.count]));
  const totalLeads = data.pipeline.reduce((soma, p) => soma + p.count, 0);
  const ganhos = porEstagio.get("ganho") ?? 0;

  // Medido pela ausência de protótipo publicado, não pelo estágio: estágio só
  // avança, então ele diverge de quem já tem protótipo. Ver
  // `getCoberturaPrototipos`.
  const prontos = data.cobertura.prontosParaGerar;
  const semPrototipo = data.cobertura.semPrototipo;
  const comPrototipo = data.cobertura.comPrototipo;

  const contato = data.contato;
  const alcancaveis = contato.comWhatsapp + contato.comEmail - contato.comAmbos;

  const jobsPendentes = data.jobs
    .filter((j) => j.status === "pending" || j.status === "running")
    .reduce((soma, j) => soma + j.count, 0);
  const jobsFalhos = data.jobs
    .filter((j) => j.status === "failed")
    .reduce((soma, j) => soma + j.count, 0);

  const capDiaria = data.settings?.dailyOutreachCap ?? 40;
  const naFila = data.pendencias.naFila;

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

  /**
   * Reescreve o toque 1 de quem foi abordado com a doutrina antiga e devolve
   * todos ao começo da sequência.
   *
   * Um por um, não em lote: se um falhar, os já reiniciados ficam reiniciados
   * — a lista se recalcula a cada carga e só mostra quem sobrou.
   */
  async function reiniciar() {
    if (!data.settings) return;
    setRodando("reinicio");
    const identidade = {
      senderName: data.settings.outreachSenderName,
      agencyName: data.settings.agencyName,
    };
    let feitos = 0;
    const falhas: string[] = [];
    for (const lead of data.paraReiniciar) {
      try {
        await restartOutreach(lead, identidade);
        feitos++;
      } catch {
        falhas.push(lead.name);
      }
    }
    await refresh();
    setRodando(null);
    showToast(
      falhas.length === 0
        ? `${feitos} sequência(s) reiniciadas. Estão no topo da fila.`
        : `${feitos} reiniciadas. Falharam: ${falhas.join(", ")}.`,
    );
  }

  // Ordem de urgência: quem já demonstrou interesse vem antes de tudo, e a
  // descoberta de leads novos vem por último — não adianta encher a base se o
  // que já está nela não foi trabalhado.
  const passos: Passo[] = [];

  // Antes de tudo: enquanto não reiniciar, a fila mostra o texto antigo, e
  // enviá-lo é justamente o que se quer evitar.
  if (data.paraReiniciar.length > 0) {
    const n = data.paraReiniciar.length;
    const enviados = data.paraReiniciar.filter((l) => l.sentCount > 0).length;
    passos.push({
      chave: "reiniciar",
      tom: "acao",
      icone: <History size={18} aria-hidden />,
      titulo: `${n} ${n === 1 ? "sequência escrita" : "sequências escritas"} com a abordagem antiga`,
      texto:
        "O toque 1 de WhatsApp oferecia o protótipo; agora ele pergunta com quem " +
        "falar sobre o site. Reiniciar reescreve só essa primeira mensagem — os " +
        `toques 2 a 4 continuam iguais — e devolve ${n === 1 ? "o lead" : "os leads"} ao topo da fila.` +
        (enviados > 0
          ? ` ${enviados} já ${enviados === 1 ? "recebeu" : "receberam"} mensagem: para ${enviados === 1 ? "esse" : "esses"}, a pergunta nova chega como retomada.`
          : ""),
      acao: {
        rotulo: rodando === "reinicio" ? "Reiniciando…" : "Reiniciar sequências",
        ao: reiniciar,
      },
    });
  }

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

  if (prontos > 0) {
    passos.push({
      chave: "gerar",
      tom: "acao",
      icone: <Wand2 size={18} aria-hidden />,
      titulo: `${prontos} ${prontos === 1 ? "lead auditado espera" : "leads auditados esperam"} protótipo`,
      texto:
        "Gerar o protótipo é o que coloca o lead na fila de abordagem. Comece pelos de maior score.",
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

  if (data.grid.pendingTasks > 0 && prontos < 10) {
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

      {contato.semNada > 0 && alcancaveis > 0 && contato.semNada / (alcancaveis + contato.semNada) > 0.25 && (
        <p className="border-warning/25 bg-warning/6 text-warning rounded-lg border px-4 py-3 text-sm">
          {contato.semNada} leads não têm telefone nem e-mail — não há como abordá-los.
          Preencher o contato à mão em Leads → Editar é o que os traz de volta.
        </p>
      )}

      {jobsFalhos > 0 && (
        <p className="border-danger/25 bg-danger/6 text-danger rounded-lg border px-4 py-3 text-sm">
          {jobsFalhos} lead(s) falharam no processamento depois de várias tentativas.
          Costuma ser site fora do ar ou cota de API esgotada.
        </p>
      )}

      {/* Por onde dá para falar com eles. Passou a importar quando o WhatsApp
          começou a restringir os envios: é este número que diz se o e-mail
          substitui o canal ou só complementa. */}
      <p className="text-text-muted border-border mt-1 border-t pt-4 text-xs">
        <strong className="text-text">Contato:</strong> {contato.comWhatsapp} com
        telefone · {contato.comEmail} com e-mail · {contato.comAmbos} com os dois
        {contato.semNada > 0 && ` · ${contato.semNada} sem nenhum`}
        {contato.comEmail === 0
          ? " — nenhum lead tem e-mail ainda, então o canal não está disponível"
          : contato.comAmbos > 0
            ? " — nos que têm os dois, alterne: WhatsApp pede permissão, e-mail chega a quem decide"
            : ""}
      </p>

      <p className="text-text-muted text-xs">
        {totalLeads} leads na base · {comPrototipo} com protótipo publicado ·{" "}
        {semPrototipo} sem ({prontos} já auditados) · {ganhos} ganhos ·{" "}
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
