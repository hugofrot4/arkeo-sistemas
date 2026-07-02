import { MessageCircle, X } from "lucide-react";
import { useAdmin } from "../context";
import { btnOutlineClass, btnPrimaryClass, formLabelClass } from "../ui";
import { formatDate } from "../utils";
import StatusBadge from "./StatusBadge";

function MessageDetailModal() {
  const { messageDetailId, closeMessageDetail, state } = useAdmin();
  if (messageDetailId === null) return null;

  const message = state.messages.find((m) => m.id === messageDetailId);
  if (!message) return null;

  const phoneDigits = message.whatsapp.replace(/\D/g, "");

  return (
    <div
      className="fixed inset-0 z-300 flex items-center justify-center bg-[rgba(6,12,22,0.78)] p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMessageDetail();
      }}
    >
      <div className="border-border bg-surface shadow-md max-h-[88vh] w-full max-w-135 overflow-y-auto rounded-2xl border">
        <div className="border-border bg-surface sticky top-0 z-1 flex items-center justify-between border-b px-6 py-5">
          <h3 className="text-[1.05rem]">Detalhes da mensagem</h3>
          <button
            className="text-text-muted hover:bg-surface-hover hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition"
            onClick={closeMessageDetail}
            aria-label="Fechar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className={formLabelClass}>Nome</label>
            <div className="text-white text-[0.95rem] font-semibold">
              {message.name}
            </div>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <label className={formLabelClass}>WhatsApp</label>
              <div>{message.whatsapp}</div>
            </div>
            <div>
              <label className={formLabelClass}>Tipo de projeto</label>
              <div>{message.service}</div>
            </div>
          </div>
          <div className="mb-6">
            <label className={formLabelClass}>Recebida em</label>
            <div>{formatDate(message.date)}</div>
          </div>
          <div className="mb-6">
            <label className={formLabelClass}>Mensagem</label>
            <div className="text-text-muted leading-relaxed">
              {message.message}
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Status</label>
            <StatusBadge status={message.status} />
          </div>
        </div>

        <div className="border-border flex justify-end gap-2.5 border-t px-6 py-4">
          <button className={btnOutlineClass} onClick={closeMessageDetail}>
            Fechar
          </button>
          <a
            className={btnPrimaryClass}
            href={`https://wa.me/55${phoneDigits}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} aria-hidden="true" /> Responder no
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default MessageDetailModal;
