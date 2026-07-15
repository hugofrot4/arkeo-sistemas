import type { AdminState } from "./types";

export const ICONS = [
  "layout",
  "building-2",
  "settings-2",
  "zap",
  "message-circle",
  "layers",
  "shield-check",
  "headphones",
  "target",
  "rocket",
  "star",
  "code-2",
  "smartphone",
  "monitor",
  "cloud",
  "database",
  "trending-up",
  "users",
  "lock",
  "heart",
  "globe",
  "clock",
  "award",
  "sparkles",
];

let uid = 1000;
export const nextId = () => uid++;

export function createInitialState(): AdminState {
  return {
    hero: {
      badge: "Desenvolvimento acelerado com IA",
      h1Line1: "Seu site. Seu sistema.",
      h1Accent: "Sua vantagem.",
      subtitle:
        "Desenvolvemos sites e sistemas web personalizados para pequenas e médias empresas que querem crescer com presença digital profissional — sem precisar de equipe técnica interna.",
      ctaPrimary: "Quero um orçamento",
      ctaSecondary: "Ver projetos",
    },
    metrics: [
      { id: nextId(), number: "+20", label: "Projetos entregues" },
      { id: nextId(), number: "6", label: "Anos de experiência" },
      { id: nextId(), number: "100%", label: "Remoto e ágil" },
      { id: nextId(), number: "✦", label: "Suporte contínuo" },
    ],
    services: [
      {
        id: nextId(),
        icon: "layout",
        title: "Landing Page",
        desc: "Site de alta conversão para capturar leads e vender produtos ou serviços. Design persuasivo e copy focado em resultado.",
        meta: "Entrega em 7–14 dias",
      },
      {
        id: nextId(),
        icon: "building-2",
        title: "Site Institucional",
        desc: "Presença digital completa com múltiplas páginas, gestão de conteúdo e identidade visual que transmite credibilidade.",
        meta: "Entrega em 14–30 dias",
      },
      {
        id: nextId(),
        icon: "settings-2",
        title: "Sistema Web / App",
        desc: "Aplicações sob medida para automatizar processos, organizar operações e escalar sem contratar mais pessoas.",
        meta: "Prazo definido no escopo",
      },
    ],
    process: [
      {
        id: nextId(),
        title: "Conversa",
        desc: "Entendemos seu negócio, suas dores e o que você quer resolver. Sem formulários longos, sem burocracia.",
      },
      {
        id: nextId(),
        title: "Proposta",
        desc: "Enviamos escopo, prazo e investimento com preço fechado. Zero surpresas financeiras no meio do caminho.",
      },
      {
        id: nextId(),
        title: "Desenvolvimento",
        desc: "Você acompanha o progresso em tempo real e fala diretamente com quem está desenvolvendo.",
      },
      {
        id: nextId(),
        title: "Entrega & Suporte",
        desc: "Lançamos com treinamento incluso e suporte contínuo para você nunca ficar na mão após o lançamento.",
      },
    ],
    differentials: [
      {
        id: nextId(),
        icon: "zap",
        title: "IA no processo — mais velocidade, menos custo",
        desc: "Usamos inteligência artificial para acelerar o desenvolvimento sem abrir mão da qualidade.",
      },
      {
        id: nextId(),
        icon: "message-circle",
        title: "Comunicação direta com quem desenvolve",
        desc: "Sem gerente de projeto como intermediário. Decisões mais rápidas, menos ruído.",
      },
      {
        id: nextId(),
        icon: "layers",
        title: "Stack moderna e escalável",
        desc: "Tecnologias atuais e código limpo que cresce com seu negócio.",
      },
      {
        id: nextId(),
        icon: "shield-check",
        title: "Sem taxas surpresa — preço fechado",
        desc: "O que foi combinado é o que você paga. Proposta clara antes de qualquer linha de código.",
      },
      {
        id: nextId(),
        icon: "headphones",
        title: "Manutenção e suporte inclusos",
        desc: "Você conta com suporte técnico e atualizações para manter tudo funcionando no longo prazo.",
      },
      {
        id: nextId(),
        icon: "target",
        title: "Foco total no seu resultado",
        desc: "Não vendemos tecnologia — resolvemos problemas de negócio.",
      },
    ],
    portfolio: [],
    faq: [
      {
        id: nextId(),
        question: "Quanto tempo leva para ter meu site pronto?",
        answer:
          "Landing pages ficam prontas em 7 a 14 dias. Sites institucionais levam de 14 a 30 dias. Sistemas e apps têm prazo definido na proposta.",
      },
      {
        id: nextId(),
        question: "Vocês fazem manutenção após o lançamento?",
        answer:
          "Sim. Oferecemos suporte técnico pós-entrega e planos de manutenção mensal.",
      },
      {
        id: nextId(),
        question: "Preciso de conhecimento técnico para gerenciar o site?",
        answer:
          "Não. Todos os projetos são entregues com treinamento incluso e edição simples via CMS.",
      },
      {
        id: nextId(),
        question: "Vocês trabalham com contrato?",
        answer:
          "Sempre. Todos os projetos têm contrato com escopo, prazos e valores claramente definidos.",
      },
      {
        id: nextId(),
        question: "Qual é o investimento necessário?",
        answer:
          "Os valores variam conforme o escopo. Após a conversa inicial você recebe uma proposta com preço fechado.",
      },
      {
        id: nextId(),
        question: "Consigo acompanhar o desenvolvimento em tempo real?",
        answer:
          "Sim. Você recebe atualizações regulares e pode falar diretamente com quem está desenvolvendo.",
      },
    ],
    messages: [],
    settings: {
      siteName: "Arkeo Sistemas",
      tagline: "Precisão em cada linha de código.",
      copy: "© 2026 Arkeo Sistemas. Todos os direitos reservados.",
      whatsapp: "+55 11 99999-9999",
      email: "contato@arkeosistemas.com.br",
      waMessage:
        "Olá, gostaria de saber mais sobre os serviços da Arkeo Sistemas.",
      instagram: "",
      linkedin: "",
      github: "",
    },
    xpEvents: [],
    achievementsUnlocked: [],
  };
}
