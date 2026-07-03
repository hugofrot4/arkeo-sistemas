import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const MAX_STEPS = 6;

export const DEFAULT_STEPS = [
  {
    title: "Conversa",
    desc: "Entendemos seu negócio, suas dores e o que você quer resolver. Sem formulários longos, sem burocracia.",
  },
  {
    title: "Proposta",
    desc: "Enviamos escopo, prazo e investimento com preço fechado. Zero surpresas financeiras no meio do caminho.",
  },
  {
    title: "Desenvolvimento",
    desc: "Você acompanha o progresso em tempo real e fala diretamente com quem está desenvolvendo.",
  },
  {
    title: "Entrega & Suporte",
    desc: "Lançamos com treinamento incluso e suporte contínuo para você nunca ficar na mão após o lançamento.",
  },
];

export const processRouter = Router();

processRouter.get("/", async (_req, res) => {
  const steps = await prisma.processStep.findMany({
    orderBy: { order: "asc" },
  });
  res.json(steps);
});

processRouter.post("/", requireAuth, async (req, res) => {
  const { title, desc } = req.body ?? {};
  if (typeof title !== "string" || typeof desc !== "string") {
    res.status(400).json({ error: "Informe título e descrição." });
    return;
  }

  const count = await prisma.processStep.count();
  if (count >= MAX_STEPS) {
    res.status(400).json({ error: `Limite de ${MAX_STEPS} etapas atingido.` });
    return;
  }

  const step = await prisma.processStep.create({
    data: { title, desc, order: count },
  });
  res.status(201).json(step);
});

processRouter.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    res.status(400).json({ error: "Informe a lista ordenada de ids." });
    return;
  }

  await prisma.$transaction(
    ids.map((id: number, index: number) =>
      prisma.processStep.update({ where: { id }, data: { order: index } }),
    ),
  );

  const steps = await prisma.processStep.findMany({
    orderBy: { order: "asc" },
  });
  res.json(steps);
});

processRouter.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { title, desc } = req.body ?? {};
  if (typeof title !== "string" || typeof desc !== "string") {
    res.status(400).json({ error: "Informe título e descrição." });
    return;
  }

  const step = await prisma.processStep
    .update({ where: { id }, data: { title, desc } })
    .catch(() => null);

  if (!step) {
    res.status(404).json({ error: "Etapa não encontrada." });
    return;
  }
  res.json(step);
});

processRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.processStep.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
