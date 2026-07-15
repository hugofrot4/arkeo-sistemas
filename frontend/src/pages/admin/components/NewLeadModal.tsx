import { Check, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useAdmin } from "../context";
import { formatBrPhone } from "../../../lib/phone";
import type { MessageStatus } from "../types";
import {
  btnOutlineClass,
  btnPrimaryClass,
  formInputClass,
  formLabelClass,
} from "../ui";

const SERVICE_OPTIONS = [
  "Landing Page",
  "Site Institucional",
  "Sistema Web / App",
  "Outro / Não sei ainda",
];

const STATUS_OPTIONS: { value: MessageStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "contato", label: "Em contato" },
  { value: "convertido", label: "Convertido" },
  { value: "descartado", label: "Descartado" },
];

function NewLeadModal() {
  const { newLeadModalOpen, closeNewLeadModal, createLead } = useAdmin();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<MessageStatus>("contato");
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!newLeadModalOpen) return null;

  function handleClose() {
    closeNewLeadModal();
    setName("");
    setWhatsapp("");
    setService(SERVICE_OPTIONS[0]);
    setMessage("");
    setStatus("contato");
    setInvalidField(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setInvalidField("name");
      return;
    }
    if (!whatsapp.trim()) {
      setInvalidField("whatsapp");
      return;
    }
    setSaving(true);
    const ok = await createLead({ name, whatsapp, service, message, status });
    setSaving(false);
    if (ok) handleClose();
  }

  const onChange =
    (setter: (v: string) => void, field: string) =>
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      setter(e.target.value);
      if (invalidField === field) setInvalidField(null);
    };

  return (
    <div
      className="fixed inset-0 z-300 flex items-center justify-center bg-[rgba(6,12,22,0.78)] p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="border-border bg-surface shadow-md max-h-[88vh] w-full max-w-135 overflow-y-auto rounded-2xl border">
        <div className="border-border bg-surface sticky top-0 z-1 flex items-center justify-between border-b px-6 py-5">
          <h3 className="text-[1.05rem]">Novo lead</h3>
          <button
            className="text-text-muted hover:bg-surface-hover hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition"
            onClick={handleClose}
            aria-label="Fechar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-text-muted mb-6 text-[0.82rem]">
            Registre um lead que entrou em contato por outro canal (telefone,
            WhatsApp direto, indicação, presencial).
          </p>

          <div className="mb-6">
            <label className={formLabelClass}>Nome</label>
            <input
              type="text"
              value={name}
              onChange={onChange(setName, "name")}
              placeholder="Nome do contato"
              className={`${formInputClass} ${invalidField === "name" ? "border-danger!" : ""}`}
            />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <label className={formLabelClass}>WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                maxLength={15}
                onChange={(e) => {
                  setWhatsapp(formatBrPhone(e.target.value));
                  if (invalidField === "whatsapp") setInvalidField(null);
                }}
                placeholder="(11) 99999-9999"
                className={`${formInputClass} ${invalidField === "whatsapp" ? "border-danger!" : ""}`}
              />
            </div>
            <div>
              <label className={formLabelClass}>Tipo de projeto</label>
              <select
                value={service}
                onChange={onChange(setService, "service")}
                className={formInputClass}
              >
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className={formLabelClass}>Observações (opcional)</label>
            <textarea
              rows={3}
              value={message}
              onChange={onChange(setMessage, "message")}
              placeholder="Como o contato aconteceu, o que foi combinado..."
              className={formInputClass}
            />
          </div>

          <div>
            <label className={formLabelClass}>Status inicial</label>
            <select
              value={status}
              onChange={onChange(
                (v) => setStatus(v as MessageStatus),
                "status",
              )}
              className={formInputClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-border flex justify-end gap-2.5 border-t px-6 py-4">
          <button className={btnOutlineClass} onClick={handleClose}>
            Cancelar
          </button>
          <button
            className={btnPrimaryClass}
            disabled={saving}
            onClick={handleSave}
          >
            <Check size={16} aria-hidden="true" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewLeadModal;
