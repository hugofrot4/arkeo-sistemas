import { Plus } from "lucide-react";
import { useState } from "react";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

const faqs = [
  {
    question: "Quanto tempo leva para ter meu site pronto?",
    answer:
      "Landing pages ficam prontas em 7 a 14 dias. Sites institucionais levam de 14 a 30 dias. Sistemas e apps têm prazo definido na proposta após levantamento de requisitos. Trabalhamos sempre com datas reais — sem estimativas otimistas que não se cumprem.",
    delay: "0s",
  },
  {
    question: "Vocês fazem manutenção após o lançamento?",
    answer:
      "Sim. Oferecemos suporte técnico pós-entrega e planos de manutenção mensal. Você nunca ficará sem apoio depois que seu projeto for ao ar — seja para correções, atualizações de conteúdo ou melhorias.",
    delay: "0.05s",
  },
  {
    question: "Preciso de conhecimento técnico para gerenciar o site?",
    answer:
      "Não. Todos os projetos são entregues com treinamento incluso. Sites com CMS têm edição simples — como editar um documento de texto. Para o restante, nossa equipe de suporte está disponível.",
    delay: "0.1s",
  },
  {
    question: "Vocês trabalham com contrato?",
    answer:
      "Sempre. Todos os projetos têm contrato com escopo, prazos, valores e condições de pagamento claramente definidos. Isso protege ambos os lados e garante que o combinado será entregue.",
    delay: "0.15s",
  },
  {
    question: "Qual é o investimento necessário?",
    answer:
      "Os valores variam conforme o escopo de cada projeto. Após nossa conversa inicial você recebe uma proposta com preço fechado — sem custos ocultos. Fale conosco para uma análise inicial gratuita.",
    delay: "0.2s",
  },
  {
    question: "Consigo acompanhar o desenvolvimento em tempo real?",
    answer:
      "Sim. Utilizamos ferramentas de acompanhamento e você recebe atualizações regulares. Em qualquer momento pode falar diretamente com quem está desenvolvendo — sem intermediários, sem burocracia.",
    delay: "0.25s",
  },
];

function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-bg-alt scroll-mt-24 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mb-16 text-center">
          <SectionLabel centered>Dúvidas frequentes</SectionLabel>
          <h2 className="font-family-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] font-bold text-white">
            Perguntas que todo
            <br />
            cliente faz
          </h2>
        </Reveal>

        <div className="mx-auto flex max-w-[740px] flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <Reveal
                key={faq.question}
                delay={faq.delay}
                className={`border-border bg-surface overflow-hidden rounded-xl border transition-colors duration-300 ${
                  isOpen ? "border-accent/30" : ""
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="font-family-display text-text flex w-full items-center justify-between gap-4 p-6 text-left text-[0.975rem] font-semibold transition-colors hover:text-white"
                >
                  {faq.question}
                  <Plus
                    size={20}
                    aria-hidden="true"
                    className={`text-accent shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-[380ms] ease-in-out ${
                    isOpen ? "max-h-[260px]" : "max-h-0"
                  }`}
                >
                  <div className="text-text-muted px-6 pb-6 text-[0.9rem] leading-[1.75]">
                    {faq.answer}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Faq;
