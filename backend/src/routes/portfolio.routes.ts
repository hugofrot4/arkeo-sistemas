import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const DEFAULT_PROJECTS = [
  {
    tag: "Landing Page",
    title: "FitPro Academia",
    result: "+40% em matrículas no primeiro mês",
    emoji: "🏋️",
    gradFrom: "#0D1B2E",
    gradTo: "#1a3a6e",
  },
  {
    tag: "Site Institucional",
    title: "Sabor & Arte Confeitaria",
    result: "Pedidos online cresceram 3× após lançamento",
    emoji: "🍰",
    gradFrom: "#1a1028",
    gradTo: "#3d1a5e",
  },
  {
    tag: "Sistema Web",
    title: "LogiTrack Transportes",
    result: "Redução de 60% em chamadas de suporte",
    emoji: "🚚",
    gradFrom: "#082040",
    gradTo: "#0D4E8F",
  },
];

function isValidBody(body: unknown): body is {
  tag: string;
  title: string;
  result: string;
  emoji: string;
  gradFrom: string;
  gradTo: string;
} {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.tag === "string" &&
    typeof b.title === "string" &&
    typeof b.result === "string" &&
    typeof b.emoji === "string" &&
    typeof b.gradFrom === "string" &&
    typeof b.gradTo === "string"
  );
}

export const portfolioRouter = Router();

portfolioRouter.get("/", async (_req, res) => {
  const existing = await prisma.portfolioProject.count();
  if (existing === 0) {
    await prisma.portfolioProject.createMany({
      data: DEFAULT_PROJECTS.map((p, order) => ({ ...p, order })),
    });
  }

  const projects = await prisma.portfolioProject.findMany({
    orderBy: { order: "asc" },
  });
  res.json(projects);
});

portfolioRouter.post("/", requireAuth, async (req, res) => {
  if (!isValidBody(req.body)) {
    res.status(400).json({ error: "Preencha todos os campos do projeto." });
    return;
  }

  const count = await prisma.portfolioProject.count();
  const project = await prisma.portfolioProject.create({
    data: { ...req.body, order: count },
  });
  res.status(201).json(project);
});

portfolioRouter.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
    res.status(400).json({ error: "Informe a lista ordenada de ids." });
    return;
  }

  await prisma.$transaction(
    ids.map((id: number, index: number) =>
      prisma.portfolioProject.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );

  const projects = await prisma.portfolioProject.findMany({
    orderBy: { order: "asc" },
  });
  res.json(projects);
});

portfolioRouter.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidBody(req.body)) {
    res.status(400).json({ error: "Preencha todos os campos do projeto." });
    return;
  }

  const project = await prisma.portfolioProject
    .update({ where: { id }, data: req.body })
    .catch(() => null);

  if (!project) {
    res.status(404).json({ error: "Projeto não encontrado." });
    return;
  }
  res.json(project);
});

portfolioRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.portfolioProject.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
