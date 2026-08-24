import { useState } from "react";
import { Ban, Check, ClipboardCopy, ExternalLink, Flame, History, Mail, MessageCircle, Pencil, SkipForward } from "lucide-react";
import { useAdmin } from "../../context";
import {
  cancelRemainingTouches,
  emailLink,
  markTouchSent,
  setLeadChannel,
  updateLead,
  updateTouch,
  markViewed,
  restartOutreach,
  skipTouch,
  whatsappLink,
  type HotLead,
  type QueueItem,
} from "../../../../lib/prospecting";
import { buildHotFollowUp, hotFollowUpSubject } from "../../../../lib/outreachOpener";
import { FASES, SEGMENT_META, nicheLabel, relativeTime } from "./meta";
import { formatarTelefoneBr, parseTelefoneBr } from "../../../../lib/phoneBr";
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

  const identidade = {
    senderName: data.settings?.outreachSenderName ?? "Sara",
    agencyName: data.settings?.agencyName ?? "Arkeo Sistemas",
  };
  const cap = data.settings?.dailyOutreachCap ?? 40;
  const remaining = Math.max(0, cap - data.sentToday);

  // Quem abriu o protótipo e TEM toque vencido fica na fila, marcado e no
  // topo: é lá que estão a mensagem, o editar e o envio em dois passos. O
  // bloco de cima guarda só quem abriu e não tem toque hoje — para esses não
  // haveria card nenhum, e o sinal se perderia.
  const visitasPorLead = new Map(data.hot.map((h) => [h.leadId, h]));
  const naFila = new Set(data.queue.map((t) => t.leadId));
  const quentesSemToque = data.hot.filter((h) => !naFila.has(h.leadId));

  // Ordem: quem abriu o protótipo, depois quem teve a sequência reiniciada,
  // depois score. O reinício sobe porque é um lead já trabalhado — tem
  // protótipo publicado e histórico —, e retomá-lo custa menos que abrir um
  // novo do zero.
  const fila = [...data.queue].sort((a, b) => {
    const qa = visitasPorLead.has(a.leadId) ? 1 : 0;
    const qb = visitasPorLead.has(b.leadId) ? 1 : 0;
    if (qa !== qb) return qb - qa;
    const ra = a.lead.outreachRestartedAt ? 1 : 0;
    const rb = b.lead.outreachRestartedAt ? 1 : 0;
    if (ra !== rb) return rb - ra;
    return b.lead.score - a.lead.score;
  });

  const visiveis = fila.slice(0, remaining || undefined);

  /**
   * Registra o envio. Só roda depois de o operador confirmar que mandou —
   * abrir a conversa não é enviar, e marcar no clique registrava envio que
   * podia não ter acontecido (pop-up bloqueado, número sem WhatsApp, desistiu).
   */
  async function handleConfirm(item: QueueItem, canal: "whatsapp" | "email") {
    setBusy(item.id);
    try {
      const resultado = await markTouchSent(item, canal);
      await refresh();
      const quando = resultado.nextTouchDate
        ? new Date(`${resultado.nextTouchDate}T12:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })
        : null;
      // O lead sai da fila de hoje ao ser marcado. Dizer quando ele volta evita
      // a sensação de que sumiu — e quando o próximo toque muda de canal ele
      // não sai: já está de volta, agora, para outra pessoa.
      const proximoCanal = resultado.nextChannel === "email" ? "e-mail" : "WhatsApp";
      showToast(
        resultado.eraRoteamento && resultado.nextAntecipado
          ? `Pergunta enviada. A entrega já está na fila: veio o e-mail, use "Adicionar e-mail" e mande por lá. Sem resposta, espere um dia antes de mandar pelo WhatsApp.`
          : resultado.nextAntecipado
            ? `Toque ${item.step} registrado. O toque ${resultado.nextStep} vai por ${proximoCanal}, para outra pessoa — já está na fila, pode mandar agora.`
            : quando
              ? `Toque ${item.step} registrado. ${item.lead.name} volta à fila em ${quando} para o toque ${resultado.nextStep}.`
              : `Toque ${item.step} registrado. Era o último da sequência de ${item.lead.name}.`,
      );
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
      showToast("Toque adiado. O lead continua na sequência.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao pular.");
    } finally {
      setBusy(null);
    }
  }

  /**
   * Tira o lead da fila sem encerrá-lo: cancela os toques agendados e para
   * por aí. O lead continua na base, no estágio em que está, e pode ser
   * retomado depois — gerar um protótipo novo reabre a sequência.
   *
   * É diferente de "pular", que só adia o toque de hoje, e de marcar como
   * perdido na aba Leads, que fecha o lead de vez.
   */
  async function handleRemoveFromQueue(leadId: number, nome: string, chave: number) {
    setBusy(chave);
    try {
      await cancelRemainingTouches(leadId);
      await refresh();
      showToast(`${nome} saiu da fila. O lead continua na aba Leads.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao tirar da fila.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {quentesSemToque.length > 0 && (
        <HotBlock
          hot={quentesSemToque}
          refresh={refresh}
          identity={identidade}
        />
      )}

      <section>
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-family-display text-lg font-bold">Fila de hoje</h2>
            <p className="text-text-muted text-sm">
              Agrupada pela fase da conversa. Dentro de cada uma, do maior score
              para o menor.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums">
              {data.sentToday} / {cap}
            </p>
            <p className="text-text-muted text-xs">enviados hoje</p>
          </div>
        </header>

        {remaining === 0 && fila.length > 0 && (
          <p className="border-warning/30 bg-warning/8 text-warning mb-4 rounded-lg border px-4 py-3 text-sm">
            Régua do dia atingida. Parar aqui é de propósito: volume alto num dia só
            é o que faz número ser marcado como spam.
          </p>
        )}

        {fila.length === 0 ? (
          <EmptyQueue />
        ) : (
          <div className="space-y-5">
            {FASES.map((fase) => {
              const daFase = visiveis.filter((t) => t.step === fase.step);
              if (daFase.length === 0) return null;
              return (
                <section
                  key={fase.step}
                  className={`rounded-xl border p-3 sm:p-4 ${fase.className}`}
                >
                  <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className={`font-family-display font-bold ${fase.texto}`}>
                      {fase.step}. {fase.titulo}
                    </h3>
                    <span className={`text-xs font-bold tabular-nums ${fase.texto}`}>
                      {daFase.length}
                    </span>
                    <p className="text-text-muted w-full text-xs sm:w-auto sm:flex-1">
                      {fase.objetivo} Pede <strong>{fase.pede}</strong>.
                    </p>
                  </header>
                  <ul className="space-y-3">
                    {daFase.map((item) => (
                      <QueueCard
                        key={item.id}
                        item={item}
                        identity={identidade}
                        visita={visitasPorLead.get(item.leadId)}
                        busy={busy === item.id}
                        onConfirm={(canal) => handleConfirm(item, canal)}
                        onSkip={() => handleSkip(item)}
                        onRemove={() =>
                          handleRemoveFromQueue(item.leadId, item.lead.name, item.id)
                        }
                        refresh={refresh}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
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
  visita,
  identity,
  onConfirm,
  onSkip,
  onRemove,
  refresh,
}: {
  item: QueueItem;
  visita?: HotLead;
  busy: boolean;
  identity: { senderName: string; agencyName: string };
  onConfirm: (canal: "whatsapp" | "email") => void;
  onSkip: () => void;
  onRemove: () => void;
  refresh: () => Promise<void>;
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
          {!visita && item.lead.outreachRestartedAt && item.step === 1 && (
            <Badge className="bg-accent/15 text-accent">
              <History size={11} className="mr-1 inline" aria-hidden />
              retomado
            </Badge>
          )}
          {visita && (
            <Badge className="bg-good/20 text-good">
              <Flame size={11} className="mr-1 inline" aria-hidden />
              abriu {visita.views}× · {relativeTime(visita.lastViewedAt)}
            </Badge>
          )}
          <Badge className={segment.className}>{segment.label}</Badge>
          <Badge className="bg-text-muted/12 text-text-muted">Toque {item.step}</Badge>
          <CanalDoToque item={item} refresh={refresh} />
        </div>
      </div>

      {/* Texto e botões do mesmo canal moram na mesma caixa: é uma decisão só
          — mandar por aqui ou por ali —, e ela se toma lendo o texto. Os dois
          canais aparecem sempre, porque o canal do toque é uma sugestão: quem
          responde decide por onde a conversa segue. */}
      <TextoDoToque
        item={item}
        refresh={refresh}
        acaoWhatsapp={
          <WhatsAppDoLead item={item} busy={busy} onConfirm={onConfirm} onSalvo={refresh} />
        }
        acaoEmail={
          <EmailDoLead item={item} busy={busy} onConfirm={onConfirm} onSalvo={refresh} />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
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

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onSkip}
            disabled={busy}
            title="Adia só o toque de hoje. O lead continua na sequência."
            className="text-text-muted hover:text-text inline-flex items-center gap-1.5 px-2 py-2 text-sm disabled:opacity-50"
          >
            <SkipForward size={15} aria-hidden />
            Pular
          </button>
          <ReiniciarSequencia item={item} identity={identity} refresh={refresh} />
          <button
            onClick={onRemove}
            disabled={busy}
            title="Cancela os toques agendados. O lead continua na aba Leads e pode ser retomado."
            className="text-text-muted hover:text-warning inline-flex items-center gap-1.5 px-2 py-2 text-sm disabled:opacity-50"
          >
            <Ban size={15} aria-hidden />
            Tirar da fila
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * Devolve o lead ao toque 1, do card.
 *
 * Existia só em lote, na aba Hoje, e uma vez por lead: quem já tinha sido
 * reiniciado saía da lista de candidatos e não voltava. Mas recomeçar é
 * rotina, não migração — a conversa esfria, o texto muda, o número errado
 * aparece —, e sem isto cada recomeço virava uma edição no banco.
 *
 * Confirma antes porque apaga o histórico de envio da sequência.
 */
function ReiniciarSequencia({
  item,
  identity,
  refresh,
}: {
  item: QueueItem;
  identity: { senderName: string; agencyName: string };
  refresh: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [confirmando, setConfirmando] = useState(false);
  const [rodando, setRodando] = useState(false);

  async function reiniciar() {
    setRodando(true);
    try {
      await restartOutreach(
        {
          leadId: item.leadId,
          name: item.lead.name,
          niche: item.lead.niche,
          segment: item.lead.segment,
          channel: item.channel,
        },
        identity,
      );
      await refresh();
      showToast(`Sequência de ${item.lead.name} reiniciada no toque 1.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao reiniciar.");
    } finally {
      setRodando(false);
      setConfirmando(false);
    }
  }

  if (confirmando) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={reiniciar}
          disabled={rodando}
          className="text-warning px-2 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {rodando ? "Reiniciando…" : "Confirmar reinício"}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-text-muted hover:text-text px-2 py-2 text-sm"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      title="Volta ao toque 1 e reagenda a sequência a partir de hoje. Apaga o histórico de envio."
      className="text-text-muted hover:text-text inline-flex items-center gap-1.5 px-2 py-2 text-sm"
    >
      <History size={15} aria-hidden />
      Reiniciar
    </button>
  );
}

/**
 * Registra o e-mail que a recepção passou, sem sair da fila.
 *
 * É o fecho do caminho: o WhatsApp do Google atende à recepção, então o toque
 * por lá pergunta com quem falar sobre o site. Veio o e-mail de quem decide,
 * ele entra aqui e os toques que faltam passam a sair por lá — sem esse campo,
 * a resposta obrigava a ir até a aba Leads e voltar.
 */
function AdicionarEmail({
  item,
  onSalvo,
}: {
  item: QueueItem;
  onSalvo: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

  async function salvar() {
    if (!valido) return;
    setSalvando(true);
    try {
      await updateLead(item.leadId, { email: valor.trim(), verifiedByHuman: true });
      // Os toques que faltam passam a sair por e-mail: é o canal de quem
      // decide, e foi por isso que se pediu o contato.
      await setLeadChannel(item.leadId, "email");
      await onSalvo();
      showToast(`E-mail de ${item.lead.name} salvo. Os toques restantes vão por e-mail.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao salvar o e-mail.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="border-warning/30 text-warning rounded-lg border px-3 py-2 text-xs">
          Sem e-mail cadastrado.
        </span>
        <button
          onClick={() => setAberto(true)}
          className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white"
        >
          Adicionar e-mail
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          type="email"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valido) void salvar();
            if (e.key === "Escape") setAberto(false);
          }}
          placeholder="responsavel@empresa.com.br"
          className="border-border bg-bg w-64 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          onClick={salvar}
          disabled={!valido || salvando}
          className="bg-good rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={() => setAberto(false)}
          className="text-text-muted hover:text-text px-2 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
      <p className="text-text-muted mt-1.5 text-xs">
        O e-mail de quem decide sobre o site. Os toques que faltam passam a sair por ele.
      </p>
    </div>
  );
}

/**
 * Canal deste toque, trocável.
 *
 * Fica no toque e não só no lead porque os dois contatos costumam ser pessoas
 * diferentes: o WhatsApp que o Google mostra é quase sempre a recepção, que
 * não decide sobre site, enquanto o e-mail do rodapé chega mais perto de quem
 * decide. Alternar os toques cobre as duas sem dobrar o número de mensagens —
 * oito contatos a quem nunca respondeu é o que gera denúncia, e denúncia é o
 * que derruba o número.
 */
function CanalDoToque({
  item,
  refresh,
}: {
  item: QueueItem;
  refresh: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [trocando, setTrocando] = useState(false);

  const outro = item.channel === "whatsapp" ? "email" : "whatsapp";
  const podeTrocar = outro === "email" ? !!item.lead.email : !!item.lead.phoneE164;

  async function trocar() {
    setTrocando(true);
    try {
      await updateTouch(item.id, { channel: outro });
      await refresh();
      showToast(`Toque ${item.step} passa a sair por ${outro === "email" ? "e-mail" : "WhatsApp"}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao trocar o canal.");
    } finally {
      setTrocando(false);
    }
  }

  return (
    <button
      onClick={trocar}
      disabled={!podeTrocar || trocando}
      title={
        podeTrocar
          ? `Enviar este toque por ${outro === "email" ? "e-mail" : "WhatsApp"}`
          : outro === "email"
            ? "O lead não tem e-mail cadastrado."
            : "O lead não tem telefone cadastrado."
      }
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
        item.channel === "email"
          ? "bg-accent/15 text-accent hover:bg-accent/25"
          : "bg-good/15 text-good hover:bg-good/25"
      }`}
    >
      {item.channel === "email" ? <Mail size={11} aria-hidden /> : <MessageCircle size={11} aria-hidden />}
      {item.channel === "email" ? "e-mail" : "WhatsApp"}
    </button>
  );
}

/**
 * O texto do toque, editável.
 *
 * A sequência é escrita na geração e fica congelada. Precisa mudar quando o
 * lead troca de canal — e nos leads gerados antes, onde a primeira mensagem de
 * WhatsApp carrega o link, que é o padrão que restringe o número.
 */
function TextoDoToque({
  item,
  refresh,
  acaoWhatsapp,
  acaoEmail,
}: {
  item: QueueItem;
  refresh: () => Promise<void>;
  acaoWhatsapp: React.ReactNode;
  acaoEmail: React.ReactNode;
}) {
  const { showToast } = useAdmin();
  const [editando, setEditando] = useState(false);
  const [corpo, setCorpo] = useState(item.body);
  const [corpoEmail, setCorpoEmail] = useState(item.bodyEmail ?? "");
  const [assunto, setAssunto] = useState(item.subject ?? "");
  const [salvando, setSalvando] = useState(false);

  const temLink = (t: string | null) => !!t && /https?:\/\/\S+\/p\//.test(t);
  const alertaLink = item.channel === "whatsapp" && item.step === 1 && temLink(item.body);

  // O toque 1 e o toque 2 podem os dois carregar o link — só um dos caminhos
  // acontece por lead, mas nada impede mandar os dois. Mandar a mesma prévia
  // duas vezes é o que faz a sequência parecer automatizada.
  const repeteEntrega =
    item.linkJaEntregue && (temLink(item.body) || temLink(item.bodyEmail));

  async function salvar() {
    setSalvando(true);
    try {
      // Os três campos de uma vez: as duas redações vivem no mesmo toque, e
      // abrir o editor duas vezes para trocar de canal era trabalho à toa.
      await updateTouch(item.id, {
        body: corpo,
        bodyEmail: corpoEmail.trim() || null,
        subject: assunto.trim() || null,
      });
      await refresh();
      setEditando(false);
      showToast("Mensagem atualizada.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (editando) {
    return (
      <div className="mb-3 space-y-3">
        <div>
          <label className="text-text-muted mb-1 block text-xs font-semibold">
            Texto para WhatsApp
          </label>
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={6}
            className="border-border bg-bg w-full rounded-lg border p-3 text-sm leading-relaxed"
          />
        </div>
        <div>
          <label className="text-text-muted mb-1 block text-xs font-semibold">
            Texto para e-mail
          </label>
          <input
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Assunto do e-mail"
            className="border-border bg-bg mb-2 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={corpoEmail}
            onChange={(e) => setCorpoEmail(e.target.value)}
            rows={7}
            placeholder="Vazio: o card usa o texto de WhatsApp e avisa."
            className="border-border bg-bg w-full rounded-lg border p-3 text-sm leading-relaxed"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={salvar}
            disabled={salvando || !corpo.trim()}
            className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          <button
            onClick={() => {
              setCorpo(item.body);
              setCorpoEmail(item.bodyEmail ?? "");
              setAssunto(item.subject ?? "");
              setEditando(false);
            }}
            className="text-text-muted hover:text-text px-2 py-2 text-sm"
          >
            Cancelar
          </button>
          <span className="text-text-muted ml-auto text-xs tabular-nums">
            {corpo.length}/900
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      {repeteEntrega && (
        <p className="border-warning/30 bg-warning/8 text-warning mb-2 rounded-lg border px-3 py-2 text-xs">
          A prévia já foi entregue num toque anterior, e este texto manda o link
          de novo. Reescreva retomando o que já foi dito, ou pule o toque — a
          mesma mensagem duas vezes é o que faz a sequência parecer disparo.
        </p>
      )}
      {alertaLink && (
        <p className="border-warning/30 bg-warning/8 text-warning mb-2 rounded-lg border px-3 py-2 text-xs">
          Esta mensagem leva o link já no primeiro toque — é o padrão que faz o
          WhatsApp restringir o número. O primeiro toque só pergunta com quem
          falar sobre o site; o link entra no toque 2, que é onde a entrega
          acontece.
        </p>
      )}
      <CaixaDoCanal
        titulo="WhatsApp"
        destaque={item.channel === "whatsapp"}
        corpo={item.body}
        aoEditar={() => setEditando(true)}
        acao={acaoWhatsapp}
      />
      <CaixaDoCanal
        titulo="E-mail"
        destaque={item.channel === "email"}
        assunto={item.subject}
        corpo={item.bodyEmail}
        reserva={item.bodyEmail ? null : item.body}
        aoEditar={() => setEditando(true)}
        acao={acaoEmail}
      />
    </div>
  );
}

/**
 * Uma das duas redações do toque, pronta para copiar.
 *
 * As duas ficam à vista ao mesmo tempo, e não só a do canal ativo. O canal de
 * um toque muda no meio do caminho — a recepção responde com o e-mail de quem
 * decide, e a entrega passa a sair por lá —, e antes disto o texto do outro
 * canal simplesmente não existia na tela: era preciso trocar o canal do toque
 * para vê-lo, ou reescrever à mão.
 *
 * `reserva` é o corpo de WhatsApp usado quando a versão de e-mail não foi
 * escrita. Mandar o texto do outro canal é melhor que não ter o que mandar,
 * mas o registro fica visível, porque o tamanho e o tom são de outro canal.
 */
function CaixaDoCanal({
  titulo,
  destaque,
  assunto,
  corpo,
  reserva,
  aoEditar,
  acao,
}: {
  titulo: string;
  destaque: boolean;
  assunto?: string | null;
  corpo: string | null;
  reserva?: string | null;
  aoEditar: () => void;
  acao: React.ReactNode;
}) {
  const texto = corpo ?? reserva;
  if (!texto) return null;

  return (
    <div className={`mb-2 rounded-lg border p-3 ${destaque ? "border-accent/40 bg-accent/5" : "border-border bg-bg"}`}>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold ${destaque ? "text-accent" : "text-text-muted"}`}>
          {titulo}
        </span>
        {destaque && (
          <span className="bg-accent/15 text-accent rounded-full px-2 py-px text-[0.65rem] font-bold">
            canal deste toque
          </span>
        )}
        <span className="ml-auto flex items-center gap-3">
          <Copiar texto={texto} rotulo="copiar texto" />
          <button
            onClick={aoEditar}
            className="text-accent inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            <Pencil size={11} aria-hidden />
            editar
          </button>
        </span>
      </div>

      {assunto && (
        <p className="text-text-muted mb-1.5 flex items-center gap-2 text-xs">
          <span className="min-w-0 truncate">
            <strong>Assunto:</strong> {assunto}
          </span>
          <Copiar texto={assunto} rotulo="copiar assunto" />
        </p>
      )}

      {!corpo && reserva && (
        <p className="text-warning mb-1.5 text-xs">
          Sem redação própria para e-mail — este é o texto de WhatsApp. Use o
          editar para escrever a versão de e-mail.
        </p>
      )}

      <p className="text-text-muted max-h-40 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
        {texto}
      </p>

      <div className="border-border/60 mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        {acao}
      </div>
    </div>
  );
}

/**
 * Copia o texto para a área de transferência.
 *
 * O `mailto:` do "Abrir e-mail" resolve para quem usa cliente instalado, mas
 * não para quem escreve no Gmail pelo navegador — lá o link ou não abre nada
 * ou abre uma janela que perde a formatação de corpos longos. Copiar e colar
 * funciona em qualquer caixa, e assunto e corpo vão separados porque é em
 * campos separados que eles são colados.
 */
function Copiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
      className="text-text-muted hover:text-text inline-flex shrink-0 items-center gap-1 text-xs underline underline-offset-2"
    >
      {copiado ? <Check size={11} aria-hidden /> : <ClipboardCopy size={11} aria-hidden />}
      {copiado ? "copiado" : rotulo}
    </button>
  );
}

/**
 * Toque por e-mail: abre o cliente com destinatário, assunto e texto prontos.
 *
 * Mesmo desenho de dois passos do WhatsApp — abrir não é enviar, e só a
 * confirmação registra o toque. Aqui isso pesa ainda mais: o cliente de
 * e-mail abre numa aba separada e é fácil fechar sem mandar.
 */
function EmailDoLead({
  item,
  busy,
  onConfirm,
  onSalvo,
}: {
  item: QueueItem;
  busy: boolean;
  onConfirm: (canal: "whatsapp" | "email") => void;
  onSalvo: () => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const assunto = item.subject ?? `Uma prévia do site da ${item.lead.name}`;
  // A redação de e-mail, sempre — este botão é o do canal e-mail, e o canal
  // gravado no toque é só a sugestão de por onde começar. Cai no corpo de
  // WhatsApp apenas quando a versão de e-mail não foi escrita, que é o mesmo
  // que a caixa acima mostra.
  const texto = item.bodyEmail ?? item.body;

  if (!item.lead.email) {
    return <AdicionarEmail item={item} onSalvo={onSalvo} />;
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <button
        onClick={() => {
          window.location.href = emailLink(item.lead.email!, assunto, texto);
          setAberto(true);
        }}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
          aberto ? "border-border text-text-muted border" : "bg-accent text-white"
        }`}
      >
        <Mail size={16} aria-hidden />
        {aberto ? "Abrir de novo" : "Abrir e-mail"}
      </button>

      {/* Quem escreve no Gmail pelo navegador não passa pelo `mailto:`, e sem
          isto o "Confirmar envio" nunca aparecia para essa pessoa: ele só
          surgia depois de abrir o cliente. Copiar conta como ter começado. */}
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(texto);
          setAberto(true);
        }}
        disabled={busy}
        className="border-border hover:bg-surface-hover inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        <ClipboardCopy size={16} aria-hidden />
        Copiar texto
      </button>

      {aberto && (
        <>
          <button
            onClick={() => onConfirm("email")}
            disabled={busy}
            className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check size={15} className="mr-1.5 inline" aria-hidden />
            {busy ? "Registrando…" : "Confirmar envio"}
          </button>
          <button
            onClick={() => setAberto(false)}
            disabled={busy}
            className="text-text-muted hover:text-text px-2 py-2 text-sm disabled:opacity-50"
          >
            Não enviei
          </button>
        </>
      )}

      <span className="text-text-muted text-xs">{item.lead.email}</span>

      {aberto && (
        <p className="text-text-muted w-full text-xs">
          Mande de uma caixa sua e volte aqui para confirmar. O assunto tem o
          próprio "copiar" logo acima do texto. O toque só é registrado depois
          da confirmação.
        </p>
      )}
    </div>
  );
}

/**
 * O número do lead na fila: mostra, deixa enviar e deixa corrigir.
 *
 * Duas coisas que faltavam. Sem WhatsApp válido o card não oferecia ação
 * nenhuma, e corrigir exigia sair da fila. Com WhatsApp válido o número nem
 * aparecia — um dígito errado só seria descoberto quando a conversa abrisse,
 * e nesse ponto o toque já teria sido marcado como enviado.
 *
 * Salvar marca `verifiedByHuman`: número conferido por gente não é
 * sobrescrito pela coleta automática depois.
 */
function WhatsAppDoLead({
  item,
  busy,
  onConfirm,
  onSalvo,
}: {
  item: QueueItem;
  busy: boolean;
  onConfirm: (canal: "whatsapp" | "email") => void;
  onSalvo: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [conversaAberta, setConversaAberta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Dá para enviar sempre que houver número válido. Fixo pode ter WhatsApp
  // Business, e se não tiver o próprio WhatsApp avisa — o custo de tentar é
  // zero, e antes o lead ficava parado na fila sem ação nenhuma.
  const temNumero = !!item.lead.phoneE164;

  // A marca "(fixo)" sai do formato do número que está na tela, não só da
  // coluna `whatsapp_valid`. A coluna é gravada quando o lead é coletado e
  // pode ficar para trás — e ver "(fixo)" ao lado de um celular contradiz o
  // que o operador está lendo.
  const pareceCelular = parseTelefoneBr(item.lead.phone ?? item.lead.phoneE164 ?? "").isMobile;
  const incerto = temNumero && !item.lead.whatsappValid && !pareceCelular;
  const telefone = parseTelefoneBr(valor);

  function abrir() {
    // Pré-preenche com o que já existe: corrigir um dígito não deve exigir
    // redigitar o número inteiro.
    setValor(item.lead.phone ? formatarTelefoneBr(item.lead.phone) : "");
    setEditando(true);
  }

  async function salvar() {
    if (!telefone.e164) return;
    setSalvando(true);
    try {
      await updateLead(item.leadId, {
        phone: valor,
        phoneE164: telefone.e164,
        // Digitou um fixo aqui de propósito? Então é porque sabe que tem
        // WhatsApp — a conferência humana vale mais que o formato.
        whatsappValid: true,
        verifiedByHuman: true,
      });
      await onSalvo();
      // Fechar e destravar à mão: o card não remonta depois do refresh, porque
      // a chave da lista é o id do toque e ele não muda. Contar com a
      // remontagem deixava o botão preso em "Salvando…" para sempre.
      setEditando(false);
      // Trocar o número invalida a conversa que estava aberta: confirmar ali
      // registraria um envio para o número antigo.
      setConversaAberta(false);
      showToast(`WhatsApp de ${item.lead.name} salvo.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao salvar o número.");
    } finally {
      setSalvando(false);
    }
  }

  if (editando) {
    return (
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={valor}
            onChange={(e) => setValor(formatarTelefoneBr(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && telefone.e164) void salvar();
              if (e.key === "Escape") setEditando(false);
            }}
            placeholder="(85) 98765-4321"
            className="border-border bg-bg w-44 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={salvar}
            disabled={!telefone.e164 || salvando}
            className="bg-good rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          <button
            onClick={() => setEditando(false)}
            className="text-text-muted hover:text-text px-2 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
        {valor.trim() && telefone.motivo && (
          <p
            className={`mt-1.5 text-xs ${telefone.e164 ? "text-text-muted" : "text-warning"}`}
          >
            {telefone.motivo}
          </p>
        )}
      </div>
    );
  }

  function abrirConversa() {
    if (!item.lead.phoneE164) return;
    window.open(whatsappLink(item.lead.phoneE164, item.body), "_blank", "noopener");
    setConversaAberta(true);
  }

  if (temNumero) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2">
        <button
          onClick={abrirConversa}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
            conversaAberta
              ? "border-border text-text-muted border"
              : "bg-good text-white"
          }`}
        >
          <MessageCircle size={16} aria-hidden />
          {conversaAberta ? "Abrir de novo" : "Abrir conversa"}
        </button>

        {conversaAberta && (
          <>
            <button
              onClick={() => onConfirm("whatsapp")}
              disabled={busy}
              className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check size={15} className="mr-1.5 inline" aria-hidden />
              {busy ? "Registrando…" : "Confirmar envio"}
            </button>
            <button
              onClick={() => setConversaAberta(false)}
              disabled={busy}
              className="text-text-muted hover:text-text px-2 py-2 text-sm disabled:opacity-50"
            >
              Não enviei
            </button>
          </>
        )}
        {/* O número fica à vista: é a única chance de perceber um dígito errado
            antes de a conversa abrir e o toque virar enviado. */}
        <span className="text-text-muted text-xs">
          {item.lead.phone ?? item.lead.phoneE164}
          {incerto && (
            <span className="text-warning ml-1.5" title="Linha fixa. Pode ter WhatsApp Business — se não tiver, o WhatsApp avisa ao abrir.">
              (fixo)
            </span>
          )}
          <button
            onClick={abrir}
            className="text-accent ml-1.5 underline underline-offset-2"
          >
            editar
          </button>
        </span>

        {conversaAberta && (
          <p className="text-text-muted w-full text-xs">
            Mande a mensagem no WhatsApp e volte aqui para confirmar. O toque só
            é registrado depois da confirmação.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="border-warning/30 text-warning rounded-lg border px-3 py-2 text-xs">
        Sem telefone cadastrado.
      </span>
      <button
        onClick={abrir}
        className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white"
      >
        Adicionar WhatsApp
      </button>

    </div>
  );
}

/**
 * Bloco de leads quentes: quem abriu o protótipo. Fica fora da sequência
 * agendada de propósito — o momento certo de falar é agora, não no dia que o
 * cronograma diz.
 */
function HotBlock({
  hot,
  refresh,
  identity,
}: {
  hot: HotLead[];
  refresh: () => Promise<void>;
  identity: { senderName: string; agencyName: string };
}) {
  const { showToast } = useAdmin();

  // Abrir o protótipo não obriga a seguir. Aqui também é só sair da fila: o
  // lead fica na base, no estágio em que está.
  async function removeFromQueue(item: HotLead) {
    try {
      await cancelRemainingTouches(item.leadId);
      await refresh();
      showToast(`${item.lead.name} saiu da fila. O lead continua na aba Leads.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao tirar da fila.");
    }
  }

  /**
   * Abre a conversa pelo canal que o lead tem.
   *
   * Antes ia sempre para o WhatsApp e, sem telefone, não abria nada: o botão
   * ficava lá e o clique não fazia efeito nenhum. E o texto era o mesmo para
   * todo mundo, terminado em "qualquer coisa que queira mudar, é só falar" —
   * que não pede nada, então não recebe resposta.
   */
  async function open(item: HotLead) {
    const corpo = buildHotFollowUp(item.lead.name, identity.senderName, identity.agencyName);
    const destino = item.lead.phoneE164
      ? whatsappLink(item.lead.phoneE164, corpo)
      : item.lead.email
        ? emailLink(item.lead.email, hotFollowUpSubject(item.lead.name), corpo)
        : null;

    if (!destino) {
      showToast(`${item.lead.name} não tem telefone nem e-mail. Preencha em Leads → Editar.`);
      return;
    }
    window.open(destino, "_blank", "noopener");

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
          <li key={item.leadId} className="bg-surface rounded-lg px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                  onClick={() => removeFromQueue(item)}
                  title="Cancela os toques agendados. O lead continua na aba Leads."
                  className="text-text-muted hover:text-warning text-sm"
                >
                  Tirar da fila
                </button>
                <button
                  onClick={() => open(item)}
                  disabled={!item.lead.phoneE164 && !item.lead.email}
                  title={
                    item.lead.phoneE164 || item.lead.email
                      ? undefined
                      : "Sem telefone nem e-mail neste lead."
                  }
                  className="bg-good rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {item.lead.phoneE164 ? "Falar agora" : "Abrir e-mail"}
                </button>
              </div>
            </div>

          </li>
        ))}
      </ul>
    </section>
  );
}
