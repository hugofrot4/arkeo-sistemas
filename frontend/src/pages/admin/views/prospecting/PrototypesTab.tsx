import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy, Download, ExternalLink, Eye, Upload } from "lucide-react";
import { useAdmin } from "../../context";
import {
  extendPrototype,
  getPrototypeHtml,
  listPrototypes,
  setPrototypePublished,
  updatePrototypeHtml,
  type PrototypeListItem,
} from "../../../../lib/prospecting";
import { validateHtml } from "../../../../prototypes/validate";
import { relativeTime } from "./meta";

/**
 * Tudo que já foi publicado, com o link e o caminho de volta.
 *
 * Sem esta tela, um protótipo publicado só era alcançável pelo lead que o
 * gerou — e não havia como recuperar o arquivo, trocar por uma versão nova ou
 * saber quais links estão no ar.
 */
export default function PrototypesTab({ ttlDays }: { ttlDays: number }) {
  const { showToast } = useAdmin();
  const [itens, setItens] = useState<PrototypeListItem[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [copiado, setCopiado] = useState<number | null>(null);

  // A carga inicial vai por encadeamento de promessa, não por await dentro do
  // efeito: setState síncrono no corpo do efeito dispara renderização em
  // cascata. Mesmo padrão do resto do módulo.
  useEffect(() => {
    let ativo = true;
    listPrototypes()
      .then((lista) => ativo && setItens(lista))
      .catch(() => ativo && setItens([]));
    return () => {
      ativo = false;
    };
  }, []);

  const carregar = useCallback(async () => {
    try {
      setItens(await listPrototypes());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao carregar os protótipos.");
    }
  }, [showToast]);

  async function run(id: number, acao: () => Promise<unknown>, mensagem: string) {
    setBusy(id);
    try {
      await acao();
      await carregar();
      showToast(mensagem);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não deu certo.");
    } finally {
      setBusy(null);
    }
  }

  async function copiarLink(item: PrototypeListItem) {
    await navigator.clipboard.writeText(`${window.location.origin}/p/${item.slug}`);
    setCopiado(item.id);
    setTimeout(() => setCopiado(null), 2000);
  }

  async function baixar(item: PrototypeListItem) {
    setBusy(item.id);
    try {
      const html = await getPrototypeHtml(item.id);
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${item.slug}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao baixar.");
    } finally {
      setBusy(null);
    }
  }

  if (!itens) return <p className="text-text-muted py-10 text-center text-sm">Carregando…</p>;

  if (itens.length === 0) {
    return (
      <div className="border-border bg-surface text-text-muted rounded-xl border border-dashed p-8 text-center text-sm">
        <p className="mb-1 font-medium">Nenhum protótipo publicado ainda.</p>
        <p>
          Gere o primeiro na aba <strong>Leads</strong>.
        </p>
      </div>
    );
  }

  const noAr = itens.filter((i) => i.published && !expirou(i)).length;

  return (
    <div className="space-y-4">
      <p className="text-text-muted text-sm">
        {itens.length} protótipo{itens.length > 1 ? "s" : ""} · {noAr} no ar.
        Trocar o arquivo mantém o mesmo endereço, então o link que já foi enviado
        continua valendo.
      </p>

      <ul className="space-y-3">
        {itens.map((item) => (
          <Linha
            key={item.id}
            item={item}
            busy={busy === item.id}
            copiado={copiado === item.id}
            ttlDays={ttlDays}
            onCopiar={() => copiarLink(item)}
            onBaixar={() => baixar(item)}
            onTrocar={(html, titulo) =>
              run(
                item.id,
                () => updatePrototypeHtml(item.id, html, titulo),
                `Arquivo de ${item.leadName} trocado. O endereço continua o mesmo.`,
              )
            }
            onPublicar={(publicado) =>
              run(
                item.id,
                () => setPrototypePublished(item.id, publicado),
                publicado ? "Protótipo no ar." : "Protótipo tirado do ar.",
              )
            }
            onEstender={() =>
              run(
                item.id,
                () => extendPrototype(item.id, ttlDays),
                `Prazo estendido por mais ${ttlDays} dias.`,
              )
            }
          />
        ))}
      </ul>
    </div>
  );
}

function expirou(item: PrototypeListItem) {
  return !!item.expiresAt && new Date(item.expiresAt) < new Date();
}

function Linha({
  item,
  busy,
  copiado,
  ttlDays,
  onCopiar,
  onBaixar,
  onTrocar,
  onPublicar,
  onEstender,
}: {
  item: PrototypeListItem;
  busy: boolean;
  copiado: boolean;
  ttlDays: number;
  onCopiar: () => void;
  onBaixar: () => void;
  onTrocar: (html: string, titulo: string | null) => void;
  onPublicar: (publicado: boolean) => void;
  onEstender: () => void;
}) {
  const { showToast } = useAdmin();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  const vencido = expirou(item);
  const link = `${window.location.origin}/p/${item.slug}`;

  async function receber(arquivo: File) {
    if (!/\.html?$/i.test(arquivo.name)) {
      showToast(`"${arquivo.name}" não é um arquivo .html.`);
      return;
    }
    const conteudo = await arquivo.text();
    const conferido = validateHtml(conteudo);
    if (conferido.errors.length > 0) {
      showToast(conferido.errors[0]);
      return;
    }
    onTrocar(conteudo, conferido.title);
  }

  return (
    <li
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        const arquivo = e.dataTransfer.files?.[0];
        if (arquivo) void receber(arquivo);
      }}
      className={`rounded-xl border p-4 transition-colors ${
        arrastando ? "border-accent bg-accent/8" : "border-border bg-surface"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.leadName}</p>
          <p className="text-text-muted truncate text-xs">
            /p/{item.slug}
            {" · "}
            {new Date(item.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {item.views > 0 && (
            <span
              className="bg-good/15 text-good inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              title={item.lastViewedAt ? `Última visita ${relativeTime(item.lastViewedAt)}` : undefined}
            >
              <Eye size={12} aria-hidden />
              {item.views}
            </span>
          )}
          {vencido ? (
            <span className="bg-danger/12 text-danger rounded-full px-2.5 py-0.5 text-xs font-semibold">
              expirado
            </span>
          ) : item.published ? (
            <span className="bg-good/12 text-good rounded-full px-2.5 py-0.5 text-xs font-semibold">
              no ar
            </span>
          ) : (
            <span className="bg-text-muted/12 text-text-muted rounded-full px-2.5 py-0.5 text-xs font-semibold">
              fora do ar
            </span>
          )}
        </div>
      </div>

      {vencido && (
        <p className="border-danger/25 bg-danger/6 text-danger mb-3 rounded-lg border px-3 py-2 text-xs">
          O prazo acabou — quem abrir o link vê "protótipo não encontrado".
          <button onClick={onEstender} disabled={busy} className="ml-2 underline underline-offset-2">
            estender por {ttlDays} dias
          </button>
        </p>
      )}

      <input
        ref={inputArquivo}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) void receber(arquivo);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="border-border hover:bg-surface-hover inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
        >
          <ExternalLink size={14} aria-hidden />
          Abrir
        </a>
        <button
          onClick={onCopiar}
          className="border-border hover:bg-surface-hover inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
        >
          {copiado ? <Check size={14} aria-hidden /> : <ClipboardCopy size={14} aria-hidden />}
          {copiado ? "Copiado" : "Copiar link"}
        </button>
        <button
          onClick={onBaixar}
          disabled={busy}
          className="border-border hover:bg-surface-hover inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
        >
          <Download size={14} aria-hidden />
          Baixar
        </button>
        <button
          onClick={() => inputArquivo.current?.click()}
          disabled={busy}
          title="Troca o arquivo mantendo o mesmo endereço e o histórico de visitas."
          className="border-accent/40 text-accent hover:bg-accent/8 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
        >
          <Upload size={14} aria-hidden />
          {busy ? "Enviando…" : "Trocar arquivo"}
        </button>

        <button
          onClick={() => onPublicar(!item.published)}
          disabled={busy}
          className="text-text-muted hover:text-text ml-auto px-2 py-2 text-sm disabled:opacity-40"
        >
          {item.published ? "Tirar do ar" : "Colocar no ar"}
        </button>
      </div>
    </li>
  );
}
