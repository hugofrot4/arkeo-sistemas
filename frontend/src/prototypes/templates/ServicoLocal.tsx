// Serviço local direto: oficina, chaveiro, dedetizadora, academia, pet shop.
// Quem procura isso quer resolver hoje — telefone grande, CTA repetido,
// nenhuma sofisticação que atrase a ligação.

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

export default function ServicoLocal({ content }: TemplateProps) {
  const { facts, hero, services, about, proof, faq, location, tagline } = content;
  const cta = facts.whatsapp ? `https://wa.me/${facts.whatsapp}` : "#contato";

  return (
    <>
      <div className="bg-[var(--p)] text-white">
        <header className="px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Brandmark name={facts.name} onDark />
            {facts.phoneDisplay && (
              <a href={cta} className="text-sm font-bold sm:text-base">
                {facts.phoneDisplay}
              </a>
            )}
          </div>
        </header>

        <Section className="pt-6 pb-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--a)] uppercase">
            {tagline}
          </p>
          <h1 className="mb-5 max-w-3xl text-3xl leading-[1.08] font-bold text-balance sm:text-5xl md:text-6xl">
            {hero.headline}
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-white/75">
            {hero.subheadline}
          </p>
          <div className="flex flex-wrap gap-3">
            <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
            {facts.phoneDisplay && (
              <a
                href={cta}
                className="inline-flex items-center rounded-full border-2 border-white/30 px-7 py-3.5 font-semibold"
              >
                {facts.phoneDisplay}
              </a>
            )}
          </div>
        </Section>
      </div>

      <Section className="bg-[var(--s)]">
        <SectionTitle kicker="O que fazemos">{services.title}</SectionTitle>
        <ServicesGrid items={services.items} numbered />
      </Section>

      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionTitle>{about.title}</SectionTitle>
            <p className="text-lg leading-relaxed text-black/70">{about.body}</p>
          </div>
          <ProofBlock title={proof.title} note={proof.note} facts={facts} />
        </div>
      </Section>

      <Section className="bg-[var(--s)]">
        <FaqBlock title={faq.title} items={faq.items} />
      </Section>

      <Section id="contato">
        <LocationBlock title={location.title} note={location.note} facts={facts} />
        <div className="mt-8">
          <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
        </div>
      </Section>
    </>
  );
}
