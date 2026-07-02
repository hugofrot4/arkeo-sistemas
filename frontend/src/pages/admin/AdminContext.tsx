import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AdminContext,
  type AdminContextValue,
  type ConfirmDeleteState,
  type EntityModalState,
  type ToastEntry,
} from "./context";
import { createInitialState, nextId } from "./data";
import { entityConfig } from "./entityConfig";
import type {
  AdminState,
  EntityItem,
  EntityKey,
  HeroContent,
  MessageStatus,
  SiteSettings,
  ViewKey,
} from "./types";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(() => createInitialState());
  const [view, setView] = useState<ViewKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const toastId = useRef(0);

  const [entityModal, setEntityModal] = useState<EntityModalState | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] =
    useState<ConfirmDeleteState | null>(null);
  const [messageDetailId, setMessageDetailId] = useState<number | null>(null);

  const goToView = useCallback((next: ViewKey) => {
    setView(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const showToast = useCallback((message: string) => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2900);
  }, []);

  const updateHero = useCallback((patch: Partial<HeroContent>) => {
    setState((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<SiteSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const openEntityModal = useCallback(
    (key: EntityKey, item: EntityItem | null) => {
      setEntityModal({ key, item });
    },
    [],
  );
  const closeEntityModal = useCallback(() => setEntityModal(null), []);

  const tryAddEntity = useCallback(
    (key: EntityKey) => {
      const cfg = entityConfig[key];
      if (cfg.maxItems && state[key].length >= cfg.maxItems) {
        showToast(`Limite de ${cfg.maxItems} itens atingido para essa seção.`);
        return;
      }
      openEntityModal(key, null);
    },
    [state, showToast, openEntityModal],
  );

  const saveEntityItem = useCallback(
    (key: EntityKey, id: number | null, data: Record<string, string>) => {
      const cfg = entityConfig[key];
      const requiredField = cfg.fields.find(
        (f) => f.type === "text" || f.type === "textarea",
      );
      if (requiredField && !data[requiredField.key]?.trim()) {
        return false;
      }

      setState((prev) => {
        const items = prev[key];
        if (id) {
          return {
            ...prev,
            [key]: items.map((item) =>
              item.id === id ? ({ ...item, ...data } as EntityItem) : item,
            ),
          };
        }
        return {
          ...prev,
          [key]: [...items, { id: nextId(), ...data } as EntityItem],
        };
      });

      showToast(
        id
          ? `${cfg.label} atualizado com sucesso.`
          : `${cfg.label} adicionado com sucesso.`,
      );
      setEntityModal(null);
      return true;
    },
    [showToast],
  );

  const openConfirmDeleteEntity = useCallback(
    (key: EntityKey, id: number) => {
      const cfg = entityConfig[key];
      setConfirmDelete({
        key,
        id,
        label: `Tem certeza que deseja excluir este ${cfg.label.toLowerCase()}? Essa ação não pode ser desfeita.`,
      });
    },
    [],
  );

  const openConfirmDeleteMessage = useCallback((id: number) => {
    setConfirmDelete({
      key: "__messages",
      id,
      label:
        "Tem certeza que deseja excluir esta mensagem? Essa ação não pode ser desfeita.",
    });
  }, []);

  const closeConfirmDelete = useCallback(() => setConfirmDelete(null), []);

  const confirmDeleteOk = useCallback(() => {
    if (!confirmDelete) return;
    const { key, id } = confirmDelete;
    if (key === "__messages") {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== id),
      }));
      showToast("Mensagem excluída.");
    } else {
      setState((prev) => ({
        ...prev,
        [key]: prev[key].filter((item) => item.id !== id),
      }));
      showToast(`${entityConfig[key].label} excluído.`);
    }
    setConfirmDelete(null);
  }, [confirmDelete, showToast]);

  const moveItem = useCallback(
    (key: EntityKey, id: number, dir: "up" | "down") => {
      setState((prev) => {
        const arr = [...prev[key]];
        const idx = arr.findIndex((i) => i.id === id);
        const swapWith = dir === "up" ? idx - 1 : idx + 1;
        if (idx < 0 || swapWith < 0 || swapWith >= arr.length) return prev;
        [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
        return { ...prev, [key]: arr };
      });
    },
    [],
  );

  const openMessageDetail = useCallback(
    (id: number) => setMessageDetailId(id),
    [],
  );
  const closeMessageDetail = useCallback(() => setMessageDetailId(null), []);

  const updateMessageStatus = useCallback(
    (id: number, status: MessageStatus) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === id ? { ...m, status } : m,
        ),
      }));
      showToast("Status do lead atualizado.");
    },
    [showToast],
  );

  const value: AdminContextValue = {
    state,
    view,
    goToView,
    sidebarOpen,
    openSidebar,
    closeSidebar,
    toasts,
    showToast,
    updateHero,
    updateSettings,
    entityModal,
    openEntityModal,
    closeEntityModal,
    saveEntityItem,
    tryAddEntity,
    confirmDelete,
    openConfirmDeleteEntity,
    openConfirmDeleteMessage,
    closeConfirmDelete,
    confirmDeleteOk,
    moveItem,
    messageDetailId,
    openMessageDetail,
    closeMessageDetail,
    updateMessageStatus,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
