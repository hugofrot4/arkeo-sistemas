import { useState } from "react";
import { Ban, Check, ExternalLink, Flame, Mail, MessageCircle, Pencil, SkipForward } from "lucide-react";
import { useAdmin } from "../../context";
import {
  cancelRemainingTouches,
  emailLink,
  markTouchSent,
  updateLead,
  updateTouch,
  markViewed,
  skipTouch,
  whatsappLink,
  type HotLead,
  type QueueItem,
} from "../../../../lib/prospecting";
import { SEGMENT_META, nicheLabel, relativeTime } from "./meta";
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

  const cap = data.settings?.dailyOutreachCap ?? 40;
  const remaining = Math.max(0, cap - data.sentToday);

  // Lead quente já aparece no bloco de cima, com ação própria. Deixá-lo
  // também aqui embaixo mostrava o mesmo negócio duas vezes na tela e inflava
  // a contagem da aba.
  const quentes = new Set(data.hot.map((h) => h.leadId));
  const fila = data.queue.filter((t) => !quentes.has(t.leadId));

  /**
   * Registra o envio. Só roda depois de o operador confirmar que mandou —
   * abrir a conversa não é enviar, e marcar no clique registrava envio que
   * podia não ter acontecido (pop-up bloqueado, número sem WhatsApp, desistiu).
   */
  async function handleConfirm(item: QueueItem) {
    setBusy(item.id);
    try {
      const resultado = await markTouchSent(item);
      await refresh();
      const quando = resultado.nextTouchDate
        ? new Date(`${resultado.nextTouchDate}T12:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })
        : null;
      // O lead sai da fila de hoje ao ser marcado. Dizer quando ele volta evita
      // a sensação de que sumiu.
      showToast(
        quando
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

        {remaining === 0 && fila.length > 0 && (
          <p className="border-warning/30 bg-warning/8 text-warning mb-4 rounded-lg border px-4 py-3 text-sm">
            Régua do dia atingida. Parar aqui é de propósito: volume alto num dia só
            é o que faz número ser marcado como spam.
          </p>
        )}

        {fila.length === 0 ? (
          <EmptyQueue />
        ) : (
          <ul className="space-y-3">
            {fila.slice(0, remaining || undefined).map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                busy={busy === item.id}
                onConfirm={() => handleConfirm(item)}
                onSkip={() => handleSkip(item)}
                onRemove={() =>
                  handleRemoveFromQueue(item.leadId, item.lead.name, item.id)
                }
                refresh={refresh}
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
  onConfirm,
  onSkip,
  onRemove,
  refresh,
}: {
  item: QueueItem;
  busy: boolean;
  onConfirm: () => void;
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
          <Badge className={segment.className}>{segment.label}</Badge>
          <Badge className="bg-text-muted/12 text-text-muted">Toque {item.step}</Badge>
          <CanalDoToque item={item} refresh={refresh} />
        </div>
      </div>

      <TextoDoToque item={item} refresh={refresh} />

      <div className="flex flex-wrap items-center gap-2">
        {item.channel === "email" ? (
          <EmailDoLead item={item} busy={busy} onConfirm={onConfirm} />
        ) : (
          <WhatsAppDoLead item={item} busy={busy} onConfirm={onConfirm} onSalvo={refresh} />
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
}: {
  item: QueueItem;
  refresh: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [editando, setEditando] = useState(false);
  const [corpo, setCorpo] = useState(item.body);
  const [assunto, setAssunto] = useState(item.subject ?? "");
  const [salvando, setSalvando] = useState(false);

  const temLink = /https?:\/\/\S+\/p\//.test(item.body);
  const alertaLink = item.channel === "whatsapp" && item.step === 1 && temLink;

  async function salvar() {
    setSalvando(true);
    try {
      await updateTouch(item.id, {
        body: corpo,
        subject: item.channel === "email" ? assunto.trim() || null : undefined,
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
      <div className="mb-3">
        {item.channel === "email" && (
          <input
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Assunto do e-mail"
            className="border-border bg-bg mb-2 w-full rounded-lg border px-3 py-2 text-sm"
          />
        )}
        <textarea
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          rows={7}
          className="border-border bg-bg w-full rounded-lg border p-3 text-sm leading-relaxed"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
      {alertaLink && (
        <p className="border-warning/30 bg-warning/8 text-warning mb-2 rounded-lg border px-3 py-2 text-xs">
          Esta mensagem foi gerada antes da correção e leva o link já no primeiro
          toque — é o padrão que faz o WhatsApp restringir o número. Reescreva
          pedindo permissão e deixe o link para o toque 2.
        </p>
      )}
      {item.channel === "email" && item.subject && (
        <p className="text-text-muted mb-1 text-xs">
          <strong>Assunto:</strong> {item.subject}
        </p>
      )}
      <div className="bg-bg relative rounded-lg p-3">
        <p className="text-text-muted max-h-32 overflow-y-auto pr-16 text-sm leading-relaxed whitespace-pre-wrap">
          {item.body}
        </p>
        <button
          onClick={() => setEditando(true)}
          className="text-accent absolute top-2 right-2 inline-flex items-center gap-1 text-xs underline underline-offset-2"
        >
          <Pencil size={11} aria-hidden />
          editar
        </button>
      </div>
    </div>
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
}: {
  item: QueueItem;
  busy: boolean;
  onConfirm: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const assunto = item.subject ?? `Uma prévia do site da ${item.lead.name}`;

  if (!item.lead.email) {
    return (
      <span className="border-warning/30 text-warning rounded-lg border px-3 py-2 text-xs">
        Sem e-mail cadastrado. Adicione em Leads → Editar, ou troque o canal para WhatsApp.
      </span>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <button
        onClick={() => {
          window.location.href = emailLink(item.lead.email!, assunto, item.body);
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

      {aberto && (
        <>
          <button
            onClick={onConfirm}
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
          Confira o texto no seu cliente de e-mail antes de mandar. O toque só é
          registrado depois da confirmação.
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
  onConfirm: () => void;
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
              onClick={onConfirm}
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
function HotBlock({ hot, refresh }: { hot: HotLead[]; refresh: () => Promise<void> }) {
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
                  disabled={!item.lead.whatsappValid}
                  title={item.lead.whatsappValid ? undefined : "Sem WhatsApp válido neste lead."}
                  className="bg-good rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Falar agora
                </button>
              </div>
            </div>

          </li>
        ))}
      </ul>
    </section>
  );
}
