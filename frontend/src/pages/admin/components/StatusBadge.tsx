import type { MessageStatus } from "../types";
import { statusMeta } from "../utils";

function StatusBadge({ status }: { status: MessageStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={`inline-flex items-center gap-1.25 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold whitespace-nowrap ${meta.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export default StatusBadge;
