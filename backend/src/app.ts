import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { heroRouter } from "./routes/hero.routes.js";
import { metricsRouter } from "./routes/metrics.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/hero", heroRouter);
  app.use("/api/metrics", metricsRouter);

  return app;
}
