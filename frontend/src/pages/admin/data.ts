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

export const GRADIENT_PRESETS = [
  { from: "#0D1B2E", to: "#1a3a6e" },
  { from: "#1a1028", to: "#3d1a5e" },
  { from: "#082040", to: "#0D4E8F" },
  { from: "#1a2e0d", to: "#2f5e1a" },
  { from: "#3a0d1b", to: "#6e1a3a" },
  { from: "#0d2e2b", to: "#1a6e64" },
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
    portfolio: [
      {
        id: nextId(),
        tag: "Landing Page",
        title: "FitPro Academia",
        result: "+40% em matrículas no primeiro mês",
        emoji: "🏋️",
        gradFrom: "#0D1B2E",
        gradTo: "#1a3a6e",
      },
      {
        id: nextId(),
        tag: "Site Institucional",
        title: "Sabor & Arte Confeitaria",
        result: "Pedidos online cresceram 3× após lançamento",
        emoji: "🍰",
        gradFrom: "#1a1028",
        gradTo: "#3d1a5e",
      },
      {
        id: nextId(),
        tag: "Sistema Web",
        title: "LogiTrack Transportes",
        result: "Redução de 60% em chamadas de suporte",
        emoji: "🚚",
        gradFrom: "#082040",
        gradTo: "#0D4E8F",
      },
    ],
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
    messages: [
      {
        id: nextId(),
        name: "Carla Menezes",
        whatsapp: "(11) 98421-7732",
        service: "Landing Page",
        message:
          "Preciso de uma landing page para lançar meu curso online até o fim do mês.",
        date: "2026-07-01T14:20:00",
        status: "novo",
      },
      {
        id: nextId(),
        name: "Rodrigo Alves",
        whatsapp: "(21) 99112-4455",
        service: "Sistema Web / App",
        message:
          "Tenho uma distribuidora e quero automatizar o controle de pedidos e estoque.",
        date: "2026-07-01T09:05:00",
        status: "novo",
      },
      {
        id: nextId(),
        name: "Fernanda Lima",
        whatsapp: "(31) 98877-1122",
        service: "Site Institucional",
        message:
          "Gostaria de um orçamento para o site da minha clínica odontológica.",
        date: "2026-06-30T18:42:00",
        status: "contato",
      },
      {
        id: nextId(),
        name: "Marcelo Souza",
        whatsapp: "(41) 99654-3321",
        service: "Landing Page",
        message:
          "Quero validar uma ideia de produto digital com uma página de vendas simples.",
        date: "2026-06-29T11:15:00",
        status: "convertido",
      },
      {
        id: nextId(),
        name: "Juliana Prado",
        whatsapp: "(51) 98123-9988",
        service: "Outro / Não sei ainda",
        message:
          "Ainda não tenho certeza do que preciso, gostaria de conversar primeiro.",
        date: "2026-06-28T16:30:00",
        status: "contato",
      },
      {
        id: nextId(),
        name: "Bruno Castro",
        whatsapp: "(19) 99887-6655",
        service: "Sistema Web / App",
        message:
          "Preciso de um sistema de agendamento para minha barbearia com 3 unidades.",
        date: "2026-06-27T08:50:00",
        status: "novo",
      },
      {
        id: nextId(),
        name: "Patrícia Gomes",
        whatsapp: "(85) 98765-4321",
        service: "Site Institucional",
        message:
          "Nosso site atual está desatualizado, queremos um redesign completo.",
        date: "2026-06-25T13:10:00",
        status: "descartado",
      },
      {
        id: nextId(),
        name: "Diego Ferreira",
        whatsapp: "(47) 99321-0099",
        service: "Landing Page",
        message: "Quero uma página para captar leads para minha imobiliária.",
        date: "2026-06-24T10:00:00",
        status: "convertido",
      },
    ],
    leadsLast7Days: [
      { day: "Qua", value: 2 },
      { day: "Qui", value: 4 },
      { day: "Sex", value: 3 },
      { day: "Sáb", value: 1 },
      { day: "Dom", value: 0 },
      { day: "Seg", value: 5 },
      { day: "Ter", value: 3 },
    ],
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
  };
}
