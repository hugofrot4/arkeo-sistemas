import { useState } from "react";
import TodayTab from "./TodayTab";
import QueueTab from "./QueueTab";
import LeadsTab from "./LeadsTab";
import PrototypesTab from "./PrototypesTab";
import SettingsTab from "./SettingsTab";
import { useProspecting } from "./useProspecting";

/**
 * As abas seguem a ordem do trabalho: o que fazer agora, depois a fila do dia,
 * depois a base de leads, depois o que já foi publicado.
 *
 * A antiga aba "Operação" foi dissolvida. Ela juntava dois botões de ação com
 * três blocos de números, e nada ali dizia o que fazer com a informação. Os
 * botões viraram a resposta de um passo em "Hoje"; os números viraram uma
 * linha de rodapé.
 */
const TABS = [
  { id: "hoje", label: "Hoje" },
  { id: "fila", label: "Fila" },
  { id: "leads", label: "Leads" },
  { id: "prototipos", label: "Protótipos" },
  { id: "config", label: "Ajustes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Prospecting() {
  const { data, loading, error, refresh } = useProspecting();
  const [tab, setTab] = useState<TabId>("hoje");

  const pendenteHoje = data.queue.length + data.hot.length;

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
            {item.id === "fila" && pendenteHoje > 0 && (
              <span className="bg-accent ml-2 rounded-full px-1.75 py-px text-[0.68rem] font-bold text-white">
                {pendenteHoje}
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
          {tab === "hoje" && (
            <TodayTab
              data={data}
              refresh={refresh}
              irPara={(aba) => setTab(aba)}
            />
          )}
          {tab === "fila" && <QueueTab data={data} refresh={refresh} />}
          {tab === "leads" && (
            <LeadsTab onChanged={refresh} settings={data.settings} />
          )}
          {tab === "prototipos" && (
            <PrototypesTab ttlDays={data.settings?.prototypeTtlDays ?? 45} />
          )}
          {tab === "config" && <SettingsTab settings={data.settings} refresh={refresh} />}
        </>
      )}
    </div>
  );
}
