import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const DEFAULT_FAQS = [
  {
    question: "Quanto tempo leva para ter meu site pronto?",
    answer:
      "Landing pages ficam prontas em 7 a 14 dias. Sites institucionais levam de 14 a 30 dias. Sistemas e apps têm prazo definido na proposta após levantamento de requisitos. Trabalhamos sempre com datas reais — sem estimativas otimistas que não se cumprem.",
  },
  {
    question: "Vocês fazem manutenção após o lançamento?",
    answer:
      "Sim. Oferecemos suporte técnico pós-entrega e planos de manutenção mensal. Você nunca ficará sem apoio depois que seu projeto for ao ar — seja para correções, atualizações de conteúdo ou melhorias.",
  },
  {
    question: "Preciso de conhecimento técnico para gerenciar o site?",
    answer:
      "Não. Todos os projetos são entregues com treinamento incluso. Sites com CMS têm edição simples — como editar um documento de texto. Para o restante, nossa equipe de suporte está disponível.",
  },
  {
    question: "Vocês trabalham com contrato?",
    answer:
      "Sempre. Todos os projetos têm contrato com escopo, prazos, valores e condições de pagamento claramente definidos. Isso protege ambos os lados e garante que o combinado será entregue.",
  },
  {
    question: "Qual é o investimento necessário?",
    answer:
      "Os valores variam conforme o escopo de cada projeto. Após nossa conversa inicial você recebe uma proposta com preço fechado — sem custos ocultos. Fale conosco para uma análise inicial gratuita.",
  },
  {
    question: "Consigo acompanhar o desenvolvimento em tempo real?",
    answer:
      "Sim. Utilizamos ferramentas de acompanhamento e você recebe atualizações regulares. Em qualquer momento pode falar diretamente com quem está desenvolvendo — sem intermediários, sem burocracia.",
  },
];

export const faqRouter = Router();

faqRouter.get("/", async (_req, res) => {
  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
  res.json(faqs);
});

faqRouter.post("/", requireAuth, async (req, res) => {
  const { question, answer } = req.body ?? {};
  if (typeof question !== "string" || typeof answer !== "string") {
    res.status(400).json({ error: "Informe pergunta e resposta." });
    return;
  }

  const count = await prisma.faq.count();
  const faq = await prisma.faq.create({
    data: { question, answer, order: count },
  });
  res.status(201).json(faq);
});

faqRouter.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    res.status(400).json({ error: "Informe a lista ordenada de ids." });
    return;
  }

  await prisma.$transaction(
    ids.map((id: number, index: number) =>
      prisma.faq.update({ where: { id }, data: { order: index } }),
    ),
  );

  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
  res.json(faqs);
});

faqRouter.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { question, answer } = req.body ?? {};
  if (typeof question !== "string" || typeof answer !== "string") {
    res.status(400).json({ error: "Informe pergunta e resposta." });
    return;
  }

  const faq = await prisma.faq
    .update({ where: { id }, data: { question, answer } })
    .catch(() => null);

  if (!faq) {
    res.status(404).json({ error: "Pergunta não encontrada." });
    return;
  }
  res.json(faq);
});

faqRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.faq.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
