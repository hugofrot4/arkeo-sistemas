import { useEffect, useState } from "react";
import { Check, ClipboardCopy, X } from "lucide-react";
import {
  getLeadAudit,
  publishPrototype,
  type Lead,
} from "../../../../lib/prospecting";
import { MAX_BATCH, buildPrompt, type PromptLead } from "../../../../prototypes/prompt";
import { parseCopyResponse } from "../../../../prototypes/validate";

/**
 * Geração do protótipo em duas etapas: o sistema monta o prompt, você roda no
 * Claude Code, cola a resposta de volta.
 *
 * O sistema não chama modelo nenhum. O que ele aporta é o que dá trabalho
 * reunir — os fatos verificados do lead, os achados da auditoria e o playbook
 * do ramo — e a conferência do que volta, campo por campo.
 */
export default function GenerateModal({
  leads,
  cityName,
  ttlDays,
  onClose,
  onPublished,
}: {
  leads: Lead[];
  cityName: string;
  ttlDays: number;
  onClose: () => void;
  onPublished: () => Promise<void>;
}) {
  const [entries, setEntries] = useState<PromptLead[] | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [buildError, setBuildError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [links, setLinks] = useState<{ name: string; link: string }[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all(
      leads.map(async (lead) => {
        const audit = await getLeadAudit(lead.id).catch(() => null);
        return {
          lead,
          cityName,
          findings: audit?.findings ?? [],
          // Página que monta no navegador não entrega texto legível — mandar a
          // casca vazia só encheria o prompt sem informar nada.
          siteText: audit?.jsRendered ? null : (audit?.pageText ?? null),
        } satisfies PromptLead;
      }),
    )
      .then((result) => {
        if (!active) return;
        setEntries(result);
        try {
          setPrompt(buildPrompt(result));
        } catch (err) {
          setBuildError(err instanceof Error ? err.message : "Não deu para montar o prompt.");
        }
      })
      .catch(() => active && setBuildError("Falha ao carregar as auditorias."));
    return () => {
      active = false;
    };
  }, [leads, cityName]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function publish() {
    if (!entries) return;
    setErrors([]);
    setPublishing(true);
    try {
      const { copies, errors: parseErrors } = parseCopyResponse(response, entries.length);
      if (parseErrors.length > 0) {
        setErrors(parseErrors);
        return;
      }
      // Publica um por vez: se o terceiro falhar, os dois primeiros já estão
      // no ar e aparecem na lista de links.
      const published: { name: string; link: string }[] = [];
      for (let i = 0; i < copies.length; i++) {
        const { link } = await publishPrototype(entries[i].lead, copies[i], { ttlDays });
        published.push({ name: entries[i].lead.name, link });
        setLinks([...published]);
      }
      await onPublished();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Falha ao publicar."]);
    } finally {
      setPublishing(false);
    }
  }

  const done = links.length > 0 && links.length === leads.length;

  return (
    <div
      className="bg-bg-menu fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Gerar protótipo"
    >
      <div className="border-border bg-bg-alt w-full max-w-3xl rounded-2xl border shadow-xl">
        <header className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="font-family-display font-bold">
              {leads.length === 1
                ? `Protótipo de ${leads[0].name}`
                : `${leads.length} protótipos`}
            </h2>
            <p className="text-text-muted text-sm">
              O conteúdo é escrito por você no Claude Code. O sistema monta o
              pedido e confere o que volta.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1" aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5">
          {buildError && (
            <p className="border-danger/30 bg-danger/8 text-danger rounded-lg border px-4 py-3 text-sm">
              {buildError}
            </p>
          )}

          {!buildError && !entries && (
            <p className="text-text-muted text-sm">Montando o prompt…</p>
          )}

          {!buildError && entries && !done && (
            <>
              <Step number={1} title="Copie o prompt e rode no Claude Code">
                <div className="border-border bg-bg mb-3 max-h-64 overflow-y-auto rounded-lg border p-3">
                  <pre className="text-text-muted font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {prompt}
                  </pre>
                </div>
                <button
                  onClick={copyPrompt}
                  className="bg-accent inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                >
                  {copied ? <Check size={15} aria-hidden /> : <ClipboardCopy size={15} aria-hidden />}
                  {copied ? "Copiado" : "Copiar prompt"}
                </button>
                <p className="text-text-muted mt-2 text-xs">
                  {prompt.length.toLocaleString("pt-BR")} caracteres
                  {leads.length > 1 && ` · ${leads.length} negócios do mesmo template`}
                </p>
              </Step>

              <Step number={2} title="Cole a resposta aqui">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={7}
                  placeholder='Cole a resposta inteira, incluindo o bloco ```json'
                  className="border-border bg-bg w-full rounded-lg border p-3 font-mono text-xs"
                />
                {errors.length > 0 && (
                  <ul className="border-danger/30 bg-danger/8 text-danger mt-3 space-y-1 rounded-lg border px-4 py-3 text-sm">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={publish}
                  disabled={publishing || !response.trim()}
                  className="bg-accent mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {publishing
                    ? "Publicando…"
                    : leads.length === 1
                      ? "Conferir e publicar"
                      : `Conferir e publicar ${leads.length}`}
                </button>
              </Step>
            </>
          )}

          {links.length > 0 && (
            <div className="border-good/30 bg-good/8 rounded-lg border px-4 py-3">
              <p className="text-good mb-2 text-sm font-semibold">
                {done ? "Publicado. A sequência de 4 toques já está agendada." : "Publicando…"}
              </p>
              <ul className="space-y-1">
                {links.map((item) => (
                  <li key={item.link} className="text-sm">
                    <span className="text-text-muted">{item.name}: </span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent break-all underline underline-offset-2"
                    >
                      {item.link}
                    </a>
                  </li>
                ))}
              </ul>
              {done && (
                <button
                  onClick={onClose}
                  className="border-border mt-3 rounded-lg border px-4 py-2 text-sm font-semibold"
                >
                  Fechar
                </button>
              )}
            </div>
          )}

          {leads.length > MAX_BATCH && (
            <p className="text-warning text-sm">
              Máximo de {MAX_BATCH} por vez — acima disso a resposta fica longa
              demais e a qualidade cai.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="bg-accent/15 text-accent grid h-6 w-6 place-items-center rounded-full text-xs font-bold">
          {number}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
