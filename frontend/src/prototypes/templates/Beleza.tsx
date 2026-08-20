// Beleza e estética: salão, barbearia, spa, manicure, estética.
// Muito respiro, hero centrado, paleta clara. Elegância aqui é whitespace,
// não ornamento.

import {
  Brandmark,
  CtaButton,
  FaqBlock,
  LocationBlock,
  ProofBlock,
  Section,
  SectionTitle,
  ServicesGrid,
} from "../blocks";
import type { TemplateProps } from "../types";

export default function Beleza({ content }: TemplateProps) {
  const { facts, hero, services, about, proof, faq, location, tagline } = content;
  const cta = facts.whatsapp ? `https://wa.me/${facts.whatsapp}` : "#contato";

  return (
    <>
      <div className="bg-[var(--s)]">
        <header className="px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Brandmark name={facts.name} />
            <a href={cta} className="text-sm font-semibold text-[var(--a)]">
              Agendar horário
            </a>
          </div>
        </header>
        <Section className="pt-12 pb-24 text-center">
          <p className="mb-5 text-xs font-semibold tracking-[0.24em] text-[var(--a)] uppercase">
            {tagline}
          </p>
          <h1 className="mx-auto mb-6 max-w-3xl text-3xl leading-[1.12] font-bold text-balance sm:text-5xl">
            {hero.headline}
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-black/60">
            {hero.subheadline}
          </p>
          <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
        </Section>
      </div>

      <Section>
        <SectionTitle kicker="Serviços">{services.title}</SectionTitle>
        <ServicesGrid items={services.items} />
      </Section>

      <Section className="bg-[var(--p)] text-white">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionTitle>{about.title}</SectionTitle>
            <p className="text-lg leading-relaxed text-white/75">{about.body}</p>
          </div>
          <ProofBlock title={proof.title} note={proof.note} facts={facts} onDark />
        </div>
      </Section>

      <Section>
        <FaqBlock title={faq.title} items={faq.items} />
      </Section>

      <Section id="contato" className="bg-[var(--s)]">
        <LocationBlock title={location.title} note={location.note} facts={facts} />
        <div className="mt-8">
          <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
        </div>
      </Section>
    </>
  );
}
