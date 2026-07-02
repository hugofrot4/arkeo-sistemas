import { createContext, useContext } from "react";
import type {
  AdminState,
  EntityItem,
  EntityKey,
  HeroContent,
  MessageStatus,
  SiteSettings,
  ViewKey,
} from "./types";

export interface ToastEntry {
  id: number;
  message: string;
}

export interface EntityModalState {
  key: EntityKey;
  item: EntityItem | null;
}

export interface ConfirmDeleteState {
  key: EntityKey | "__messages";
  id: number;
  label: string;
}

export interface AdminContextValue {
  state: AdminState;
  view: ViewKey;
  goToView: (view: ViewKey) => void;

  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;

  toasts: ToastEntry[];
  showToast: (message: string) => void;

  updateHero: (patch: Partial<HeroContent>) => void;
  heroLoading: boolean;
  heroSaving: boolean;
  saveHero: () => Promise<void>;
  listLoading: Partial<Record<EntityKey, boolean>>;
  updateSettings: (patch: Partial<SiteSettings>) => void;

  entityModal: EntityModalState | null;
  openEntityModal: (key: EntityKey, item: EntityItem | null) => void;
  closeEntityModal: () => void;
  saveEntityItem: (
    key: EntityKey,
    id: number | null,
    data: Record<string, string>,
  ) => Promise<boolean>;
  tryAddEntity: (key: EntityKey) => void;

  confirmDelete: ConfirmDeleteState | null;
  openConfirmDeleteEntity: (key: EntityKey, id: number) => void;
  openConfirmDeleteMessage: (id: number) => void;
  closeConfirmDelete: () => void;
  confirmDeleteOk: () => Promise<void>;

  moveItem: (key: EntityKey, id: number, dir: "up" | "down") => Promise<void>;

  messageDetailId: number | null;
  openMessageDetail: (id: number) => void;
  closeMessageDetail: () => void;
  updateMessageStatus: (id: number, status: MessageStatus) => void;
}

export const AdminContext = createContext<AdminContextValue | null>(null);

export const viewMeta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Visão geral do conteúdo e dos leads da landing page.",
  },
  hero: {
    title: "Hero",
    subtitle: "Edite o bloco principal do topo da página.",
  },
  metrics: {
    title: "Barra de autoridade",
    subtitle: "Métricas de credibilidade exibidas abaixo do hero.",
  },
  services: {
    title: "Serviços",
    subtitle: 'Gerencie os cards da seção "O que entregamos".',
  },
  process: {
    title: "Processo",
    subtitle: 'Gerencie as etapas da seção "Como funciona".',
  },
  differentials: {
    title: "Diferenciais",
    subtitle: 'Gerencie os cards da seção "Por que a Arkeo?".',
  },
  portfolio: {
    title: "Portfólio",
    subtitle: 'Gerencie os projetos exibidos na seção "Projetos".',
  },
  faq: {
    title: "FAQ",
    subtitle: "Gerencie as perguntas frequentes do site.",
  },
  messages: {
    title: "Mensagens",
    subtitle: "Leads recebidos pelo formulário de contato.",
  },
  settings: {
    title: "Configurações",
    subtitle: "Identidade, contato e preferências gerais do site.",
  },
};

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
