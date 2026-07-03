import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { portfolioApi, type PortfolioProject } from "../../lib/api";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

function placeholderImage(from: string, to: string, emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="168" font-size="90" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const defaultProjects: PortfolioProject[] = [
  {
    id: 1,
    tag: "Landing Page",
    title: "FitPro Academia",
    result: "+40% em matrículas no primeiro mês",
    image: placeholderImage("#0D1B2E", "#1a3a6e", "🏋️"),
    order: 0,
  },
  {
    id: 2,
    tag: "Site Institucional",
    title: "Sabor & Arte Confeitaria",
    result: "Pedidos online cresceram 3× após lançamento",
    image: placeholderImage("#1a1028", "#3d1a5e", "🍰"),
    order: 1,
  },
  {
    id: 3,
    tag: "Sistema Web",
    title: "LogiTrack Transportes",
    result: "Redução de 60% em chamadas de suporte",
    image: placeholderImage("#082040", "#0D4E8F", "🚚"),
    order: 2,
  },
];

function Portfolio() {
  const [projects, setProjects] = useState<PortfolioProject[]>(
    defaultProjects,
  );

  useEffect(() => {
    portfolioApi
      .list()
      .then(setProjects)
      .catch(() => setProjects(defaultProjects));
  }, []);

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
              key={project.id}
              delay={`${index * 0.1}s`}
              className="border-border bg-surface hover:border-accent/30 overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="bg-bg-alt h-43.75 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
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
