import { Trash2 } from "lucide-react";
import { useAdmin } from "../context";
import { btnDangerClass, btnOutlineClass } from "../ui";

function ConfirmDeleteModal() {
  const { confirmDelete, closeConfirmDelete, confirmDeleteOk } = useAdmin();
  if (!confirmDelete) return null;

  return (
    <div
      className="fixed inset-0 z-300 flex items-center justify-center bg-[rgba(6,12,22,0.78)] p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConfirmDelete();
      }}
    >
      <div className="border-border bg-surface shadow-md w-full max-w-100 rounded-2xl border">
        <div className="p-6 text-center">
          <div className="bg-danger/10 text-danger mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Trash2 size={22} aria-hidden="true" />
          </div>
          <h3 className="mb-2 text-[1.05rem]">Excluir item?</h3>
          <p className="text-text-muted text-[0.875rem]">
            {confirmDelete.label}
          </p>
        </div>
        <div className="border-border flex justify-center gap-2.5 border-t px-6 py-4">
          <button className={btnOutlineClass} onClick={closeConfirmDelete}>
            Cancelar
          </button>
          <button className={btnDangerClass} onClick={confirmDeleteOk}>
            <Trash2 size={15} aria-hidden="true" /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
