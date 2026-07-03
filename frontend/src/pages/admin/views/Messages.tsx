import { Eye, Inbox, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAdmin } from "../context";
import type { MessageStatus } from "../types";
import {
  filterTabActiveClass,
  filterTabClass,
  iconBtnClass,
  iconBtnDangerClass,
  panelClass,
} from "../ui";
import { formatDate } from "../utils";

const filters: { status: MessageStatus | "all"; label: string }[] = [
  { status: "all", label: "Todos" },
  { status: "novo", label: "Novo" },
  { status: "contato", label: "Em contato" },
  { status: "convertido", label: "Convertido" },
  { status: "descartado", label: "Descartado" },
];

function Messages() {
  const {
    state,
    openMessageDetail,
    openConfirmDeleteMessage,
    updateMessageStatus,
    messagesLoading,
  } = useAdmin();
  const [filter, setFilter] = useState<MessageStatus | "all">("all");
  const [search, setSearch] = useState("");

  const list = useMemo(() => {
    let items = [...state.messages].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    if (filter !== "all") items = items.filter((m) => m.status === filter);
    if (search.trim()) {
      const t = search.trim().toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(t) ||
          m.whatsapp.toLowerCase().includes(t),
      );
    }
    return items;
  }, [state.messages, filter, search]);

  return (
    <div className={panelClass}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.status}
              onClick={() => setFilter(f.status)}
              className={`${filterTabClass} ${filter === f.status ? filterTabActiveClass : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="border-border bg-bg text-text-muted flex w-55 items-center gap-2 rounded-lg border px-3 py-2.25">
          <Search size={15} aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-text placeholder:text-text-muted w-full bg-transparent text-[0.82rem] outline-none"
          />
        </div>
      </div>

      {messagesLoading ? (
        <p className="text-text-muted py-10 text-center text-[0.875rem]">
          Carregando...
        </p>
      ) : list.length === 0 ? (
        <div className="text-text-muted py-10 text-center">
          <Inbox size={34} className="mx-auto mb-2.5" aria-hidden="true" />
          <p className="text-[0.875rem]">
            Nenhuma mensagem encontrada com esse filtro.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-170 border-collapse">
            <thead>
              <tr>
                {["Contato", "Tipo de projeto", "Mensagem", "Data", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-text-muted border-border border-b px-3.5 py-2.5 text-left text-[0.7rem] tracking-[0.08em] whitespace-nowrap uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-white/2 transition-colors"
                >
                  <td className="border-border border-b px-3.5 py-3.25 align-middle">
                    <div className="text-white text-[0.85rem] font-semibold">
                      {m.name}
                    </div>
                    <div className="text-text-muted text-[0.8rem]">
                      {m.whatsapp}
                    </div>
                  </td>
                  <td className="border-border border-b px-3.5 py-3.25 text-[0.85rem] align-middle">
                    {m.service}
                  </td>
                  <td
                    className="text-text-muted border-border max-w-65 truncate border-b px-3.5 py-3.25 text-[0.85rem] align-middle"
                    title={m.message}
                  >
                    {m.message}
                  </td>
                  <td className="text-text-muted border-border border-b px-3.5 py-3.25 text-[0.8rem] align-middle">
                    {formatDate(m.date)}
                  </td>
                  <td className="border-border border-b px-3.5 py-3.25 align-middle">
                    <select
                      value={m.status}
                      onChange={(e) =>
                        updateMessageStatus(
                          m.id,
                          e.target.value as MessageStatus,
                        )
                      }
                      className="bg-bg border-border text-text cursor-pointer rounded-lg border px-2.5 py-1.5 text-[0.78rem] outline-none"
                    >
                      <option value="novo">Novo</option>
                      <option value="contato">Em contato</option>
                      <option value="convertido">Convertido</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </td>
                  <td className="border-border border-b px-3.5 py-3.25 align-middle">
                    <div className="flex gap-1.5">
                      <button
                        className={iconBtnClass}
                        onClick={() => openMessageDetail(m.id)}
                        aria-label="Ver detalhes"
                      >
                        <Eye size={15} aria-hidden="true" />
                      </button>
                      <button
                        className={`${iconBtnClass} ${iconBtnDangerClass}`}
                        onClick={() => openConfirmDeleteMessage(m.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Messages;
