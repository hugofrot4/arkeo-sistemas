import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  centered?: boolean;
}

export default function SectionLabel({
  children,
  centered = false,
}: SectionLabelProps) {
  return (
    <p
      className={`text-accent font-family-display mb-4 items-center gap-1.5 text-[0.72rem] font-semibold tracking-[0.12em] uppercase before:text-[0.6rem] before:content-['✦'] ${
        centered ? "flex justify-center" : "inline-flex"
      }`}
    >
      {children}
    </p>
  );
}
