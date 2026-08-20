import { useState } from "react";
import { ExternalLink, Flame, MessageCircle, SkipForward } from "lucide-react";
import { useAdmin } from "../../context";
import {
  markTouchSent,
  markViewed,
  skipTouch,
  whatsappLink,
  type HotLead,
  type QueueItem,
} from "../../../../lib/prospecting";
import { SEGMENT_META, nicheLabel, relativeTime } from "./meta";
import { Badge, ScoreDot } from "./ui";
import type { ProspectingData } from "./useProspecting";

/**
 * A fila do dia. É a tela onde o trabalho acontece — tudo o mais no módulo
 * existe para alimentar esta lista na ordem certa.
 */
export default function QueueTab({
  data,
  refresh,
}: {
  data: ProspectingData;
  refresh: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [busy, setBusy] = useState<number | null>(null);

  const cap = data.settings?.dailyOutreachCap ?? 40;
  const remaining = Math.max(0, cap - data.sentToday);

  async function handleSend(item: QueueItem) {
    if (!item.lead.phoneE164) return;
    setBusy(item.id);
    // Abre a conversa antes de gravar: se o pop-up for bloqueado, o envio não
    // fica marcado como feito sem ter acontecido.
    window.open(whatsappLink(item.lead.phoneE164, item.body), "_blank", "noopener");
    try {
      await markTouchSent(item);
      await refresh();
      showToast(`Toque ${item.step} enviado para ${item.lead.name}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao registrar o envio.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSkip(item: QueueItem) {
    setBusy(item.id);
    try {
      await skipTouch(item.id);
      await refresh();
      showToast("Toque pulado.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao pular.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {data.hot.length > 0 && <HotBlock hot={data.hot} refresh={refresh} />}

      <section>
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-family-display text-lg font-bold">Fila de hoje</h2>
            <p className="text-text-muted text-sm">
              Ordenada por score. Envie de cima para baixo e pare quando a régua acabar.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums">
              {data.sentToday} / {cap}
            </p>
            <p className="text-text-muted text-xs">enviados hoje</p>
          </div>
        </header>

        {remaining === 0 && data.queue.length > 0 && (
          <p className="border-warning/30 bg-warning/8 text-warning mb-4 rounded-lg border px-4 py-3 text-sm">
            Régua do dia atingida. Parar aqui é de propósito: volume alto num dia só
            é o que faz número ser marcado como spam.
          </p>
        )}

        {data.queue.length === 0 ? (
          <EmptyQueue />
        ) : (
          <ul className="space-y-3">
            {data.queue.slice(0, remaining || undefined).map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                busy={busy === item.id}
                onSend={() => handleSend(item)}
                onSkip={() => handleSkip(item)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="border-border bg-surface text-text-muted rounded-xl border border-dashed p-8 text-center text-sm">
      <p className="mb-1 font-medium">Nada agendado para hoje.</p>
      <p>
        Gere protótipos na aba <strong>Leads</strong> — cada protótipo cria a sequência
        de quatro toques automaticamente.
      </p>
    </div>
  );
}

function QueueCard({
  item,
  busy,
  onSend,
  onSkip,
}: {
  item: QueueItem;
  busy: boolean;
  onSend: () => void;
  onSkip: () => void;
}) {
  const segment = SEGMENT_META[item.lead.segment];
  return (
    <li className="border-border bg-surface rounded-xl border p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{item.lead.name}</h3>
            <ScoreDot score={item.lead.score} />
          </div>
          <p className="text-text-muted text-xs">
            {nicheLabel(item.lead.niche)}
            {item.lead.neighborhood && ` · ${item.lead.neighborhood}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge className={segment.className}>{segment.label}</Badge>
          <Badge className="bg-text-muted/12 text-text-muted">Toque {item.step}</Badge>
        </div>
      </div>

      <p className="bg-bg text-text-muted mb-3 max-h-32 overflow-y-auto rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
        {item.body}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {item.lead.whatsappValid && item.lead.phoneE164 ? (
          <button
            onClick={onSend}
            disabled={busy}
            className="bg-good inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <MessageCircle size={16} aria-hidden />
            {busy ? "Enviando…" : "Enviar no WhatsApp"}
          </button>
        ) : (
          <span className="border-danger/30 text-danger rounded-lg border px-3 py-2 text-xs">
            Sem WhatsApp válido — só telefone fixo ou número ausente.
          </span>
        )}

        {item.prototypeSlug && (
          <a
            href={`/p/${item.prototypeSlug}`}
            target="_blank"
            rel="noreferrer"
            className="border-border text-text-muted hover:text-text inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <ExternalLink size={15} aria-hidden />
            Ver protótipo
          </a>
        )}

        <button
          onClick={onSkip}
          disabled={busy}
          className="text-text-muted hover:text-text ml-auto inline-flex items-center gap-1.5 px-2 py-2 text-sm disabled:opacity-50"
        >
          <SkipForward size={15} aria-hidden />
          Pular
        </button>
      </div>
    </li>
  );
}

/**
 * Bloco de leads quentes: quem abriu o protótipo. Fica fora da sequência
 * agendada de propósito — o momento certo de falar é agora, não no dia que o
 * cronograma diz.
 */
function HotBlock({ hot, refresh }: { hot: HotLead[]; refresh: () => Promise<void> }) {
  const { showToast } = useAdmin();

  async function open(item: HotLead) {
    if (item.lead.phoneE164) {
      window.open(
        whatsappLink(
          item.lead.phoneE164,
          `Oi! Vi que você deu uma olhada no protótipo. Qualquer coisa que queira mudar, é só falar.`,
        ),
        "_blank",
        "noopener",
      );
    }
    try {
      await markViewed(item.leadId);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao marcar visualização.");
    }
  }

  return (
    <section className="border-good/30 bg-good/6 rounded-xl border p-4 sm:p-5">
      <header className="mb-3 flex items-center gap-2">
        <Flame size={18} className="text-good" aria-hidden />
        <h2 className="font-family-display font-bold">Abriram o protótipo</h2>
        <span className="bg-good/20 text-good rounded-full px-2 py-0.5 text-xs font-bold">
          {hot.length}
        </span>
      </header>
      <p className="text-text-muted mb-4 text-sm">
        Estes leads olharam a página. Falar agora vale mais do que qualquer toque
        agendado.
      </p>
      <ul className="space-y-2">
        {hot.map((item) => (
          <li
            key={item.prototypeId}
            className="bg-surface flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.lead.name}</p>
              <p className="text-text-muted text-xs">
                {item.views === 1 ? "1 visita" : `${item.views} visitas`} ·{" "}
                {relativeTime(item.lastViewedAt)} · {nicheLabel(item.lead.niche)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/p/${item.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-text-muted hover:text-text text-sm"
              >
                Ver
              </a>
              <button
                onClick={() => open(item)}
                disabled={!item.lead.whatsappValid}
                className="bg-good rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Falar agora
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
