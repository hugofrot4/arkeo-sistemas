import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  anchor: string;
}

export default function Button({ children, anchor }: ButtonProps) {
  return (
    <a
      className="bg-accent font-family-display shadow-accent p hover:shadow-accent-hover rounded-lg px-6 py-3 text-[0.925rem] font-bold transition-shadow duration-500"
      href={anchor}
    >
      {children}
    </a>
  );
}
