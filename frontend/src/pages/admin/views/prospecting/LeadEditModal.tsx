import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { useAdmin } from "../../context";
import { updateLead, type Lead } from "../../../../lib/prospecting";
import { formatarTelefoneBr, parseTelefoneBr } from "../../../../lib/phoneBr";

/**
 * Edição manual do lead.
 *
 * Substitui o `window.prompt` que só pedia a URL do site. O que se corrige
 * aqui é justamente o que a coleta automática erra: telefone classificado como
 * fixo quando tem WhatsApp, site que o Google não vinculou, e — o caso mais
 * comum — negócio que só existe no Instagram.
 *
 * Salvar marca `verifiedByHuman`, e a partir daí nem a busca nem a auditoria
 * sobrescrevem estes campos.
 */
export default function LeadEditModal({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  const [form, setForm] = useState({
    name: lead.name,
    website: lead.website ?? "",
    socialUrl: lead.socialUrl ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    neighborhood: lead.neighborhood ?? "",
    notes: lead.notes ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  const telefone = parseTelefoneBr(form.phone);

  function set<K extends keyof typeof form>(campo: K, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function urlValida(valor: string) {
    return !valor.trim() || /^https?:\/\/\S+\.\S+/.test(valor.trim());
  }

  async function salvar() {
    if (!form.name.trim()) return setErro("O nome não pode ficar vazio.");
    if (!urlValida(form.website)) return setErro("O site precisa começar com http:// ou https://");
    if (!urlValida(form.socialUrl)) return setErro("O Instagram precisa começar com http:// ou https://");

    setErro(null);
    setSalvando(true);
    try {
      await updateLead(lead.id, {
        name: form.name.trim(),
        website: form.website.trim() || null,
        socialUrl: form.socialUrl.trim() || null,
        phone: form.phone.trim() || null,
        phoneE164: telefone.e164,
        whatsappValid: telefone.isMobile,
        email: form.email.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        notes: form.notes,
        // A partir daqui a coleta automática não mexe mais nestes campos.
        verifiedByHuman: true,
      });
      await onSaved();
      showToast(`${form.name.trim()} atualizado e marcado como conferido.`);
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-300 flex items-start justify-center overflow-y-auto bg-[rgba(6,12,22,0.78)] p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar ${lead.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border bg-bg-alt w-full max-w-2xl rounded-2xl border shadow-xl">
        <header className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="font-family-display font-bold">Editar lead</h2>
            <p className="text-text-muted text-sm">
              O que você corrigir aqui fica travado contra a coleta automática.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1" aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          <Campo label="Nome do negócio">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={entrada}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Site" dica="Deixe vazio se confirmou que não existe.">
              <input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://exemplo.com.br"
                className={entrada}
              />
            </Campo>

            <Campo
              label="Instagram ou rede social"
              dica="Perfil do negócio. Vira a fonte de conteúdo quando não há site."
            >
              <input
                value={form.socialUrl}
                onChange={(e) => set("socialUrl", e.target.value)}
                placeholder="https://instagram.com/perfil"
                className={entrada}
              />
            </Campo>

            <Campo label="Telefone">
              <input
                value={form.phone}
                onChange={(e) => set("phone", formatarTelefoneBr(e.target.value))}
                placeholder="(85) 98765-4321"
                className={entrada}
              />
              {form.phone.trim() && (
                <p
                  className={`mt-1.5 text-xs ${
                    telefone.isMobile
                      ? "text-good"
                      : telefone.e164
                        ? "text-text-muted"
                        : "text-warning"
                  }`}
                >
                  {telefone.isMobile
                    ? "Celular válido — o botão de WhatsApp vai funcionar."
                    : (telefone.motivo ?? "Número incompleto.")}
                </p>
              )}
            </Campo>

            <Campo label="E-mail">
              <input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contato@exemplo.com.br"
                className={entrada}
              />
            </Campo>
          </div>

          <Campo label="Bairro">
            <input
              value={form.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
              className={entrada}
            />
          </Campo>

          <Campo
            label="Observações"
            dica="Entra no brief do protótipo. É aqui que se cola a bio do Instagram, a lista de serviços e o horário — tudo que o site não tinha para a extração pegar."
          >
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={5}
              placeholder={
                "Ex.: bio do Instagram, serviços que aparecem nos destaques, horário de atendimento, convênios."
              }
              className={`${entrada} resize-y`}
            />
          </Campo>

          {!form.website.trim() && form.socialUrl.trim() && (
            <p className="border-accent/25 bg-accent/8 text-text-muted flex gap-2 rounded-lg border px-4 py-3 text-sm">
              <Info size={16} className="text-accent mt-0.5 shrink-0" aria-hidden />
              <span>
                Sem site, o Instagram vira a fonte do protótipo — a skill extrai a
                logo, as fotos do feed e a bio a partir desse endereço. Se a
                extração falhar, o que você escrever em Observações é o que
                sobra, então vale colar a bio e os serviços aqui.
              </span>
            </p>
          )}

          {erro && (
            <p className="border-danger/30 bg-danger/8 text-danger rounded-lg border px-4 py-3 text-sm">
              {erro}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={salvar}
              disabled={salvando}
              className="bg-accent rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button
              onClick={onClose}
              className="border-border rounded-lg border px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const entrada =
  "border-border bg-surface w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-accent";

function Campo({
  label,
  dica,
  children,
}: {
  label: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {dica && <span className="text-text-muted mb-1.5 block text-xs">{dica}</span>}
      {children}
    </label>
  );
}
