import { AdminProvider } from "./AdminContext";
import { useAdmin } from "./context";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import EntityModal from "./components/EntityModal";
import MessageDetailModal from "./components/MessageDetailModal";
import NewLeadModal from "./components/NewLeadModal";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ToastStack from "./components/ToastStack";
import Dashboard from "./views/Dashboard";
import EntityListView from "./views/EntityListView";
import Hero from "./views/Hero";
import Messages from "./views/Messages";
import Settings from "./views/Settings";
import type { EntityKey } from "./types";

const entityViews: EntityKey[] = [
  "metrics",
  "services",
  "process",
  "differentials",
  "portfolio",
  "faq",
];

function AdminContent() {
  const { view } = useAdmin();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-66">
        <Topbar />

        <main className="flex-1 p-6 sm:p-8">
          {view === "dashboard" && <Dashboard />}
          {view === "hero" && <Hero />}
          {view === "messages" && <Messages />}
          {view === "settings" && <Settings />}
          {entityViews.includes(view as EntityKey) && (
            <EntityListView entityKey={view as EntityKey} />
          )}
        </main>
      </div>

      <EntityModal />
      <ConfirmDeleteModal />
      <MessageDetailModal />
      <NewLeadModal />
      <ToastStack />
    </div>
  );
}

function Admin() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}

export default Admin;
