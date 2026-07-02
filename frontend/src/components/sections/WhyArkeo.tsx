import { useEffect, useState } from "react";
import { differentialsApi, type Differential } from "../../lib/api";
import { getIconComponent } from "../../lib/icons";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

const defaultDifferentials: Differential[] = [
  {
    id: 1,
    icon: "zap",
    title: "IA no processo — mais velocidade, menos custo",
    desc: "Usamos inteligência artificial para acelerar o desenvolvimento sem abrir mão da qualidade, entregando mais rápido e por menos que uma agência tradicional.",
    order: 0,
  },
  {
    id: 2,
    icon: "message-circle",
    title: "Comunicação direta com quem desenvolve",
    desc: "Sem gerente de projeto como intermediário. Você fala diretamente com o desenvolvedor — decisões mais rápidas, menos ruído.",
    order: 1,
  },
  {
    id: 3,
    icon: "layers",
    title: "Stack moderna e escalável",
    desc: "Tecnologias atuais e código limpo que cresce com seu negócio. Nada de soluções que viram problema em dois anos.",
    order: 2,
  },
  {
    id: 4,
    icon: "shield-check",
    title: "Sem taxas surpresa — preço fechado",
    desc: "O que foi combinado é o que você paga. Proposta clara e detalhada antes de qualquer linha de código.",
    order: 3,
  },
  {
    id: 5,
    icon: "headphones",
    title: "Manutenção e suporte inclusos",
    desc: "A entrega não é o fim. Você conta com suporte técnico e atualizações para manter tudo funcionando no longo prazo.",
    order: 4,
  },
  {
    id: 6,
    icon: "target",
    title: "Foco total no seu resultado",
    desc: "Não vendemos tecnologia — resolvemos problemas de negócio. Cada decisão técnica é tomada com seu objetivo em mente.",
    order: 5,
  },
];

function WhyArkeo() {
  const [differentials, setDifferentials] = useState<Differential[]>(
    defaultDifferentials,
  );

  useEffect(() => {
    differentialsApi
      .list()
      .then(setDifferentials)
      .catch(() => setDifferentials(defaultDifferentials));
  }, []);

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
          {differentials.map((item, index) => {
            const Icon = getIconComponent(item.icon);
            return (
              <Reveal
                key={item.id}
                delay={`${index * 0.1}s`}
                className="border-border bg-surface hover:border-accent/30 rounded-xl border p-6 transition-colors duration-300"
              >
                <div className="text-accent mb-4 flex h-9.5 w-9.5 items-center justify-center">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="font-family-display mb-2 text-[0.975rem] font-bold text-white">
                  {item.title}
                </h3>
                <p className="text-text-muted text-[0.875rem] leading-[1.65]">
                  {item.desc}
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
