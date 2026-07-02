import {
  ArrowRight,
  ArrowUpRight,
  FolderKanban,
  HelpCircle,
  Inbox,
  Layers,
  MailPlus,
  Sparkles,
} from "lucide-react";
import { useAdmin } from "../context";
import LeadsChart from "../components/LeadsChart";
import PanelHeader from "../components/PanelHeader";
import StatusBadge from "../components/StatusBadge";
import { btnOutlineClass, btnSmClass, panelClass } from "../ui";
import { formatRelative, initials } from "../utils";
import type { ViewKey } from "../types";

const quickActions: { view: ViewKey; label: string; icon: typeof Sparkles }[] = [
  { view: "hero", label: "Hero", icon: Sparkles },
  { view: "services", label: "Serviços", icon: Layers },
  { view: "portfolio", label: "Portfólio", icon: FolderKanban },
  { view: "faq", label: "FAQ", icon: HelpCircle },
];

function Dashboard() {
  const { state, goToView } = useAdmin();

  const totalLeads = state.messages.length;
  const newLeads = state.messages.filter((m) => m.status === "novo").length;
  const recent = [...state.messages]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Inbox size={19} aria-hidden="true" />}
          delta="12%"
          deltaUp
          value={totalLeads}
          label="Total de leads recebidos"
        />
        <KpiCard
          icon={<MailPlus size={19} aria-hidden="true" />}
          delta="3 hoje"
          deltaUp
          value={newLeads}
          label="Mensagens novas"
        />
        <KpiCard
          icon={<Layers size={19} aria-hidden="true" />}
          value={state.services.length}
          label="Serviços publicados"
        />
        <KpiCard
          icon={<FolderKanban size={19} aria-hidden="true" />}
          value={state.portfolio.length}
          label="Projetos no portfólio"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className={`${panelClass} mb-0`}>
          <PanelHeader tag="Leads" title="Leads recebidos — últimos 7 dias" />
          <LeadsChart />
        </div>

        <div className={`${panelClass} mb-0`}>
          <PanelHeader tag="Ações rápidas" title="Editar conteúdo" />
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => goToView(view)}
                className="border-border text-text flex w-full flex-col items-start gap-2.5 rounded-lg border bg-white/2 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent/6"
              >
                <Icon size={20} className="text-accent" aria-hidden="true" />
                <span className="text-[0.825rem] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={panelClass}>
        <PanelHeader
          tag="Recentes"
          title="Últimas mensagens recebidas"
          action={
            <button
              className={`${btnOutlineClass} ${btnSmClass}`}
              onClick={() => goToView("messages")}
            >
              Ver todas <ArrowRight size={14} aria-hidden="true" />
            </button>
          }
        />
        {recent.length === 0 ? (
          <div className="text-text-muted py-8 text-center">
            <Inbox size={30} className="mx-auto mb-2.5" aria-hidden="true" />
            <p className="text-[0.875rem]">Nenhuma mensagem ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {recent.map((m) => (
              <div
                key={m.id}
                className="border-border flex items-center gap-3 border-b py-3 px-2 last:border-b-0"
              >
                <div className="border-border bg-surface-hover text-accent flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full border text-[0.75rem] font-bold">
                  {initials(m.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-text text-[0.85rem] font-semibold">
                    {m.name}
                  </div>
                  <div className="text-text-muted truncate text-[0.76rem]">
                    {m.service} — {m.message}
                  </div>
                </div>
                <div className="text-text-muted shrink-0 text-[0.72rem]">
                  {formatRelative(m.date)}
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  delta?: string;
  deltaUp?: boolean;
}

function KpiCard({ icon, value, label, delta, deltaUp }: KpiCardProps) {
  return (
    <div className="border-border bg-surface hover:border-accent/30 rounded-xl border p-5 transition-colors">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="bg-accent/10 text-accent flex h-9.5 w-9.5 items-center justify-center rounded-lg">
          {icon}
        </div>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.75 rounded-full px-2 py-0.75 text-[0.72rem] font-semibold ${
              deltaUp ? "text-good bg-good/10" : "text-danger bg-danger/10"
            }`}
          >
            <ArrowUpRight size={12} aria-hidden="true" />
            {delta}
          </span>
        )}
      </div>
      <div className="font-family-display mb-1.5 text-[1.9rem] leading-none font-bold text-white">
        {value}
      </div>
      <div className="text-text-muted text-[0.8rem]">{label}</div>
    </div>
  );
}

export default Dashboard;
