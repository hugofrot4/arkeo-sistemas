import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  createMessageManual as createMessageManualApi,
  deleteMessage as deleteMessageApi,
  differentialsApi,
  faqApi,
  getAchievementsUnlocked,
  getHero,
  getMessages,
  getSettings,
  getXpEvents,
  logXpEvent as logXpEventApi,
  metricsApi,
  portfolioApi,
  processApi,
  servicesApi,
  unlockAchievement as unlockAchievementApi,
  updateHero as updateHeroApi,
  updateMessageStatus as updateMessageStatusApi,
  updateSettings as updateSettingsApi,
} from "../../lib/api";
import {
  AdminContext,
  type AdminContextValue,
  type ConfirmDeleteState,
  type EntityModalState,
  type ToastEntry,
} from "./context";
import { createInitialState, nextId } from "./data";
import { entityConfig } from "./entityConfig";
import {
  ACHIEVEMENTS,
  XP_VALUES,
  levelForXp,
  type AchievementContext,
} from "./gamification/constants";
import { computeWeeklyStreak } from "./gamification/streak";
import type {
  AdminState,
  EntityItem,
  EntityKey,
  HeroContent,
  MessageStatus,
  SiteSettings,
  ViewKey,
  XpAction,
} from "./types";

interface ListApiAdapter {
  list: () => Promise<EntityItem[]>;
  create: (data: Record<string, string>) => Promise<EntityItem>;
  update: (id: number, data: Record<string, string>) => Promise<EntityItem>;
  remove: (id: number) => Promise<void>;
  reorder: (ids: number[]) => Promise<EntityItem[]>;
}

function adaptListApi<T>(api: {
  list: () => Promise<T[]>;
  create: (data: Record<string, string>) => Promise<T>;
  update: (id: number, data: Record<string, string>) => Promise<T>;
  remove: (id: number) => Promise<void>;
  reorder: (ids: number[]) => Promise<T[]>;
}): ListApiAdapter {
  return api as unknown as ListApiAdapter;
}

