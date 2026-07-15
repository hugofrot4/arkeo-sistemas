import { Bell, Menu, Search } from "lucide-react";
import { useAdmin, viewMeta } from "../context";
import LevelBadge from "../gamification/LevelBadge";
import { iconBtnClass } from "../ui";

function Topbar() {
  const { view, openSidebar, state } = useAdmin();
  const meta = viewMeta[view];
  const badgeCount = state.messages.filter((m) => m.status === "novo").length;

  return (
    <header className="border-border bg-bg/90 sticky top-0 z-90 flex items-center justify-between gap-6 border-b px-8 py-4.5 backdrop-blur-lg">
      <div className="flex min-w-0 items-center gap-4">
        <button
          className={`${iconBtnClass} flex lg:hidden`}
          onClick={openSidebar}
          aria-label="Abrir menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="mb-0.5 truncate text-[1.35rem]">{meta.title}</h1>
          <p className="text-text-muted hidden truncate text-[0.825rem] sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="border-border bg-surface text-text-muted hidden w-60 items-center gap-2 rounded-lg border px-3.5 py-2.25 lg:flex">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar no painel..."
            aria-label="Buscar"
            className="text-text placeholder:text-text-muted w-full bg-transparent text-[0.85rem] outline-none"
          />
        </div>

        <div className="relative">
          <button
            className={iconBtnClass}
            aria-label="Notificações"
            title="Notificações"
          >
            <Bell size={18} aria-hidden="true" />
          </button>
          {badgeCount > 0 && (
            <span className="bg-accent border-bg absolute -top-0.75 -right-0.75 flex h-4 w-4 items-center justify-center rounded-full border-2 text-[0.6rem] font-bold text-white">
              {badgeCount}
            </span>
          )}
        </div>

        <LevelBadge compact />

        <div
          className="from-accent to-accent-dark flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-[0.8rem] font-bold text-white"
          title="Admin Arkeo"
        >
          AS
        </div>
      </div>
    </header>
  );
}

export default Topbar;
