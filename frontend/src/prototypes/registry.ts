import type { ComponentType } from "react";
import Beleza from "./templates/Beleza";
import Clinica from "./templates/Clinica";
import Food from "./templates/Food";
import Juridico from "./templates/Juridico";
import ServicoLocal from "./templates/ServicoLocal";
import type { TemplateId, TemplateProps } from "./types";

export const TEMPLATES: Record<TemplateId, ComponentType<TemplateProps>> = {
  clinica: Clinica,
  "servico-local": ServicoLocal,
  food: Food,
  beleza: Beleza,
  juridico: Juridico,
};
