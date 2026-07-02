import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const DEFAULT_SERVICES = [
  {
    icon: "layout",
    title: "Landing Page",
    desc: "Site de alta conversão para capturar leads e vender produtos ou serviços. Design persuasivo e copy focado em resultado.",
    meta: "Entrega em 7–14 dias",
  },
  {
    icon: "building-2",
    title: "Site Institucional",
    desc: "Presença digital completa com múltiplas páginas, gestão de conteúdo e identidade visual que transmite credibilidade.",
    meta: "Entrega em 14–30 dias",
  },
  {
    icon: "settings-2",
    title: "Sistema Web / App",
    desc: "Aplicações sob medida para automatizar processos, organizar operações e escalar sem contratar mais pessoas.",
    meta: "Prazo definido no escopo",
  },
];

export const servicesRouter = Router();

servicesRouter.get("/", async (_req, res) => {
  const existing = await prisma.service.count();
  if (existing === 0) {
    await prisma.service.createMany({
      data: DEFAULT_SERVICES.map((s, order) => ({ ...s, order })),
    });
  }

  const services = await prisma.service.findMany({
    orderBy: { order: "asc" },
  });
  res.json(services);
});

servicesRouter.post("/", requireAuth, async (req, res) => {
  const { icon, title, desc, meta } = req.body ?? {};
  if (
    typeof icon !== "string" ||
    typeof title !== "string" ||
    typeof desc !== "string" ||
    typeof meta !== "string"
  ) {
    res.status(400).json({ error: "Preencha todos os campos do serviço." });
    return;
  }

  const count = await prisma.service.count();
  const service = await prisma.service.create({
    data: { icon, title, desc, meta, order: count },
  });
  res.status(201).json(service);
});

servicesRouter.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    res.status(400).json({ error: "Informe a lista ordenada de ids." });
    return;
  }

  await prisma.$transaction(
    ids.map((id: number, index: number) =>
      prisma.service.update({ where: { id }, data: { order: index } }),
    ),
  );

  const services = await prisma.service.findMany({
    orderBy: { order: "asc" },
  });
  res.json(services);
});

servicesRouter.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { icon, title, desc, meta } = req.body ?? {};
  if (
    typeof icon !== "string" ||
    typeof title !== "string" ||
    typeof desc !== "string" ||
    typeof meta !== "string"
  ) {
    res.status(400).json({ error: "Preencha todos os campos do serviço." });
    return;
  }

  const service = await prisma.service
    .update({ where: { id }, data: { icon, title, desc, meta } })
    .catch(() => null);

  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado." });
    return;
  }
  res.json(service);
});

servicesRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.service.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
