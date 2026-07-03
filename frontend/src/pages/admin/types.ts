import type { Message, SiteSettings } from "../../lib/api";

export type {
  Message as MessageItem,
  MessageStatus,
  SiteSettings,
} from "../../lib/api";

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

export interface AdminState {
  hero: HeroContent;
  metrics: EntityItem[];
  services: EntityItem[];
  process: EntityItem[];
  differentials: EntityItem[];
  portfolio: EntityItem[];
  faq: EntityItem[];
  messages: Message[];
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
