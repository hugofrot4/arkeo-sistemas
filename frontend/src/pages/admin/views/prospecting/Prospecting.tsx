import { useState } from "react";
import QueueTab from "./QueueTab";
import LeadsTab from "./LeadsTab";
import OperationTab from "./OperationTab";
import SettingsTab from "./SettingsTab";
import { useProspecting } from "./useProspecting";

const TABS = [
  { id: "fila", label: "Fila de hoje" },
  { id: "leads", label: "Leads" },
  { id: "operacao", label: "Operação" },
  { id: "config", label: "Configuração" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Prospecting() {
  const { data, loading, error, refresh } = useProspecting();
  const [tab, setTab] = useState<TabId>("fila");

  const pending = data.queue.length + data.hot.length;

  return (
    <div>
      <nav className="border-border mb-6 flex flex-wrap gap-1 border-b">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === item.id
                ? "border-accent text-accent"
                : "text-text-muted hover:text-text border-transparent"
            }`}
          >
            {item.label}
            {item.id === "fila" && pending > 0 && (
              <span className="bg-accent ml-2 rounded-full px-1.75 py-0.25 text-[0.68rem] font-bold text-white">
                {pending}
              </span>
            )}
          </button>
        ))}
      </nav>

      {error && (
        <p className="border-danger/30 bg-danger/8 text-danger mb-5 rounded-lg border px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-text-muted py-12 text-center text-sm">Carregando prospecção…</p>
      ) : (
        <>
          {tab === "fila" && <QueueTab data={data} refresh={refresh} />}
          {tab === "leads" && (
            <LeadsTab onChanged={refresh} settings={data.settings} />
          )}
          {tab === "operacao" && <OperationTab data={data} refresh={refresh} />}
          {tab === "config" && <SettingsTab settings={data.settings} refresh={refresh} />}
        </>
      )}
    </div>
  );
}
