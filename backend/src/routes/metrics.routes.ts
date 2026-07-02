import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const MAX_METRICS = 4;

const DEFAULT_METRICS = [
  { number: "+20", label: "Projetos entregues" },
  { number: "6", label: "Anos de experiência" },
  { number: "100%", label: "Remoto e ágil" },
  { number: "✦", label: "Suporte contínuo" },
];

export const metricsRouter = Router();

metricsRouter.get("/", async (_req, res) => {
  const existing = await prisma.metric.count();
  if (existing === 0) {
    await prisma.metric.createMany({
      data: DEFAULT_METRICS.map((m, order) => ({ ...m, order })),
    });
  }

  const metrics = await prisma.metric.findMany({ orderBy: { order: "asc" } });
  res.json(metrics);
});

metricsRouter.post("/", requireAuth, async (req, res) => {
  const { number, label } = req.body ?? {};
  if (typeof number !== "string" || typeof label !== "string") {
    res.status(400).json({ error: "Informe número e legenda." });
    return;
  }

  const count = await prisma.metric.count();
  if (count >= MAX_METRICS) {
    res.status(400).json({
      error: `Limite de ${MAX_METRICS} métricas atingido.`,
    });
    return;
  }

  const metric = await prisma.metric.create({
    data: { number, label, order: count },
  });
  res.status(201).json(metric);
});

metricsRouter.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    res.status(400).json({ error: "Informe a lista ordenada de ids." });
    return;
  }

  await prisma.$transaction(
    ids.map((id: number, index: number) =>
      prisma.metric.update({ where: { id }, data: { order: index } }),
    ),
  );

  const metrics = await prisma.metric.findMany({ orderBy: { order: "asc" } });
  res.json(metrics);
});

metricsRouter.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { number, label } = req.body ?? {};
  if (typeof number !== "string" || typeof label !== "string") {
    res.status(400).json({ error: "Informe número e legenda." });
    return;
  }

  const metric = await prisma.metric
    .update({ where: { id }, data: { number, label } })
    .catch(() => null);

  if (!metric) {
    res.status(404).json({ error: "Métrica não encontrada." });
    return;
  }
  res.json(metric);
});

metricsRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.metric.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
