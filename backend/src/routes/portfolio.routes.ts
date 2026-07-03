import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const MAX_IMAGE_LENGTH = 3_000_000; // ~2MB de arquivo original em base64

function placeholderImage(from: string, to: string, emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="168" font-size="90" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const DEFAULT_PROJECTS = [
  {
    tag: "Landing Page",
    title: "FitPro Academia",
    result: "+40% em matrículas no primeiro mês",
    image: placeholderImage("#0D1B2E", "#1a3a6e", "🏋️"),
  },
  {
    tag: "Site Institucional",
    title: "Sabor & Arte Confeitaria",
    result: "Pedidos online cresceram 3× após lançamento",
    image: placeholderImage("#1a1028", "#3d1a5e", "🍰"),
  },
  {
    tag: "Sistema Web",
    title: "LogiTrack Transportes",
    result: "Redução de 60% em chamadas de suporte",
    image: placeholderImage("#082040", "#0D4E8F", "🚚"),
  },
];

function isValidBody(body: unknown): body is {
  tag: string;
  title: string;
  result: string;
  image: string;
} {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.tag === "string" &&
    typeof b.title === "string" &&
    typeof b.result === "string" &&
    typeof b.image === "string" &&
    b.image.length <= MAX_IMAGE_LENGTH
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
    res.status(400).json({
      error: "Preencha todos os campos do projeto (imagem até 2MB).",
    });
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
    res.status(400).json({
      error: "Preencha todos os campos do projeto (imagem até 2MB).",
    });
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
