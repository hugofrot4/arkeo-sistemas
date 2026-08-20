// Serviços profissionais: advocacia, contabilidade, arquitetura, corretagem,
// seguros. Sóbrio, credibilidade em primeiro lugar, nenhuma promessa de
// resultado — em advocacia e contabilidade isso é regra de publicidade, não
// preferência de estilo.

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

export default function Juridico({ content }: TemplateProps) {
  const { facts, hero, services, about, proof, faq, location, tagline } = content;
  const cta = facts.whatsapp ? `https://wa.me/${facts.whatsapp}` : "#contato";

  return (
    <>
      <div className="bg-[var(--p)] text-white">
        <header className="border-b border-white/10 px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Brandmark name={facts.name} onDark />
            <a href={cta} className="text-sm font-semibold text-white/80">
              Falar com a equipe
            </a>
          </div>
        </header>
        <Section className="pt-14 pb-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-[var(--a)] uppercase">
              {tagline}
            </p>
            <h1 className="mb-6 text-3xl leading-[1.14] font-bold text-balance sm:text-4xl md:text-5xl">
              {hero.headline}
            </h1>
            <p className="mb-9 text-lg leading-relaxed text-white/75">{hero.subheadline}</p>
            <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
          </div>
        </Section>
      </div>

      <Section>
        <SectionTitle kicker="Áreas de atuação">{services.title}</SectionTitle>
        <ServicesGrid items={services.items} numbered />
      </Section>

      <Section className="bg-[var(--s)]">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionTitle>{about.title}</SectionTitle>
            <p className="text-lg leading-relaxed text-black/70">{about.body}</p>
          </div>
          <ProofBlock title={proof.title} note={proof.note} facts={facts} />
        </div>
      </Section>

      <Section>
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
