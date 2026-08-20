/**
 * Blocos compartilhados pelos templates de protótipo.
 *
 * Restrição que define o desenho: não temos foto nenhuma do negócio, e
 * inventar imagem de uma clínica que nunca vimos seria o mesmo problema de
 * inventar texto. Então tudo aqui precisa ficar bom só com tipografia,
 * geometria e cor — o que também deixa a página leve e rápida.
 *
 * A cor vem das variáveis CSS --p/--a/--s/--i, definidas por `PaletteRoot` a
 * partir de `content.palette`. Nenhum bloco usa token do tema da Arkeo: o
 * protótipo é o site do cliente, não uma página da agência.
 */

import type { ReactNode } from "react";
import Reveal from "../components/ui/Reveal";
import type { FaqItem, Palette, PrototypeFacts, ServiceItem } from "./types";

export function PaletteRoot({ palette, children }: { palette: Palette; children: ReactNode }) {
  return (
    <div
      style={
        {
          "--p": palette.primary,
          "--a": palette.accent,
          "--s": palette.surface,
          "--i": palette.ink,
        } as React.CSSProperties
      }
      className="min-h-screen bg-white font-[Inter,system-ui,sans-serif] text-[var(--i)] antialiased"
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-5 py-16 sm:px-8 md:py-24 ${className}`}>
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

export function SectionTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-10">
      {kicker && (
        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[var(--a)] uppercase">
          {kicker}
        </p>
      )}
      <h2 className="text-2xl leading-tight font-bold text-balance sm:text-3xl md:text-4xl">
        {children}
      </h2>
    </div>
  );
}

export function CtaButton({
  children,
  href,
  variant = "solid",
}: {
  children: ReactNode;
  href: string;
  variant?: "solid" | "outline";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-[0.95rem] font-semibold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--a)]";
  const style =
    variant === "solid"
      ? "bg-[var(--a)] text-white shadow-lg shadow-[var(--a)]/25"
      : "border-2 border-current text-[var(--a)]";
  return (
    <a href={href} className={`${base} ${style}`}>
      {children}
    </a>
  );
}

/** Marca no topo. Sem logo — o negócio não tem um que possamos usar. */
export function Brandmark({ name, onDark = false }: { name: string; onDark?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--a)] text-sm font-bold text-white"
      >
        {initials || name[0]?.toUpperCase()}
      </span>
      <span className={`text-lg font-bold ${onDark ? "text-white" : "text-[var(--i)]"}`}>
        {name}
      </span>
    </div>
  );
}

export function ServicesGrid({
  items,
  numbered = false,
}: {
  items: ServiceItem[];
  numbered?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <Reveal key={item.name} delay={`${i * 70}ms`}>
          <article className="h-full rounded-2xl border border-black/8 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
            {numbered && (
              <span className="mb-3 block text-sm font-bold text-[var(--a)]">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <h3 className="mb-2 text-lg font-semibold">{item.name}</h3>
            <p className="text-[0.95rem] leading-relaxed text-black/65">{item.description}</p>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Prova social a partir do Google. A nota e a contagem vêm de `facts`, ou
 * seja, do banco — o bloco some quando o negócio ainda não tem avaliação, em
 * vez de exibir número inventado.
 */
export function ProofBlock({
  title,
  note,
  facts,
  onDark = false,
}: {
  title: string;
  note: string;
  facts: PrototypeFacts;
  onDark?: boolean;
}) {
  const hasRating = facts.rating !== null && facts.reviewCount !== null;
  return (
    <div className={onDark ? "text-white" : ""}>
      <SectionTitle>{title}</SectionTitle>
      {hasRating && (
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="text-5xl font-bold text-[var(--a)]">
            {facts.rating!.toFixed(1)}
          </span>
          <div>
            <div aria-hidden className="text-lg tracking-widest text-[var(--a)]">
              {"★".repeat(Math.round(facts.rating!))}
              <span className={onDark ? "text-white/25" : "text-black/15"}>
                {"★".repeat(5 - Math.round(facts.rating!))}
              </span>
            </div>
            <p className={`text-sm ${onDark ? "text-white/70" : "text-black/60"}`}>
              {facts.reviewCount} avaliações no Google
            </p>
          </div>
        </div>
      )}
      <p className={`max-w-2xl text-lg leading-relaxed ${onDark ? "text-white/80" : "text-black/70"}`}>
        {note}
      </p>
    </div>
  );
}

export function FaqBlock({ title, items }: { title: string; items: FaqItem[] }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <div className="divide-y divide-black/8 border-y border-black/8">
        {items.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold">
              {item.q}
              <span
                aria-hidden
                className="shrink-0 text-xl leading-none text-[var(--a)] transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-3xl leading-relaxed text-black/65">{item.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export function LocationBlock({
  title,
  note,
  facts,
  onDark = false,
}: {
  title: string;
  note: string;
  facts: PrototypeFacts;
  onDark?: boolean;
}) {
  const muted = onDark ? "text-white/70" : "text-black/65";
  return (
    <div className={onDark ? "text-white" : ""}>
      <SectionTitle>{title}</SectionTitle>
      <p className={`mb-6 max-w-2xl leading-relaxed ${muted}`}>{note}</p>
      <dl className="grid gap-6 sm:grid-cols-2">
        {facts.address && (
          <div>
            <dt className="mb-1 text-xs font-semibold tracking-[0.14em] text-[var(--a)] uppercase">
              Endereço
            </dt>
            <dd className={muted}>{facts.address}</dd>
          </div>
        )}
        {facts.phoneDisplay && (
          <div>
            <dt className="mb-1 text-xs font-semibold tracking-[0.14em] text-[var(--a)] uppercase">
              Telefone
            </dt>
            <dd className={muted}>{facts.phoneDisplay}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/**
 * Lista aberta do que falta para o site definitivo. Parece contraintuitivo
 * mostrar isso ao cliente, mas é o oposto: deixa claro o que é protótipo e o
 * que entra com o material dele, e é o gancho natural da conversa.
 */
export function PlaceholderNote({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Section className="bg-[var(--s)]">
      <div className="rounded-2xl border border-dashed border-black/15 p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-[var(--a)] uppercase">
          Entra com o seu material
        </p>
        <p className="mb-4 text-[0.95rem] leading-relaxed text-black/65">
          Este é um protótipo montado a partir de informações públicas do seu
          negócio. No site definitivo, estes pontos entram com o conteúdo real:
        </p>
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full bg-white px-3.5 py-1.5 text-sm text-black/70 shadow-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** Assinatura da Arkeo. É o CTA do protótipo — a única parte que vende. */
export function ArkeoBar({
  businessName,
  agencyWhatsapp,
}: {
  businessName: string;
  /** Número da Arkeo, vindo da tabela `settings` — não hardcoded aqui. */
  agencyWhatsapp: string;
}) {
  const message = encodeURIComponent(
    `Oi! Vi o protótipo do site da ${businessName} e quero falar sobre ele.`,
  );
  return (
    <div className="sticky bottom-0 z-50 border-t border-white/10 bg-[#060c16] px-5 py-3 text-white sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/75">
          Protótipo feito pela{" "}
          <a
            href="https://www.arkeosistemas.com.br"
            className="font-semibold text-white underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Arkeo Sistemas
          </a>{" "}
          para {businessName}.
        </p>
        <a
          href={`https://wa.me/${agencyWhatsapp}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#2fbf71] px-5 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          Falar com a Arkeo
        </a>
      </div>
    </div>
  );
}
