import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Search, Sparkles, Wand2 } from "lucide-react";
import { useAdmin } from "../../context";
import {
  closeLead,
  getLeadAudit,
  listLeads,
  listTouches,
  reopenTouch,
  requestReaudit,
  type Finding,
  type Lead,
  type LeadSegment,
  type OutreachTouch,
  type LeadStage,
  type ProspectingSettings,
} from "../../../../lib/prospecting";
import GenerateModal from "./GenerateModal";
import LeadEditModal from "./LeadEditModal";
import { LOST_REASONS, SEGMENT_META, STAGE_META, nicheLabel } from "./meta";
import { Badge, ScoreDot } from "./ui";

const SEGMENT_FILTERS: { value: LeadSegment | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "site_quebrado", label: "Site fora do ar" },
  { value: "sem_presenca", label: "Sem presença" },
  { value: "so_rede_social", label: "Só rede social" },
  { value: "site_obsoleto", label: "Site obsoleto" },
  { value: "site_ok", label: "Site em dia" },
  { value: "nao_auditado", label: "Não auditado" },
];

/** Leads ainda em jogo. Ganho e perdido saem da lista de trabalho. */
const ACTIVE_STAGES: LeadStage[] = [
  "novo",
  "qualificado",
  "prototipo_pronto",
  "contatado",
  "visualizou",
  "em_conversa",
  "proposta",
];

