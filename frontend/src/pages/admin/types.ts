export type EntityKey =
  | "metrics"
  | "services"
  | "process"
  | "differentials"
  | "portfolio"
  | "faq";

export interface HeroContent {
  badge: string;
  h1Line1: string;
  h1Accent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface EntityItem {
  id: number;
  [key: string]: string | number;
}

export type MessageStatus = "novo" | "contato" | "convertido" | "descartado";

export interface MessageItem {
  id: number;
  name: string;
  whatsapp: string;
  service: string;
  message: string;
  date: string;
  status: MessageStatus;
}

export interface LeadDay {
  day: string;
  value: number;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  copy: string;
  whatsapp: string;
  email: string;
  waMessage: string;
  instagram: string;
  linkedin: string;
  github: string;
}

export interface AdminState {
  hero: HeroContent;
  metrics: EntityItem[];
  services: EntityItem[];
  process: EntityItem[];
  differentials: EntityItem[];
  portfolio: EntityItem[];
  faq: EntityItem[];
  messages: MessageItem[];
  leadsLast7Days: LeadDay[];
  settings: SiteSettings;
}

export type ViewKey =
  | "dashboard"
  | "hero"
  | "metrics"
  | "services"
  | "process"
  | "differentials"
  | "portfolio"
  | "faq"
  | "messages"
  | "settings";
