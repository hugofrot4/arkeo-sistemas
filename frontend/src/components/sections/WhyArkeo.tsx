import {
  Headphones,
  Layers,
  MessageCircle,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

const differentials = [
  {
    icon: Zap,
    title: "IA no processo — mais velocidade, menos custo",
    description:
      "Usamos inteligência artificial para acelerar o desenvolvimento sem abrir mão da qualidade, entregando mais rápido e por menos que uma agência tradicional.",
    delay: "0s",
  },
  {
    icon: MessageCircle,
    title: "Comunicação direta com quem desenvolve",
    description:
      "Sem gerente de projeto como intermediário. Você fala diretamente com o desenvolvedor — decisões mais rápidas, menos ruído.",
    delay: "0.1s",
  },
  {
    icon: Layers,
    title: "Stack moderna e escalável",
    description:
      "Tecnologias atuais e código limpo que cresce com seu negócio. Nada de soluções que viram problema em dois anos.",
    delay: "0.2s",
  },
  {
    icon: ShieldCheck,
    title: "Sem taxas surpresa — preço fechado",
    description:
      "O que foi combinado é o que você paga. Proposta clara e detalhada antes de qualquer linha de código.",
    delay: "0.05s",
  },
  {
    icon: Headphones,
    title: "Manutenção e suporte inclusos",
    description:
      "A entrega não é o fim. Você conta com suporte técnico e atualizações para manter tudo funcionando no longo prazo.",
    delay: "0.15s",
  },
  {
    icon: Target,
    title: "Foco total no seu resultado",
    description:
      "Não vendemos tecnologia — resolvemos problemas de negócio. Cada decisão técnica é tomada com seu objetivo em mente.",
    delay: "0.25s",
  },
];

function WhyArkeo() {
  return (
    <section id="diferenciais" className="bg-bg-alt scroll-mt-24 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mb-16">
          <SectionLabel>Por que a Arkeo?</SectionLabel>
          <h2 className="font-family-display mb-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] font-bold text-white">
            O que nos diferencia
            <br />
            das agências tradicionais
          </h2>
          <p className="text-text-muted max-w-[580px] text-[1.05rem]">
            Sem promessas genéricas — razões concretas pelas quais empresas
            escolhem a Arkeo Sistemas.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {differentials.map((item) => {
            const Icon = item.icon;
            return (
              <Reveal
                key={item.title}
                delay={item.delay}
                className="border-border bg-surface hover:border-accent/30 rounded-xl border p-6 transition-colors duration-300"
              >
                <div className="text-accent mb-4 flex h-[38px] w-[38px] items-center justify-center">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="font-family-display mb-2 text-[0.975rem] font-bold text-white">
                  {item.title}
                </h3>
                <p className="text-text-muted text-[0.875rem] leading-[1.65]">
                  {item.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyArkeo;
