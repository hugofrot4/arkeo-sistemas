import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
  siteName: "Arkeo Sistemas",
  tagline: "Precisão em cada linha de código.",
  copy: "© 2026 Arkeo Sistemas. Todos os direitos reservados.",
  whatsapp: "+55 11 99999-9999",
  email: "contato@arkeosistemas.com.br",
  waMessage: "Olá, gostaria de saber mais sobre os serviços da Arkeo Sistemas.",
  instagram: "",
  linkedin: "",
  github: "",
};

const FIELDS = Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[];

function isValidBody(body: unknown): body is typeof DEFAULT_SETTINGS {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return FIELDS.every((field) => typeof b[field] === "string");
}

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res) => {
  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS },
  });
  res.json(settings);
});

settingsRouter.put("/", requireAuth, async (req, res) => {
  if (!isValidBody(req.body)) {
    res.status(400).json({
      error: `Preencha todos os campos: ${FIELDS.join(", ")}.`,
    });
    return;
  }

  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: req.body,
    create: { id: SETTINGS_ID, ...req.body },
  });
  res.json(settings);
});
