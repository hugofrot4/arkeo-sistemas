import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const HERO_ID = 1;

const DEFAULT_HERO = {
  badge: "Desenvolvimento acelerado com IA",
  h1Line1: "Seu site. Seu sistema.",
  h1Accent: "Sua vantagem.",
  subtitle:
    "Desenvolvemos sites e sistemas web personalizados para pequenas e médias empresas que querem crescer com presença digital profissional — sem precisar de equipe técnica interna.",
  ctaPrimary: "Quero um orçamento",
  ctaSecondary: "Ver projetos",
};

export const heroRouter = Router();

heroRouter.get("/", async (_req, res) => {
  const hero = await prisma.hero.upsert({
    where: { id: HERO_ID },
    update: {},
    create: { id: HERO_ID, ...DEFAULT_HERO },
  });
  res.json(hero);
});

heroRouter.put("/", requireAuth, async (req, res) => {
  const { badge, h1Line1, h1Accent, subtitle, ctaPrimary, ctaSecondary } =
    req.body ?? {};

  const fields = { badge, h1Line1, h1Accent, subtitle, ctaPrimary, ctaSecondary };
  const missing = Object.entries(fields).filter(
    ([, value]) => typeof value !== "string",
  );
  if (missing.length > 0) {
    res.status(400).json({
      error: `Campos inválidos ou ausentes: ${missing.map(([key]) => key).join(", ")}`,
    });
    return;
  }

  const hero = await prisma.hero.upsert({
    where: { id: HERO_ID },
    update: fields,
    create: { id: HERO_ID, ...fields },
  });
  res.json(hero);
});
