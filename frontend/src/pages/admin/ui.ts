export const panelClass = "border-border bg-surface mb-6 rounded-xl border p-8";

export const sectionTagClass =
  "text-accent mb-1.5 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.1em] uppercase before:content-['✦'] before:text-[0.6rem]";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-family-display text-sm font-semibold whitespace-nowrap transition-all disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimaryClass = `${btnBase} bg-accent text-white shadow-accent px-5 py-2.75 hover:-translate-y-px hover:bg-accent-dark`;
export const btnOutlineClass = `${btnBase} text-text border-border border-[1.5px] bg-transparent px-5 py-2.75 hover:border-accent hover:text-accent`;
export const btnDangerClass = `${btnBase} text-danger border-danger/30 border-[1.5px] bg-danger/10 px-5 py-2.75 hover:bg-danger/18 hover:border-danger`;
export const btnSmClass = "px-3.5! py-2! text-[0.8rem]!";
export const btnBlockClass = "w-full";

export const iconBtnClass =
  "border-border text-text-muted flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-lg border bg-transparent transition-all hover:border-accent hover:bg-accent/8 hover:text-accent disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-text-muted";
export const iconBtnDangerClass =
  "hover:border-danger hover:bg-danger/8 hover:text-danger";

export const formLabelClass =
  "text-text-muted mb-1.75 block text-[0.8rem] font-medium";
export const formInputClass =
  "text-text placeholder:text-text-muted/60 focus:border-accent focus:bg-accent/5 w-full rounded-lg border border-border bg-white/3 px-3.5 py-3 text-[0.875rem] outline-none transition";
export const formHintClass = "text-text-muted mt-1.5 text-[0.72rem]";

export const filterTabClass =
  "text-text-muted border-border rounded-full border px-3.5 py-2 text-[0.8rem] font-medium transition-all hover:border-accent hover:text-text";
export const filterTabActiveClass = "bg-accent/12 border-accent text-accent";
