// Alimentação: restaurante, lanchonete, cafeteria, padaria.
// Hero escuro de tela cheia e cardápio em lista — o item e a descrição pesam
// mais que a foto, que aqui não temos.

import Reveal from "../../components/ui/Reveal";
import {
  Brandmark,
  CtaButton,
  FaqBlock,
  LocationBlock,
  ProofBlock,
  Section,
  SectionTitle,
} from "../blocks";
import type { TemplateProps } from "../types";

export default function Food({ content }: TemplateProps) {
  const { facts, hero, services, about, proof, faq, location, tagline } = content;
  const cta = facts.whatsapp ? `https://wa.me/${facts.whatsapp}` : "#contato";

  return (
    <>
      <div className="relative overflow-hidden bg-[var(--p)] text-white">
        <div
          aria-hidden
          className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-[var(--a)] opacity-25 blur-3xl"
        />
        <header className="relative px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Brandmark name={facts.name} onDark />
            <a href={cta} className="text-sm font-semibold text-[var(--a)]">
              Pedir
            </a>
          </div>
        </header>
        <Section className="relative pt-10 pb-24 text-center">
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-[var(--a)] uppercase">
            {tagline}
          </p>
          <h1 className="mx-auto mb-5 max-w-3xl text-4xl leading-[1.05] font-bold text-balance sm:text-5xl md:text-6xl">
            {hero.headline}
          </h1>
          <p className="mx-auto mb-9 max-w-xl text-lg leading-relaxed text-white/75">
            {hero.subheadline}
          </p>
          <CtaButton href={cta}>{hero.ctaPrimary}</CtaButton>
        </Section>
      </div>

      <Section>
        <SectionTitle kicker="Cardápio">{services.title}</SectionTitle>
        <ul className="divide-y divide-black/8 border-y border-black/8">
          {services.items.map((item, i) => (
            <Reveal key={item.name} delay={`${i * 50}ms`}>
              <li className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="text-lg font-semibold sm:w-64 sm:shrink-0">{item.name}</span>
                <span className="leading-relaxed text-black/65">{item.description}</span>
              </li>
            </Reveal>
          ))}
        </ul>
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
