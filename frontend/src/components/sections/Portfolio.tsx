import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

const projects = [
  {
    gradient: "linear-gradient(135deg, #0D1B2E, #1a3a6e)",
    icon: "🏋️",
    tag: "Landing Page",
    title: "FitPro Academia",
    result: "+40% em matrículas no primeiro mês",
    delay: "0s",
  },
  {
    gradient: "linear-gradient(135deg, #1a1028, #3d1a5e)",
    icon: "🍰",
    tag: "Site Institucional",
    title: "Sabor & Arte Confeitaria",
    result: "Pedidos online cresceram 3× após lançamento",
    delay: "0.1s",
  },
  {
    gradient: "linear-gradient(135deg, #082040, #0D4E8F)",
    icon: "🚚",
    tag: "Sistema Web",
    title: "LogiTrack Transportes",
    result: "Redução de 60% em chamadas de suporte",
    delay: "0.2s",
  },
];

function Portfolio() {
  return (
    <section id="projetos" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mb-16 text-center">
          <SectionLabel centered>Projetos</SectionLabel>
          <h2 className="font-family-display mb-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] font-bold text-white">
            Resultados que falam
            <br />
            por si mesmos
          </h2>
          <p className="text-text-muted mx-auto max-w-[580px] text-[1.05rem]">
            Cada projeto é uma solução única construída para o problema
            específico do cliente.
          </p>
        </Reveal>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal
              key={project.title}
              delay={project.delay}
              className={`border-border bg-surface hover:border-accent/30 overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                index === 2
                  ? "sm:col-span-2 sm:mx-auto sm:max-w-[400px] lg:col-span-1 lg:mx-0 lg:max-w-none"
                  : ""
              }`}
            >
              <div
                className="relative flex h-[175px] items-center justify-center text-[2.5rem]"
                style={{ background: project.gradient }}
              >
                <span className="relative z-10 opacity-75" aria-hidden="true">
                  {project.icon}
                </span>
              </div>
              <div className="p-6">
                <span className="text-accent bg-accent/10 mb-2 inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.1em] uppercase">
                  {project.tag}
                </span>
                <h3 className="font-family-display mb-2 text-[1.025rem] font-bold text-white">
                  {project.title}
                </h3>
                <p className="text-text-muted before:text-accent flex items-center gap-1.5 text-[0.82rem] before:text-[0.55rem] before:content-['✦']">
                  {project.result}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center">
          <a
            href="#contato"
            className="border-border text-text hover:border-accent hover:text-accent font-family-display inline-flex items-center gap-2 rounded-lg border-[1.5px] px-6.5 py-3.25 text-[0.925rem] font-semibold transition"
          >
            <ArrowRight size={17} aria-hidden="true" />
            Quer um projeto assim? Fale conosco
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export default Portfolio;
