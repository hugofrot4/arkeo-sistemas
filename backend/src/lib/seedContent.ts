import { DEFAULT_DIFFERENTIALS } from "../routes/differentials.routes.js";
import { DEFAULT_FAQS } from "../routes/faq.routes.js";
import { DEFAULT_STEPS } from "../routes/process.routes.js";
import { DEFAULT_METRICS } from "../routes/metrics.routes.js";
import { DEFAULT_PROJECTS } from "../routes/portfolio.routes.js";
import { DEFAULT_SERVICES } from "../routes/services.routes.js";
import { prisma } from "./prisma.js";

/**
 * Semeia os valores padrão de cada seção de conteúdo em lista, uma única vez,
 * antes do servidor começar a aceitar requisições. Isso evita a race condition
 * de duas requisições concorrentes (comum logo após o cold start do Render)
 * verem a tabela vazia ao mesmo tempo e duplicarem os itens padrão.
 */
export async function seedContentDefaults() {
  const [
    metricsCount,
    servicesCount,
    stepsCount,
    differentialsCount,
    projectsCount,
    faqsCount,
  ] = await Promise.all([
    prisma.metric.count(),
    prisma.service.count(),
    prisma.processStep.count(),
    prisma.differential.count(),
    prisma.portfolioProject.count(),
    prisma.faq.count(),
  ]);

  if (metricsCount === 0) {
    await prisma.metric.createMany({
      data: DEFAULT_METRICS.map((m, order) => ({ ...m, order })),
    });
  }
  if (servicesCount === 0) {
    await prisma.service.createMany({
      data: DEFAULT_SERVICES.map((s, order) => ({ ...s, order })),
    });
  }
  if (stepsCount === 0) {
    await prisma.processStep.createMany({
      data: DEFAULT_STEPS.map((s, order) => ({ ...s, order })),
    });
  }
  if (differentialsCount === 0) {
    await prisma.differential.createMany({
      data: DEFAULT_DIFFERENTIALS.map((d, order) => ({ ...d, order })),
    });
  }
  if (projectsCount === 0) {
    await prisma.portfolioProject.createMany({
      data: DEFAULT_PROJECTS.map((p, order) => ({ ...p, order })),
    });
  }
  if (faqsCount === 0) {
    await prisma.faq.createMany({
      data: DEFAULT_FAQS.map((f, order) => ({ ...f, order })),
    });
  }
}
