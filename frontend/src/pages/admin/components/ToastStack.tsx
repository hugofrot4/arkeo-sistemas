import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdmin } from "../context";

function Toast({ message }: { message: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`border-accent bg-bg-alt shadow-md flex max-w-80 items-center gap-2.5 rounded-lg border px-4.5 py-3.25 text-[0.85rem] transition-all duration-300 ${
        shown ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"
      }`}
    >
      <CheckCircle2 size={18} className="text-good shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function ToastStack() {
  const { toasts } = useAdmin();
  return (
    <div className="fixed right-6 bottom-6 z-500 flex flex-col gap-2.5">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} />
      ))}
    </div>
  );
}

export default ToastStack;
