import { Building2, Clock, Layout, Settings2 } from "lucide-react";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

const services = [
  {
    icon: Layout,
    title: "Landing Page",
    description:
      "Site de alta conversão para capturar leads e vender produtos ou serviços. Design persuasivo e copy focado em resultado.",
    meta: "Entrega em 7–14 dias",
    delay: "0s",
  },
  {
    icon: Building2,
    title: "Site Institucional",
    description:
      "Presença digital completa com múltiplas páginas, gestão de conteúdo e identidade visual que transmite credibilidade.",
    meta: "Entrega em 14–30 dias",
    delay: "0.1s",
  },
  {
    icon: Settings2,
    title: "Sistema Web / App",
    description:
      "Aplicações sob medida para automatizar processos, organizar operações e escalar sem contratar mais pessoas.",
    meta: "Prazo definido no escopo",
    delay: "0.2s",
  },
];

function Services() {
  return (
    <section id="servicos" className="bg-bg-alt scroll-mt-24 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mb-16">
          <SectionLabel>O que entregamos</SectionLabel>
          <h2 className="font-family-display mb-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] font-bold text-white">
            Soluções digitais que
            <br />
            geram resultado real
          </h2>
          <p className="text-text-muted max-w-[580px] text-[1.05rem]">
            Do site de apresentação ao sistema sob medida — construímos
            exatamente o que seu negócio precisa, sem exageros e sem falta.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal
                key={service.title}
                delay={service.delay}
                className={`border-border bg-surface hover:bg-surface-hover hover:border-accent/30 group relative overflow-hidden rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                  index === 2
                    ? "sm:col-span-2 sm:max-w-[420px] lg:col-span-1 lg:max-w-none"
                    : ""
                }`}
              >
                <div className="via-accent/20 from-accent absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="bg-accent/10 text-accent mb-6 flex h-[46px] w-[46px] items-center justify-center rounded-lg">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="font-family-display mb-2 text-[1.1rem] font-bold text-white">
                  {service.title}
                </h3>
                <p className="text-text-muted mb-6 text-[0.9rem] leading-[1.65]">
                  {service.description}
                </p>
                <div className="text-accent font-family-display flex items-center gap-1.5 text-[0.78rem] font-semibold">
                  <Clock size={13} aria-hidden="true" />
                  {service.meta}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Services;
