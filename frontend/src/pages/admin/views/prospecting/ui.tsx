/** Componentes visuais da prospecção. Dados e rótulos ficam em `meta.ts`. */

export function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

/** Faixas do score, para a fila ser lida de relance. */
export function ScoreDot({ score }: { score: number }) {
  const tone =
    score >= 70 ? "bg-good" : score >= 45 ? "bg-warning" : "bg-text-muted";
  return (
    <span className="inline-flex items-center gap-1.5" title={`Score ${score} de 100`}>
      <span className={`h-2 w-2 rounded-full ${tone}`} aria-hidden />
      <span className="text-sm font-bold tabular-nums">{score}</span>
    </span>
  );
}
