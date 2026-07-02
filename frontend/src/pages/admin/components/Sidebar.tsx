import {
  Award,
  BarChart3,
  ExternalLink,
  FolderKanban,
  HelpCircle,
  Inbox,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken, getMe } from "../../../lib/api";
import { useAdmin, viewMeta } from "../context";
import { iconBtnClass } from "../ui";
import { initials } from "../utils";
import type { ViewKey } from "../types";

interface NavItem {
  view: ViewKey;
  icon: LucideIcon;
}

const contentNav: NavItem[] = [
  { view: "hero", icon: Sparkles },
  { view: "metrics", icon: BarChart3 },
  { view: "services", icon: Layers },
  { view: "process", icon: ListChecks },
  { view: "differentials", icon: Award },
  { view: "portfolio", icon: FolderKanban },
  { view: "faq", icon: HelpCircle },
];

function NavButton({ view, icon: Icon }: NavItem) {
  const { view: activeView, goToView } = useAdmin();
  const active = activeView === view;
  return (
    <button
      className={`mb-0.5 flex w-full items-center gap-2.75 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
        active
          ? "bg-accent/12 text-accent"
          : "text-text-muted hover:bg-surface-hover hover:text-text"
      }`}
      onClick={() => goToView(view)}
    >
      <Icon size={18} className="shrink-0" aria-hidden="true" />
      {viewMeta[view].title}
      {view === "messages" && <MessageBadge />}
    </button>
  );
}

function MessageBadge() {
  const { state } = useAdmin();
  const count = state.messages.filter((m) => m.status === "novo").length;
  if (!count) return null;
  return (
    <span className="bg-accent ml-auto rounded-full px-1.75 py-0.25 text-[0.68rem] font-bold text-white">
      {count}
    </span>
  );
}

function Sidebar() {
  const { sidebarOpen, closeSidebar } = useAdmin();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin Arkeo");

  useEffect(() => {
    getMe()
      .then((user) => setUserName(user.name))
      .catch(() => {});
  }, []);

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-190 bg-[rgba(6,12,22,0.7)] lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        className={`border-border bg-bg-alt fixed top-0 bottom-0 left-0 z-200 flex w-[264px] flex-shrink-0 flex-col border-r transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0 shadow-md" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="border-border flex items-center gap-2.5 border-b px-6 py-5.5">
          <a href="/" className="flex items-center">
            <img src="/logo-arkeo.png" alt="Arkeo Sistemas" className="w-32" />
          </a>
          <button
            className={`${iconBtnClass} ml-auto flex lg:hidden`}
            onClick={closeSidebar}
            aria-label="Fechar menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3.5 py-3.5"
          aria-label="Navegação do painel"
        >
          <NavButton view="dashboard" icon={LayoutDashboard} />

          <p className="text-text-muted px-2.5 pt-4.5 pb-2 text-[0.68rem] font-semibold tracking-[0.1em] uppercase">
            Conteúdo da página
          </p>
          {contentNav.map((item) => (
            <NavButton key={item.view} view={item.view} icon={item.icon} />
          ))}

          <p className="text-text-muted px-2.5 pt-4.5 pb-2 text-[0.68rem] font-semibold tracking-[0.1em] uppercase">
            Gestão
          </p>
          <NavButton view="messages" icon={Inbox} />
          <NavButton view="settings" icon={Settings} />
        </nav>

        <div className="border-border flex flex-col gap-2.5 border-t p-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text border-border hover:border-accent hover:text-accent font-family-display flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] px-3.5 py-2 text-[0.8rem] font-semibold transition-all"
          >
            <ExternalLink size={15} aria-hidden="true" /> Ver site publicado
          </a>
          <div className="flex items-center gap-2.5 rounded-lg p-1.5">
            <div className="from-accent to-accent-dark flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[0.8rem] font-bold text-white">
              {initials(userName)}
            </div>
            <div className="min-w-0">
              <div className="text-text truncate text-[0.825rem] font-semibold">
                {userName}
              </div>
              <div className="text-text-muted text-[0.72rem]">
                Administrador
              </div>
            </div>
            <button
              className={`${iconBtnClass} ml-auto`}
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