export default function LeadsTab({
  onChanged,
  settings,
}: {
  onChanged: () => Promise<void>;
  settings: ProspectingSettings | null;
}) {
  const { showToast } = useAdmin();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [segment, setSegment] = useState<LeadSegment | "todos">("todos");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [generating, setGenerating] = useState<Lead | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Filtro no servidor: a base cresce para dezenas de milhares e a v1
      // puxava tudo para filtrar no cliente.
      setLeads(
        await listLeads({
          segments: segment === "todos" ? undefined : [segment],
          search: search.trim() || undefined,
          minScore: minScore || undefined,
          stages: includeClosed ? undefined : ACTIVE_STAGES,
          limit: 100,
        }),
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao carregar leads.");
    } finally {
      setLoading(false);
    }
  }, [segment, search, minScore, includeClosed, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="border-border bg-surface flex min-w-56 flex-1 items-center gap-2 rounded-lg border px-3 py-2">
          <Search size={16} className="text-text-muted shrink-0" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pelo nome do negócio"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as LeadSegment | "todos")}
          className="border-border bg-surface rounded-lg border px-3 py-2 text-sm"
        >
          {SEGMENT_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <label className="text-text-muted flex items-center gap-2 text-sm">
          Score mínimo
          <input
            type="number"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="border-border bg-surface w-20 rounded-lg border px-2 py-2 text-sm tabular-nums"
          />
        </label>

        <label className="text-text-muted flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeClosed}
            onChange={(e) => setIncludeClosed(e.target.checked)}
          />
          Incluir encerrados
        </label>
      </div>

      {loading ? (
        <p className="text-text-muted py-8 text-center text-sm">Carregando…</p>
      ) : leads.length === 0 ? (
        <p className="border-border text-text-muted rounded-xl border border-dashed py-10 text-center text-sm">
          Nenhum lead com esses filtros.
        </p>
      ) : (
        <ul className="space-y-2">
          {leads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              expanded={expanded === lead.id}
              onToggle={() => setExpanded(expanded === lead.id ? null : lead.id)}
              onGenerate={() => setGenerating(lead)}
              onEdit={() => setEditing(lead)}
              onChanged={async () => {
                await load();
                await onChanged();
              }}
            />
          ))}
        </ul>
      )}

      {editing && (
        <LeadEditModal
          lead={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await load();
            await onChanged();
          }}
        />
      )}

      {generating && settings && (
        <GenerateModal
          lead={generating}
          settings={settings}
          onClose={() => setGenerating(null)}
          onPublished={async () => {
            await load();
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

function LeadRow({
  lead,
  expanded,
  onToggle,
  onGenerate,
  onEdit,
  onChanged,
}: {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  onEdit: () => void;
  onChanged: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const segment = SEGMENT_META[lead.segment];
  const stage = STAGE_META[lead.stage];

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      await onChanged();
      showToast(message);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não deu certo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border-border bg-surface rounded-xl border">
      <button
        onClick={onToggle}
        className="hover:bg-surface-hover flex w-full flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <ScoreDot score={lead.score} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{lead.name}</p>
          <p className="text-text-muted truncate text-xs">
            {nicheLabel(lead.niche)}
            {lead.neighborhood && ` · ${lead.neighborhood}`}
            {lead.rating !== null && ` · ★ ${lead.rating} (${lead.userRatingCount})`}
          </p>
        </div>
        <Badge className={segment.className}>{segment.label}</Badge>
        <Badge className={stage.className}>{stage.label}</Badge>
      </button>

      {expanded && (
        <LeadDetail
          lead={lead}
          busy={busy}
          run={run}
          onGenerate={onGenerate}
          onEdit={onEdit}
        />
      )}
    </li>
  );
}

function LeadDetail({
  lead,
  busy,
  run,
  onGenerate,
  onEdit,
}: {
  lead: Lead;
  busy: boolean;
  run: (action: () => Promise<unknown>, message: string) => Promise<void>;
  onGenerate: () => void;
  onEdit: () => void;
}) {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [closing, setClosing] = useState(false);
  const naoAuditado = lead.segment === "nao_auditado";

  useEffect(() => {
    getLeadAudit(lead.id)
      .then((audit) => setFindings(audit?.findings ?? []))
      .catch(() => setFindings([]));
  }, [lead.id]);

  return (
    <div className="border-border space-y-4 border-t px-4 py-4">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Field label="Telefone">
          {lead.phone ?? "—"}
          {lead.phone && !lead.whatsappValid && (
            <span className="text-warning ml-2 text-xs">não é celular</span>
          )}
        </Field>
        <Field label="E-mail">{lead.email ?? "—"}</Field>
        <Field label="Endereço">{lead.address ?? "—"}</Field>
        <Field label="Site">
          {lead.website ? (
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="text-accent inline-flex items-center gap-1"
            >
              {lead.website.replace(/^https?:\/\//, "").slice(0, 40)}
              <ExternalLink size={12} aria-hidden />
            </a>
          ) : lead.socialUrl ? (
            <a href={lead.socialUrl} target="_blank" rel="noreferrer" className="text-accent">
              {lead.socialUrl.replace(/^https?:\/\//, "").slice(0, 40)}
            </a>
          ) : (
            "—"
          )}
        </Field>
      </dl>

      <SequenciaDeToques lead={lead} run={run} />

      {findings && findings.length > 0 && (
        <div>
          <p className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            O que a auditoria encontrou
          </p>
          <ul className="space-y-1.5">
            {findings.map((f) => (
              <li key={f.code} className="flex gap-2 text-sm">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    f.severity === "alta"
                      ? "bg-danger"
                      : f.severity === "media"
                        ? "bg-warning"
                        : "bg-text-muted"
                  }`}
                  aria-hidden
                />
                <span className="text-text-muted">{f.evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Sem auditoria dá para gerar assim mesmo: o protótipo sai igual, só a
            mensagem de abordagem fica com menos argumento concreto. Bloquear
            deixava o lead preso, porque a auditoria depende do worker rodar. */}
        <button
          onClick={onGenerate}
          disabled={busy}
          title={
            naoAuditado
              ? "Dá para gerar, mas a auditoria ainda não rodou — a abordagem sai com menos argumento. Rode \"Processar agora\" na aba Hoje."
              : undefined
          }
          className="bg-accent inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Wand2 size={15} aria-hidden />
          Gerar protótipo
        </button>

        {naoAuditado && (
          <span className="text-warning text-xs">
            sem auditoria — a abordagem sai mais fraca
          </span>
        )}

        <button
          onClick={onEdit}
          disabled={busy}
          className="border-border text-text-muted hover:text-text rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
        >
          Editar
        </button>

        <button
          onClick={() =>
            run(() => requestReaudit(lead.id), "Lead na fila de auditoria — rode o worker.")
          }
          disabled={busy}
          className="border-border text-text-muted hover:text-text rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
        >
          Reauditar
        </button>

        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.neighborhood ?? ""}`)}`}
          target="_blank"
          rel="noreferrer"
          className="border-border text-text-muted hover:text-text inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
        >
          <Search size={14} aria-hidden />
          Conferir no Google
        </a>

        {lead.verifiedByHuman && (
          <Badge className="bg-good/12 text-good">
            <Sparkles size={11} className="mr-1 inline" aria-hidden />
            conferido
          </Badge>
        )}

        {lead.stage !== "ganho" && lead.stage !== "perdido" && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => run(() => closeLead(lead.id, true), "Marcado como ganho.")}
              disabled={busy}
              className="text-good text-sm font-semibold disabled:opacity-40"
            >
              Ganhou
            </button>
            <button
              onClick={() => setClosing(!closing)}
              disabled={busy}
              className="text-text-muted hover:text-danger text-sm disabled:opacity-40"
            >
              Perdeu
            </button>
          </div>
        )}
      </div>

      {closing && (
        <div className="border-danger/25 bg-danger/6 rounded-lg border p-3">
          <p className="mb-2 text-sm font-medium">Por quê?</p>
          <div className="flex flex-wrap gap-2">
            {LOST_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() =>
                  run(
                    () => closeLead(lead.id, false, reason.value),
                    `Encerrado: ${reason.label.toLowerCase()}.`,
                  )
                }
                disabled={busy}
                className="border-border hover:bg-surface-hover rounded-full border px-3 py-1.5 text-xs disabled:opacity-40"
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TOQUE: Record<OutreachTouch["status"], { label: string; cor: string }> = {
  pending: { label: "na fila", cor: "text-text-muted" },
  sent: { label: "enviado", cor: "text-good" },
  skipped: { label: "pulado", cor: "text-warning" },
  cancelled: { label: "cancelado", cor: "text-text-muted" },
};

/**
 * Estado da sequência de abordagem, com o caminho de volta.
 *
 * Sem isto não havia como ver se um toque foi enviado nem como desfazer: envio
 * registrado por engano tirava o lead da fila para sempre, e a única saída era
 * mexer no banco.
 */
function SequenciaDeToques({
  lead,
  run,
}: {
  lead: Lead;
  run: (action: () => Promise<unknown>, message: string) => Promise<void>;
}) {
  const [toques, setToques] = useState<OutreachTouch[] | null>(null);

  useEffect(() => {
    listTouches(lead.id)
      .then(setToques)
      .catch(() => setToques([]));
  }, [lead.id]);

  if (!toques?.length) return null;

  return (
    <div>
      <p className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
        Sequência de abordagem
      </p>
      <ul className="space-y-1">
        {toques.map((toque) => {
          const meta = STATUS_TOQUE[toque.status];
          const data = new Date(`${toque.scheduledFor}T12:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          });
          return (
            <li key={toque.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-text-muted w-16 shrink-0">Toque {toque.step}</span>
              <span className={`w-20 shrink-0 ${meta.cor}`}>{meta.label}</span>
              <span className="text-text-muted text-xs">{data}</span>
              {toque.status === "sent" && (
                <button
                  onClick={() =>
                    run(
                      () => reopenTouch(toque),
                      `Toque ${toque.step} devolvido à fila de hoje.`,
                    )
                  }
                  title="Marca como não enviado e devolve o lead à fila de hoje."
                  className="text-accent ml-auto text-xs underline underline-offset-2"
                >
                  não foi enviado
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-muted text-xs">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
