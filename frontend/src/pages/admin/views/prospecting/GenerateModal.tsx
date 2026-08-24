import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy, Upload, X } from "lucide-react";
import {
  getLeadAudit,
  publishPrototype,
  type Lead,
  type ProspectingSettings,
  canalDoLead,
} from "../../../../lib/prospecting";
import { buildBrief, slugFor } from "../../../../prototypes/brief";
import { parseAbordagem, validateHtml } from "../../../../prototypes/validate";

/**
 * Geração do protótipo em três etapas: copiar o brief, construir no Claude
 * Code, subir o arquivo pronto.
 *
 * O sistema não escreve mais o site. O que ele aporta é o brief — que aponta o
 * site atual de onde a skill extrai logo, fotos e cores — e a conferência do
 * que volta antes de publicar.
 */
export default function GenerateModal({
  lead,
  settings,
  onClose,
  onPublished,
}: {
  lead: Lead;
  settings: ProspectingSettings;
  onClose: () => void;
  onPublished: () => Promise<void>;
}) {
  const [brief, setBrief] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [abordagem, setAbordagem] = useState("");
  const [erros, setErros] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [publicando, setPublicando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const slug = slugFor(lead.name);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  useEffect(() => {
    let ativo = true;
    getLeadAudit(lead.id)
      .catch(() => null)
      .then((audit) => {
        if (!ativo) return;
        setBrief(
          buildBrief({
            lead,
            cityName: settings.cityName,
            senderName: settings.outreachSenderName,
            agencyName: settings.agencyName,
            findings: audit?.findings ?? [],
          }),
        );
      });
    return () => {
      ativo = false;
    };
  }, [lead, settings]);

  async function copiarBrief() {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function escolherArquivo(arquivo: File) {
    // O navegador nem sempre preenche o type de .html vindo do sistema de
    // arquivos, então a extensão é o critério confiável.
    if (!/\.html?$/i.test(arquivo.name)) {
      setErros([`"${arquivo.name}" não é um arquivo .html.`]);
      return;
    }
    const conteudo = await arquivo.text();
    const resultado = validateHtml(conteudo);
    setHtml(resultado.errors.length === 0 ? conteudo : null);
    setNomeArquivo(arquivo.name);
    setErros(resultado.errors);
    setAvisos(resultado.warnings);
  }

  async function publicar() {
    if (!html) return;
    const conferido = validateHtml(html);
    // O canal decide onde o link pode estar. Mesma regra que a publicação
    // aplica — conferir com outra não avisaria do erro que importa.
    const mensagens = parseAbordagem(abordagem, canalDoLead(lead));
    const problemas = [...conferido.errors, ...mensagens.errors];
    setAvisos([...conferido.warnings, ...mensagens.warnings]);
    if (problemas.length > 0) {
      setErros(problemas);
      return;
    }

    setPublicando(true);
    setErros([]);
    try {
      const resultado = await publishPrototype(
        lead,
        {
          html,
          pageTitle: conferido.title,
          messages: mensagens.messages,
          emailMessages: mensagens.emailMessages,
          subjects: mensagens.subjects,
        },
        { ttlDays: settings.prototypeTtlDays },
      );
      setLink(resultado.link);
      await onPublished();
    } catch (err) {
      setErros([err instanceof Error ? err.message : "Falha ao publicar."]);
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-300 flex items-start justify-center overflow-y-auto bg-[rgba(6,12,22,0.78)] p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Gerar protótipo de ${lead.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border bg-bg-alt w-full max-w-3xl rounded-2xl border shadow-xl">
        <header className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="font-family-display font-bold">Protótipo de {lead.name}</h2>
            <p className="text-text-muted text-sm">
              O site é construído por você no Claude Code. O sistema monta o brief e
              confere o arquivo antes de publicar.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1" aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5">
          {link ? (
            <div className="border-good/30 bg-good/8 rounded-lg border px-4 py-4">
              <p className="text-good mb-2 font-semibold">
                Publicado. A sequência de 4 toques já está agendada.
              </p>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="text-accent break-all underline underline-offset-2"
              >
                {link}
              </a>
              <button
                onClick={onClose}
                className="border-border mt-4 block rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <Passo numero={1} titulo="Copie o brief">
                <div className="border-border bg-bg mb-3 max-h-56 overflow-y-auto rounded-lg border p-3">
                  <pre className="text-text-muted font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {brief ?? "Montando…"}
                  </pre>
                </div>
                <button
                  onClick={copiarBrief}
                  disabled={!brief}
                  className="bg-accent inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {copiado ? <Check size={15} aria-hidden /> : <ClipboardCopy size={15} aria-hidden />}
                  {copiado ? "Copiado" : "Copiar brief"}
                </button>
              </Passo>

              <Passo numero={2} titulo="Construa no Claude Code">
                <p className="text-text-muted text-sm leading-relaxed">
                  Rode <code className="bg-bg rounded px-1.5 py-0.5">/prototipo-site</code>, cole o
                  brief e anexe imagens de inspiração.
                  {lead.website && " A skill extrai a logo, as fotos e as cores do site atual antes de desenhar."}
                </p>
                <p className="text-text-muted mt-2 text-sm">
                  Depois abra{" "}
                  <code className="bg-bg rounded px-1.5 py-0.5">prototipos/{slug}/index.html</code>{" "}
                  no navegador e ajuste até ficar bom.
                </p>
              </Passo>

              <Passo numero={3} titulo="Suba o arquivo e as mensagens">
                <input
                  ref={inputArquivo}
                  type="file"
                  accept=".html,text/html"
                  className="hidden"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) void escolherArquivo(arquivo);
                  }}
                />

                {/* Arrastar do gerenciador de arquivos é o gesto natural aqui:
                    o index.html acabou de ser aberto no navegador ao lado. */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastando(true);
                  }}
                  onDragLeave={() => setArrastando(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastando(false);
                    const arquivo = e.dataTransfer.files?.[0];
                    if (arquivo) void escolherArquivo(arquivo);
                  }}
                  onClick={() => inputArquivo.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      inputArquivo.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Arraste o index.html aqui ou clique para escolher"
                  className={`mb-3 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
                    arrastando
                      ? "border-accent bg-accent/8"
                      : html
                        ? "border-good/40 bg-good/6"
                        : "border-border hover:border-accent/50 hover:bg-surface-hover"
                  }`}
                >
                  <Upload
                    size={20}
                    aria-hidden
                    className={html ? "text-good" : "text-text-muted"}
                  />
                  {nomeArquivo ? (
                    <>
                      <span className="text-sm font-semibold">{nomeArquivo}</span>
                      <span className="text-text-muted text-xs">
                        {html ? "Pronto para publicar" : "Confira os erros abaixo"} · clique
                        ou arraste outro para trocar
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold">
                        Arraste o <code className="bg-bg rounded px-1">index.html</code> aqui
                      </span>
                      <span className="text-text-muted text-xs">ou clique para escolher</span>
                    </>
                  )}
                </div>

                <textarea
                  value={abordagem}
                  onChange={(e) => setAbordagem(e.target.value)}
                  rows={6}
                  placeholder={"Cole o conteúdo de abordagem.txt\n\nQuatro mensagens separadas por uma linha com ---\nO endereço do protótipo entra onde estiver {{link}}"}
                  className="border-border bg-bg w-full rounded-lg border p-3 font-mono text-xs"
                />

                {erros.length > 0 && (
                  <ul className="border-danger/30 bg-danger/8 text-danger mt-3 space-y-1 rounded-lg border px-4 py-3 text-sm">
                    {erros.map((erro) => (
                      <li key={erro}>{erro}</li>
                    ))}
                  </ul>
                )}
                {avisos.length > 0 && (
                  <ul className="border-warning/30 bg-warning/8 text-warning mt-3 space-y-1 rounded-lg border px-4 py-3 text-sm">
                    {avisos.map((aviso) => (
                      <li key={aviso}>{aviso}</li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={publicar}
                  disabled={publicando || !html || !abordagem.trim()}
                  className="bg-accent mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {publicando ? "Publicando…" : "Publicar protótipo"}
                </button>
              </Passo>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Passo({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="bg-accent/15 text-accent grid h-6 w-6 place-items-center rounded-full text-xs font-bold">
          {numero}
        </span>
        {titulo}
      </h3>
      {children}
    </section>
  );
}
