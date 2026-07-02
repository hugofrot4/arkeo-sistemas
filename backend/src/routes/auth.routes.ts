import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Informe e-mail e senha." });
    return;
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const passwordOk = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordOk) {
    res.status(401).json({ error: "E-mail ou senha incorretos." });
    return;
  }

  const token = signAuthToken({ sub: user.id, email: user.email });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.adminUser.findUnique({
    where: { id: req.user!.sub },
  });
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});
