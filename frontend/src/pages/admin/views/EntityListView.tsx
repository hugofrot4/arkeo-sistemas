import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { createElement } from "react";
import { useAdmin } from "../context";
import PanelHeader from "../components/PanelHeader";
import { entityConfig } from "../entityConfig";
import { getIconComponent } from "../../../lib/icons";
import type { EntityKey } from "../types";
import {
  btnPrimaryClass,
  btnSmClass,
  iconBtnClass,
  iconBtnDangerClass,
  panelClass,
} from "../ui";

function EntityListView({ entityKey }: { entityKey: EntityKey }) {
  const {
    state,
    tryAddEntity,
    openEntityModal,
    openConfirmDeleteEntity,
    moveItem,
    listLoading,
  } = useAdmin();
  const cfg = entityConfig[entityKey];
  const items = state[entityKey];
  const loading = listLoading[entityKey] ?? false;

  return (
    <div className={panelClass}>
      <PanelHeader
        tag={cfg.panelTag}
        title={cfg.panelTitle}
        description={cfg.panelDescription}
        action={
          <button
            className={`${btnPrimaryClass} ${btnSmClass}`}
            onClick={() => tryAddEntity(entityKey)}
          >
            <Plus size={15} aria-hidden="true" /> Adicionar {cfg.label.toLowerCase()}
          </button>
        }
      />

      {loading ? (
        <p className="text-text-muted py-6 text-center text-[0.875rem]">
          Carregando...
        </p>
      ) : items.length === 0 ? (
        <div className="text-text-muted py-10 text-center">
          {createElement(getIconComponent(cfg.emptyIcon), {
            size: 30,
            className: "text-border mx-auto mb-2.5",
            "aria-hidden": "true",
          })}
          <p className="text-[0.875rem]">Nenhum item cadastrado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="border-border flex items-center gap-3.5 rounded-lg border bg-white/1 p-3.5 transition-colors hover:border-accent/30"
            >
              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  className={`${iconBtnClass} h-5! w-6.5! rounded`}
                  disabled={idx === 0}
                  onClick={() => moveItem(entityKey, item.id, "up")}
                  aria-label="Mover para cima"
                >
                  <ChevronUp size={14} aria-hidden="true" />
                </button>
                <button
                  className={`${iconBtnClass} h-5! w-6.5! rounded`}
                  disabled={idx === items.length - 1}
                  onClick={() => moveItem(entityKey, item.id, "down")}
                  aria-label="Mover para baixo"
                >
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="bg-accent/10 text-accent flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-lg text-[1.1rem]">
                {cfg.renderIcon(item, idx)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-white text-[0.9rem] font-semibold">
                  {cfg.title(item)}
                </div>
                {cfg.desc && (
                  <div className="text-text-muted truncate text-[0.8rem]">
                    {cfg.desc(item)}
                  </div>
                )}
                {cfg.meta && (
                  <div className="text-accent mt-1 text-[0.72rem] font-semibold">
                    {cfg.meta(item)}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  className={iconBtnClass}
                  onClick={() => openEntityModal(entityKey, item)}
                  aria-label="Editar"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  className={`${iconBtnClass} ${iconBtnDangerClass}`}
                  onClick={() => openConfirmDeleteEntity(entityKey, item.id)}
                  aria-label="Excluir"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EntityListView;
