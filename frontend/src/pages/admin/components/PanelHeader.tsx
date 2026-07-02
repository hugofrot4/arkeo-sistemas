import type { ReactNode } from "react";
import { sectionTagClass } from "../ui";

interface PanelHeaderProps {
  tag: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

function PanelHeader({ tag, title, description, action }: PanelHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className={sectionTagClass}>{tag}</p>
        <h2 className="text-[1.05rem]">{title}</h2>
        {description && (
          <p className="text-text-muted mt-0.75 max-w-130 text-[0.8rem]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export default PanelHeader;
