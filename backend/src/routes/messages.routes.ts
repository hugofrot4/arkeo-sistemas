import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const ALLOWED_STATUSES = ["novo", "contato", "convertido", "descartado"];

export const messagesRouter = Router();

// Recebido pelo formulário público de contato — sem autenticação.
messagesRouter.post("/", async (req, res) => {
  const { name, whatsapp, service, message } = req.body ?? {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof whatsapp !== "string" ||
    !whatsapp.trim() ||
    typeof service !== "string" ||
    !service.trim()
  ) {
    res.status(400).json({ error: "Preencha nome, WhatsApp e tipo de projeto." });
    return;
  }

  const created = await prisma.message.create({
    data: {
      name,
      whatsapp,
      service,
      message: typeof message === "string" ? message : "",
    },
  });
  res.status(201).json(created);
});

messagesRouter.get("/", requireAuth, async (_req, res) => {
  const messages = await prisma.message.findMany({
    orderBy: { date: "desc" },
  });
  res.json(messages);
});

messagesRouter.put("/:id/status", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({ error: "Status inválido." });
    return;
  }

  const message = await prisma.message
    .update({ where: { id }, data: { status } })
    .catch(() => null);

  if (!message) {
    res.status(404).json({ error: "Mensagem não encontrada." });
    return;
  }
  res.json(message);
});

messagesRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.message.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});
