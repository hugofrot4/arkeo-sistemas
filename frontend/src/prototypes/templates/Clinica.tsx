// Saúde e bem-estar: clínica, odontologia, fisioterapia, veterinária.
// Tom calmo, formas arredondadas, foco em confiança e agendamento fácil.

import Reveal from "../../components/ui/Reveal";
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

export default function Clinica({ content }: TemplateProps) {
  const { facts, hero, services, about, proof, faq, location, tagline } = content;
  const cta = facts.whatsapp ? `https://wa.me/${facts.whatsapp}` : "#contato";

  return (
    <>
      <header className="px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Brandmark name={facts.name} />
          <a href={cta} className="text-sm font-semibold text-[var(--a)]">
            Agendar
          </a>
        </div>
      </header>

      <Section className="bg-gradient-to-b from-[var(--s)] to-white pt-8 md:pt-12">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--a)] uppercase">
              {tagline}
            </p>
            <h1 className="mb-5 text-3xl leading-[1.1] font-bold text-balance sm:text-4xl md:text-5xl">
              {hero.headline}
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-black/65">
              {hero.subheadline}
            </p>
            <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
          </div>
          <Reveal>
            <div className="rounded-3xl bg-[var(--p)] p-8 text-white shadow-xl">
              <p className="mb-6 text-sm text-white/70">
                {facts.neighborhood ? `Atendimento em ${facts.neighborhood}` : "Atendimento local"}
              </p>
              {facts.rating !== null && (
                <>
                  <p className="text-5xl font-bold">{facts.rating.toFixed(1)}</p>
                  <p className="mt-1 text-sm text-white/70">
                    {facts.reviewCount} avaliações no Google
                  </p>
                </>
              )}
              {facts.phoneDisplay && (
                <p className="mt-6 border-t border-white/15 pt-6 text-lg font-semibold">
                  {facts.phoneDisplay}
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionTitle kicker="Atendimentos">{services.title}</SectionTitle>
        <ServicesGrid items={services.items} />
      </Section>

      <Section className="bg-[var(--s)]">
        <SectionTitle>{about.title}</SectionTitle>
        <p className="max-w-3xl text-lg leading-relaxed text-black/70">{about.body}</p>
      </Section>

      <Section>
        <ProofBlock title={proof.title} note={proof.note} facts={facts} />
      </Section>

      <Section className="bg-[var(--s)]">
        <FaqBlock title={faq.title} items={faq.items} />
      </Section>

      <Section id="contato" className="bg-[var(--p)] text-white">
        <LocationBlock title={location.title} note={location.note} facts={facts} onDark />
        <div className="mt-8">
          <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
        </div>
      </Section>
    </>
  );
}
