import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { getIconComponent } from "./icons";
import type { EntityItem, EntityKey } from "./types";
import { str } from "./utils";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "icon" | "gradient";
  placeholder?: string;
  options?: string[];
}

export interface EntityConfigItem {
  label: string;
  panelTag: string;
  panelTitle: string;
  panelDescription: string;
  emptyIcon: string;
  hasIconPicker?: boolean;
  hasGradientPicker?: boolean;
  maxItems?: number;
  fields: FieldConfig[];
  renderIcon: (item: EntityItem, idx: number) => ReactNode;
  title: (item: EntityItem) => string;
  desc?: (item: EntityItem) => string;
  meta?: (item: EntityItem) => string;
}

export const entityConfig: Record<EntityKey, EntityConfigItem> = {
  metrics: {
    label: "Métrica",
    panelTag: "Barra de autoridade",
    panelTitle: "Métricas de credibilidade",
    panelDescription:
      "Faixa compacta exibida logo abaixo do hero, com números de impacto (ex: projetos entregues, anos de experiência).",
    emptyIcon: "bar-chart-3",
    maxItems: 4,
    fields: [
      {
        key: "number",
        label: "Número / símbolo",
        type: "text",
        placeholder: "ex: +20, 6, 100%",
      },
      { key: "label", label: "Legenda", type: "text" },
    ],
    renderIcon: (item) => (
      <span className="font-family-display font-bold">{str(item.number)}</span>
    ),
    title: (item) => str(item.label),
  },
  services: {
    label: "Serviço",
    panelTag: "O que entregamos",
    panelTitle: "Serviços",
    panelDescription:
      'Cards de serviço exibidos na seção "O que entregamos" da landing page.',
    emptyIcon: "layers",
    hasIconPicker: true,
    fields: [
      { key: "icon", label: "Ícone", type: "icon" },
      { key: "title", label: "Nome do serviço", type: "text" },
      { key: "desc", label: "Descrição", type: "textarea" },
      {
        key: "meta",
        label: "Prazo / detalhe",
        type: "text",
        placeholder: "ex: Entrega em 7–14 dias",
      },
    ],
    renderIcon: (item) => {
      const Icon = getIconComponent(str(item.icon));
      return <Icon size={18} aria-hidden="true" />;
    },
    title: (item) => str(item.title),
    desc: (item) => str(item.desc),
    meta: (item) => str(item.meta),
  },
  process: {
    label: "Etapa",
    panelTag: "Como funciona",
    panelTitle: "Etapas do processo",
    panelDescription:
      'As 4 etapas exibidas na seção "Como funciona". Use as setas para reordenar.',
    emptyIcon: "list-checks",
    maxItems: 6,
    fields: [
      { key: "title", label: "Título da etapa", type: "text" },
      { key: "desc", label: "Descrição", type: "textarea" },
    ],
    renderIcon: (_item, idx) => (
      <span className="font-family-display font-bold">
        {String(idx + 1).padStart(2, "0")}
      </span>
    ),
    title: (item) => str(item.title),
    desc: (item) => str(item.desc),
  },
  differentials: {
    label: "Diferencial",
    panelTag: "Por que a Arkeo?",
    panelTitle: "Diferenciais",
    panelDescription: 'Grade de diferenciais reais exibida na seção "Por que a Arkeo?".',
    emptyIcon: "award",
    hasIconPicker: true,
    fields: [
      { key: "icon", label: "Ícone", type: "icon" },
      { key: "title", label: "Título", type: "text" },
      { key: "desc", label: "Descrição", type: "textarea" },
    ],
    renderIcon: (item) => {
      const Icon = getIconComponent(str(item.icon));
      return <Icon size={18} aria-hidden="true" />;
    },
    title: (item) => str(item.title),
    desc: (item) => str(item.desc),
  },
  portfolio: {
    label: "Projeto",
    panelTag: "Projetos",
    panelTitle: "Portfólio",
    panelDescription: 'Cards de projetos exibidos na seção "Projetos" da landing page.',
    emptyIcon: "folder-kanban",
    hasGradientPicker: true,
    fields: [
      {
        key: "tag",
        label: "Tipo de projeto",
        type: "select",
        options: ["Landing Page", "Site Institucional", "Sistema Web"],
      },
      { key: "title", label: "Nome do projeto", type: "text" },
      {
        key: "result",
        label: "Resultado mensurável",
        type: "text",
        placeholder: "ex: +40% em matrículas no primeiro mês",
      },
      {
        key: "emoji",
        label: "Emoji ilustrativo",
        type: "text",
        placeholder: "🏋️",
      },
      { key: "grad", label: "Cor do card", type: "gradient" },
    ],
    renderIcon: (item) => <span>{str(item.emoji)}</span>,
    title: (item) => str(item.title),
    desc: (item) => `${str(item.tag)} — ${str(item.result)}`,
  },
  faq: {
    label: "Pergunta",
    panelTag: "Dúvidas frequentes",
    panelTitle: "Perguntas do FAQ",
    panelDescription: "Perguntas e respostas exibidas no accordion de FAQ.",
    emptyIcon: "help-circle",
    fields: [
      { key: "question", label: "Pergunta", type: "text" },
      { key: "answer", label: "Resposta", type: "textarea" },
    ],
    renderIcon: () => <HelpCircle size={18} aria-hidden="true" />,
    title: (item) => str(item.question),
    desc: (item) => str(item.answer),
  },
};
