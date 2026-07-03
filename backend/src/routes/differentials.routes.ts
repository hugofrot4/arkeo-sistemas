import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const DEFAULT_DIFFERENTIALS = [
  {
    icon: "zap",
    title: "IA no processo — mais velocidade, menos custo",
    desc: "Usamos inteligência artificial para acelerar o desenvolvimento sem abrir mão da qualidade, entregando mais rápido e por menos que uma agência tradicional.",
  },
  {
    icon: "message-circle",
    title: "Comunicação direta com quem desenvolve",
    desc: "Sem gerente de projeto como intermediário. Você fala diretamente com o desenvolvedor — decisões mais rápidas, menos ruído.",
  },
  {
    icon: "layers",
    title: "Stack moderna e escalável",
    desc: "Tecnologias atuais e código limpo que cresce com seu negócio. Nada de soluções que viram problema em dois anos.",
  },
  {
    icon: "shield-check",
    title: "Sem taxas surpresa — preço fechado",
    desc: "O que foi combinado é o que você paga. Proposta clara e detalhada antes de qualquer linha de código.",
  },
  {
    icon: "headphones",
    title: "Manutenção e suporte inclusos",
    desc: "A entrega não é o fim. Você conta com suporte técnico e atualizações para manter tudo funcionando no longo prazo.",
  },
  {
    icon: "target",
    title: "Foco total no seu resultado",
    desc: "Não vendemos tecnologia — resolvemos problemas de negócio. Cada decisão técnica é tomada com seu objetivo em mente.",
  },
];

export const differentialsRouter = Router();

differentialsRouter.get("/", async (_req, res) => {
  const differentials = await prisma.differential.findMany({
    orderBy: { order: "asc" },
  });
  res.json(differentials);
});

differentialsRouter.post("/", requireAuth, async (req, res) => {
  const { icon, title, desc } = req.body ?? {};
  if (
    typeof icon !== "string" ||
    typeof title !== "string" ||
    typeof desc !== "string"
  ) {
    res.status(400).json({ error: "Preencha todos os campos do diferencial." });
    return;
  }

  const count = await prisma.differential.count();
  const differential = await prisma.differential.create({
    data: { icon, title, desc, order: count },
  });
  res.status(201).json(differential);
});

differentialsRouter.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    res.status(400).json({ error: "Informe a lista ordenada de ids." });
    return;
  }

  await prisma.$transaction(
    ids.map((id: number, index: number) =>
      prisma.differential.update({ where: { id }, data: { order: index } }),
    ),
  );

  const differentials = await prisma.differential.findMany({
    orderBy: { order: "asc" },
  });
  res.json(differentials);
});

differentialsRouter.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { icon, title, desc } = req.body ?? {};
  if (
    typeof icon !== "string" ||
    typeof title !== "string" ||
    typeof desc !== "string"
  ) {
    res.status(400).json({ error: "Preencha todos os campos do diferencial." });
    return;
  }

  const differential = await prisma.differential
    .update({ where: { id }, data: { icon, title, desc } })
    .catch(() => null);

  if (!differential) {
    res.status(404).json({ error: "Diferencial não encontrado." });
    return;
  }
  res.json(differential);
});

differentialsRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.differential.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
