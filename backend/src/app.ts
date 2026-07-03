import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.routes.js";
import { differentialsRouter } from "./routes/differentials.routes.js";
import { faqRouter } from "./routes/faq.routes.js";
import { heroRouter } from "./routes/hero.routes.js";
import { messagesRouter } from "./routes/messages.routes.js";
import { metricsRouter } from "./routes/metrics.routes.js";
import { portfolioRouter } from "./routes/portfolio.routes.js";
import { processRouter } from "./routes/process.routes.js";
import { servicesRouter } from "./routes/services.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";

export function createApp() {
  const app = express();

  // Necessário no Render (e em qualquer host atrás de proxy/load balancer)
  // para que req.ip reflita o IP real do cliente, não o do proxy.
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    }),
  );
  app.use(express.json({ limit: "5mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas tentativas de login. Tente novamente mais tarde." },
  });
  app.use("/api/auth/login", loginLimiter);

  app.use("/api/auth", authRouter);
  app.use("/api/hero", heroRouter);
  app.use("/api/metrics", metricsRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/process", processRouter);
  app.use("/api/differentials", differentialsRouter);
  app.use("/api/portfolio", portfolioRouter);
  app.use("/api/faq", faqRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/settings", settingsRouter);

  return app;
}