// Seções cujo CRUD já é persistido pela API — as demais continuam em memória.
const listApis: Partial<Record<EntityKey, ListApiAdapter>> = {
  metrics: adaptListApi(metricsApi),
  services: adaptListApi(servicesApi),
  process: adaptListApi(processApi),
  differentials: adaptListApi(differentialsApi),
  faq: adaptListApi(faqApi),
  portfolio: adaptListApi(portfolioApi),
};

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
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);

  const [heroLoading, setHeroLoading] = useState(true);
  const [heroSaving, setHeroSaving] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [xpEventsLoading, setXpEventsLoading] = useState(true);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [listLoading, setListLoading] = useState<
    Partial<Record<EntityKey, boolean>>
  >(() =>
    Object.fromEntries(Object.keys(listApis).map((key) => [key, true])),
  );

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

  useEffect(() => {
    getHero()
      .then((hero) => setState((prev) => ({ ...prev, hero })))
      .catch(() =>
        showToast(
          "Não foi possível carregar o conteúdo do Hero salvo. Exibindo os valores padrão.",
        ),
      )
      .finally(() => setHeroLoading(false));
  }, [showToast]);

  useEffect(() => {
    (Object.entries(listApis) as [EntityKey, ListApiAdapter][]).forEach(
      ([key, api]) => {
        api
          .list()
          .then((items) => setState((prev) => ({ ...prev, [key]: items })))
          .catch(() =>
            showToast(
              `Não foi possível carregar "${entityConfig[key].panelTitle}" salvo(a). Exibindo os valores padrão.`,
            ),
          )
          .finally(() =>
            setListLoading((prev) => ({ ...prev, [key]: false })),
          );
      },
    );
  }, [showToast]);

  useEffect(() => {
    getMessages()
      .then((messages) => setState((prev) => ({ ...prev, messages })))
      .catch(() =>
        showToast("Não foi possível carregar as mensagens recebidas."),
      )
      .finally(() => setMessagesLoading(false));
  }, [showToast]);

  useEffect(() => {
    getSettings()
      .then((settings) => setState((prev) => ({ ...prev, settings })))
      .catch(() =>
        showToast(
          "Não foi possível carregar as configurações salvas. Exibindo os valores padrão.",
        ),
      )
      .finally(() => setSettingsLoading(false));
  }, [showToast]);

  useEffect(() => {
    getXpEvents()
      .then((xpEvents) => setState((prev) => ({ ...prev, xpEvents })))
      .catch(() => {})
      .finally(() => setXpEventsLoading(false));
  }, []);

  useEffect(() => {
    getAchievementsUnlocked()
      .then((achievementsUnlocked) =>
        setState((prev) => ({ ...prev, achievementsUnlocked })),
      )
      .catch(() => {})
      .finally(() => setAchievementsLoading(false));
  }, []);

  const awardXp = useCallback(
    (action: XpAction, ref?: { table: string; id: number }) => {
      const xp = XP_VALUES[action];
      logXpEventApi(action, xp, ref)
        .then((event) => {
          if (!event) return; // já logado (dedupe)
          setState((prev) => {
            const prevTotal = prev.xpEvents.reduce((sum, e) => sum + e.xp, 0);
            const nextTotal = prevTotal + event.xp;
            const prevLevel = levelForXp(prevTotal);
            const nextLevel = levelForXp(nextTotal);
            if (nextLevel.level > prevLevel.level) {
              showToast(
                `Você subiu para o nível ${nextLevel.level}: ${nextLevel.title}!`,
              );
            }
            return { ...prev, xpEvents: [...prev.xpEvents, event] };
          });
        })
        .catch(() => {
          // XP nunca deve quebrar o fluxo principal do painel.
        });
    },
    [showToast],
  );

  // Detecta conquistas recém-cruzadas sempre que XP ou conteúdo do site mudam.
  useEffect(() => {
    if (xpEventsLoading || achievementsLoading) return;

    const ctx: AchievementContext = {
      conversions: state.xpEvents.filter((e) => e.action === "lead_converted")
        .length,
      firstResponses: state.xpEvents.filter(
        (e) => e.action === "lead_first_response",
      ).length,
      weekStreak: computeWeeklyStreak(state.xpEvents),
      entityCounts: {
        metrics: state.metrics.length,
        services: state.services.length,
        process: state.process.length,
        differentials: state.differentials.length,
        portfolio: state.portfolio.length,
        faq: state.faq.length,
      },
    };

    const unlockedKeys = new Set(state.achievementsUnlocked.map((a) => a.key));
    const newlyUnlocked = ACHIEVEMENTS.filter(
      (a) => !unlockedKeys.has(a.key) && a.isUnlocked(ctx),
    );

    newlyUnlocked.forEach((achievement) => {
      unlockAchievementApi(achievement.key)
        .then((unlocked) => {
          if (!unlocked) return;
          setState((prev) => ({
            ...prev,
            achievementsUnlocked: [...prev.achievementsUnlocked, unlocked],
          }));
          showToast(`Conquista desbloqueada: ${achievement.title}`);
        })
        .catch(() => {});
    });
  }, [
    state.xpEvents,
    state.achievementsUnlocked,
    state.metrics,
    state.services,
    state.process,
    state.differentials,
    state.portfolio,
    state.faq,
    xpEventsLoading,
    achievementsLoading,
    showToast,
  ]);

  const saveHero = useCallback(async () => {
    setHeroSaving(true);
    try {
      const saved = await updateHeroApi(state.hero);
      setState((prev) => ({ ...prev, hero: saved }));
      showToast("Seção Hero atualizada com sucesso.");
      awardXp("hero_updated");
    } catch {
      showToast("Não foi possível salvar a seção Hero. Tente novamente.");
    } finally {
      setHeroSaving(false);
    }
  }, [state.hero, showToast, awardXp]);

  const updateSettings = useCallback((patch: Partial<SiteSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const saveSettings = useCallback(async () => {
    setSettingsSaving(true);
    try {
      const saved = await updateSettingsApi(state.settings);
      setState((prev) => ({ ...prev, settings: saved }));
      showToast("Configurações salvas com sucesso.");
      awardXp("settings_updated");
    } catch {
      showToast("Não foi possível salvar as configurações. Tente novamente.");
    } finally {
      setSettingsSaving(false);
    }
  }, [state.settings, showToast, awardXp]);

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
    async (key: EntityKey, id: number | null, data: Record<string, string>) => {
      const cfg = entityConfig[key];
      const requiredField = cfg.fields.find(
        (f) => f.type === "text" || f.type === "textarea",
      );
      if (requiredField && !data[requiredField.key]?.trim()) {
        return false;
      }

      const api = listApis[key];
      if (api) {
        try {
          const item = id ? await api.update(id, data) : await api.create(data);
          setState((prev) => ({
            ...prev,
            [key]: id
              ? prev[key].map((i) => (i.id === id ? item : i))
              : [...prev[key], item],
          }));
          showToast(
            id
              ? `${cfg.label} atualizado com sucesso.`
              : `${cfg.label} adicionado com sucesso.`,
          );
          awardXp(id ? "content_updated" : "content_created", {
            table: key,
            id: item.id,
          });
          setEntityModal(null);
          return true;
        } catch (err) {
          showToast(
            err instanceof Error
              ? err.message
              : `Não foi possível salvar: ${cfg.label.toLowerCase()}.`,
          );
          return false;
        }
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
    [showToast, awardXp],
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

  const confirmDeleteOk = useCallback(async () => {
    if (!confirmDelete) return;
    const { key, id } = confirmDelete;

    if (key === "__messages") {
      try {
        await deleteMessageApi(id);
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== id),
        }));
        showToast("Mensagem excluída.");
      } catch {
        showToast("Não foi possível excluir a mensagem. Tente novamente.");
      }
      setConfirmDelete(null);
      return;
    }

    const api = listApis[key];
    if (api) {
      try {
        await api.remove(id);
        setState((prev) => ({
          ...prev,
          [key]: prev[key].filter((item) => item.id !== id),
        }));
        showToast(`${entityConfig[key].label} excluído.`);
      } catch {
        showToast(
          `Não foi possível excluir: ${entityConfig[key].label.toLowerCase()}.`,
        );
      }
      setConfirmDelete(null);
      return;
    }

    setState((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item.id !== id),
    }));
    showToast(`${entityConfig[key].label} excluído.`);
    setConfirmDelete(null);
  }, [confirmDelete, showToast]);

  const moveItem = useCallback(
    async (key: EntityKey, id: number, dir: "up" | "down") => {
      const arr = [...state[key]];
      const idx = arr.findIndex((i) => i.id === id);
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || swapWith < 0 || swapWith >= arr.length) return;
      [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
      setState((prev) => ({ ...prev, [key]: arr }));

      const api = listApis[key];
      if (api) {
        try {
          await api.reorder(arr.map((item) => item.id));
        } catch {
          showToast("Não foi possível salvar a nova ordem. Tente novamente.");
        }
      }
    },
    [state, showToast],
  );

  const openMessageDetail = useCallback(
    (id: number) => setMessageDetailId(id),
    [],
  );
  const closeMessageDetail = useCallback(() => setMessageDetailId(null), []);

  const updateMessageStatus = useCallback(
    async (id: number, status: MessageStatus) => {
      try {
        const updated = await updateMessageStatusApi(id, status);
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) => (m.id === id ? updated : m)),
        }));
        showToast("Status do lead atualizado.");
        if (status === "contato") {
          awardXp("lead_first_response", { table: "messages", id });
        } else if (status === "convertido") {
          awardXp("lead_converted", { table: "messages", id });
        } else if (status === "descartado") {
          awardXp("lead_descartado", { table: "messages", id });
        }
      } catch {
        showToast("Não foi possível atualizar o status. Tente novamente.");
      }
    },
    [showToast, awardXp],
  );

  const openNewLeadModal = useCallback(() => setNewLeadModalOpen(true), []);
  const closeNewLeadModal = useCallback(() => setNewLeadModalOpen(false), []);

  const createLead = useCallback(
    async (data: {
      name: string;
      whatsapp: string;
      service: string;
      message: string;
      status: MessageStatus;
    }) => {
      if (!data.name.trim() || !data.whatsapp.trim()) return false;
      try {
        const created = await createMessageManualApi(data);
        setState((prev) => ({ ...prev, messages: [created, ...prev.messages] }));
        showToast("Lead adicionado com sucesso.");
        if (created.status === "contato") {
          awardXp("lead_first_response", { table: "messages", id: created.id });
        } else if (created.status === "convertido") {
          awardXp("lead_converted", { table: "messages", id: created.id });
        } else if (created.status === "descartado") {
          awardXp("lead_descartado", { table: "messages", id: created.id });
        }
        setNewLeadModalOpen(false);
        return true;
      } catch {
        showToast("Não foi possível adicionar o lead. Tente novamente.");
        return false;
      }
    },
    [showToast, awardXp],
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
    heroLoading,
    heroSaving,
    saveHero,
    listLoading,
    messagesLoading,
    updateSettings,
    settingsLoading,
    settingsSaving,
    saveSettings,
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
    newLeadModalOpen,
    openNewLeadModal,
    closeNewLeadModal,
    createLead,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
