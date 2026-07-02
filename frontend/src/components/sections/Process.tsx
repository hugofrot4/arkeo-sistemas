import { useEffect, useState } from "react";
import { processApi, type ProcessStep } from "../../lib/api";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

const defaultSteps: ProcessStep[] = [
  {
    id: 1,
    title: "Conversa",
    desc: "Entendemos seu negócio, suas dores e o que você quer resolver. Sem formulários longos, sem burocracia.",
    order: 0,
  },
  {
    id: 2,
    title: "Proposta",
    desc: "Enviamos escopo, prazo e investimento com preço fechado. Zero surpresas financeiras no meio do caminho.",
    order: 1,
  },
  {
    id: 3,
    title: "Desenvolvimento",
    desc: "Você acompanha o progresso em tempo real e fala diretamente com quem está desenvolvendo.",
    order: 2,
  },
  {
    id: 4,
    title: "Entrega & Suporte",
    desc: "Lançamos com treinamento incluso e suporte contínuo para você nunca ficar na mão após o lançamento.",
    order: 3,
  },
];

function Process() {
  const [steps, setSteps] = useState<ProcessStep[]>(defaultSteps);

  useEffect(() => {
    processApi
      .list()
      .then(setSteps)
      .catch(() => setSteps(defaultSteps));
  }, []);

  return (
    <section id="processo" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mb-16 text-center">
          <SectionLabel centered>Como funciona</SectionLabel>
          <h2 className="font-family-display mb-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] font-bold text-white">
            De conversa a entrega,
            <br />
            sem enrolação
          </h2>
          <p className="text-text-muted mx-auto max-w-[580px] text-[1.05rem]">
            Um processo direto em {steps.length} etapas para você saber
            exatamente o que esperar do primeiro contato ao go-live.
          </p>
        </Reveal>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
          {steps.length === 4 && (
            <div
              className="absolute top-[27px] right-[calc(12.5%+16px)] left-[calc(12.5%+16px)] hidden h-px md:block"
              style={{
                background:
                  "linear-gradient(90deg, var(--color-accent) 0%, rgba(61,120,245,0.15) 50%, var(--color-accent) 100%)",
              }}
            />
          )}
          {steps.map((step, index) => (
            <Reveal
              key={step.id}
              delay={`${index * 0.15}s`}
              className="relative z-10 grid grid-cols-[54px_1fr] items-start gap-4 text-left md:block md:text-center"
            >
              <div
                className="border-accent bg-surface text-accent font-family-display flex h-13.5 w-13.5 items-center justify-center rounded-full border-2 text-[0.9rem] font-bold md:mx-auto md:mb-6"
                style={{ boxShadow: "0 0 0 6px rgba(61,120,245,0.07)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <h3 className="font-family-display mb-2 text-base font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-text-muted text-[0.85rem] leading-[1.65]">
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Process;
