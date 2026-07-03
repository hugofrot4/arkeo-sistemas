import { X, Check, Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useAdmin } from "../context";
import { entityConfig, type EntityConfigItem } from "../entityConfig";
import { ICONS } from "../data";
import { getIconComponent } from "../../../lib/icons";
import type { EntityItem, EntityKey } from "../types";
import {
  btnOutlineClass,
  btnPrimaryClass,
  formInputClass,
  formLabelClass,
} from "../ui";
import { str } from "../utils";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function initialValues(cfg: EntityConfigItem, item: EntityItem | null) {
  const values: Record<string, string> = {};
  cfg.fields.forEach((f) => {
    if (f.type === "icon") return;
    values[f.key] = item
      ? str(item[f.key])
      : f.type === "select"
        ? (f.options?.[0] ?? "")
        : "";
  });
  return values;
}

interface EntityModalFormProps {
  entityKey: EntityKey;
  item: EntityItem | null;
}

function EntityModalForm({ entityKey, item }: EntityModalFormProps) {
  const { closeEntityModal, saveEntityItem, showToast } = useAdmin();
  const cfg = entityConfig[entityKey];
  const isEdit = item !== null;

  const [values, setValues] = useState(() => initialValues(cfg, item));
  const [icon, setIcon] = useState(() => (item ? str(item.icon) : ICONS[0]));
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleImageChange(
    field: string,
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      showToast("Imagem muito grande. O tamanho máximo é 2MB.");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setValues((prev) => ({ ...prev, [field]: dataUrl }));
    if (invalidField === field) setInvalidField(null);
  }

  async function handleSave() {
    const data: Record<string, string> = { ...values };
    if (cfg.hasIconPicker) data.icon = icon;
    const requiredField = cfg.fields.find(
      (f) => f.type === "text" || f.type === "textarea",
    );
    setSaving(true);
    const ok = await saveEntityItem(entityKey, item?.id ?? null, data);
    setSaving(false);
    if (!ok && requiredField) {
      setInvalidField(requiredField.key);
    }
  }

  return (
    <div
      className="fixed inset-0 z-300 flex items-center justify-center bg-[rgba(6,12,22,0.78)] p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeEntityModal();
      }}
    >
      <div className="border-border bg-surface shadow-md max-h-[88vh] w-full max-w-135 overflow-y-auto rounded-2xl border">
        <div className="border-border bg-surface sticky top-0 z-1 flex items-center justify-between border-b px-6 py-5">
          <h3 className="text-[1.05rem]">
            {isEdit ? "Editar " : "Adicionar "}
            {cfg.label.toLowerCase()}
          </h3>
          <button
            className="text-text-muted hover:bg-surface-hover hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition"
            onClick={closeEntityModal}
            aria-label="Fechar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          {cfg.fields.map((f) => {
            if (f.type === "icon") {
              return (
                <div className="mb-6" key={f.key}>
                  <label className={formLabelClass}>{f.label}</label>
                  <div className="grid grid-cols-8 gap-2 max-[480px]:grid-cols-6">
                    {ICONS.map((ic) => {
                      const Icon = getIconComponent(ic);
                      const selected = ic === icon;
                      return (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setIcon(ic)}
                          className={`border-border text-text-muted flex aspect-square items-center justify-center rounded-lg border bg-white/3 transition-all ${
                            selected
                              ? "border-accent bg-accent/15 text-accent"
                              : "hover:border-accent hover:text-accent"
                          }`}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (f.type === "image") {
              const currentImage = values[f.key];
              return (
                <div className="mb-6" key={f.key}>
                  <label className={formLabelClass}>{f.label}</label>
                  {currentImage && (
                    <img
                      src={currentImage}
                      alt=""
                      className="border-border mb-3 h-32 w-full rounded-lg border object-cover"
                    />
                  )}
                  <label
                    className={`${btnOutlineClass} w-full cursor-pointer`}
                  >
                    <Upload size={15} aria-hidden="true" />
                    {currentImage ? "Trocar imagem" : "Selecionar imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(f.key, e)}
                    />
                  </label>
                  <p className="text-text-muted mt-1.5 text-[0.72rem]">
                    PNG ou JPG, até 2MB.
                  </p>
                </div>
              );
            }

            const isInvalid = invalidField === f.key;
            const commonProps = {
              value: values[f.key] ?? "",
              onChange: (
                e: ChangeEvent<
                  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                >,
              ) => {
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }));
                if (invalidField === f.key) setInvalidField(null);
              },
              className: `${formInputClass} ${isInvalid ? "border-danger!" : ""}`,
            };

            return (
              <div className="mb-6" key={f.key}>
                <label className={formLabelClass}>{f.label}</label>
                {f.type === "text" && (
                  <input type="text" placeholder={f.placeholder} {...commonProps} />
                )}
                {f.type === "textarea" && (
                  <textarea
                    rows={3}
                    placeholder={f.placeholder}
                    {...commonProps}
                  />
                )}
                {f.type === "select" && (
                  <select {...commonProps}>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-border flex justify-end gap-2.5 border-t px-6 py-4">
          <button className={btnOutlineClass} onClick={closeEntityModal}>
            Cancelar
          </button>
          <button
            className={btnPrimaryClass}
            disabled={saving}
            onClick={handleSave}
          >
            <Check size={16} aria-hidden="true" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EntityModal() {
  const { entityModal } = useAdmin();
  if (!entityModal) return null;

  return (
    <EntityModalForm
      key={`${entityModal.key}-${entityModal.item?.id ?? "new"}`}
      entityKey={entityModal.key}
      item={entityModal.item}
    />
  );
}

export default EntityModal;
