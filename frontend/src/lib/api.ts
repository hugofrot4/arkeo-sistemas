const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(
  /\/+$/,
  "",
);
const TOKEN_KEY = "arkeo_admin_token";

export interface HeroContent {
  badge: string;
  h1Line1: string;
  h1Accent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface Metric {
  id: number;
  number: string;
  label: string;
  order: number;
}

export interface Service {
  id: number;
  icon: string;
  title: string;
  desc: string;
  meta: string;
  order: number;
}

export interface ProcessStep {
  id: number;
  title: string;
  desc: string;
  order: number;
}

export interface Differential {
  id: number;
  icon: string;
  title: string;
  desc: string;
  order: number;
}

export interface PortfolioProject {
  id: number;
  tag: string;
  title: string;
  result: string;
  image: string;
  order: number;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  order: number;
}

export type MessageStatus = "novo" | "contato" | "convertido" | "descartado";

export interface Message {
  id: number;
  name: string;
  whatsapp: string;
  service: string;
  message: string;
  status: MessageStatus;
  date: string;
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

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erro ${res.status} ao chamar ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getHero() {
  return request<HeroContent>("/api/hero");
}

export function updateHero(data: HeroContent) {
  return request<HeroContent>("/api/hero", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function login(email: string, password: string) {
  return request<{ token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request<AuthUser>("/api/auth/me");
}

/**
 * Fábrica de cliente para recursos de lista com o mesmo contrato REST
 * (listar, criar, editar, excluir, reordenar) — usado por seções do painel
 * como métricas e serviços.
 */
function createListResource<T>(path: string) {
  return {
    list: () => request<T[]>(path),
    create: (data: Record<string, string>) =>
      request<T>(path, { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, string>) =>
      request<T>(`${path}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: number) => request<void>(`${path}/${id}`, { method: "DELETE" }),
    reorder: (ids: number[]) =>
      request<T[]>(`${path}/reorder`, {
        method: "PUT",
        body: JSON.stringify({ ids }),
      }),
  };
}

export const metricsApi = createListResource<Metric>("/api/metrics");
export const servicesApi = createListResource<Service>("/api/services");
export const processApi = createListResource<ProcessStep>("/api/process");
export const differentialsApi = createListResource<Differential>(
  "/api/differentials",
);
export const portfolioApi = createListResource<PortfolioProject>(
  "/api/portfolio",
);
export const faqApi = createListResource<FaqItem>("/api/faq");

export function createMessage(data: {
  name: string;
  whatsapp: string;
  service: string;
  message?: string;
}) {
  return request<Message>("/api/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMessages() {
  return request<Message[]>("/api/messages");
}

export function updateMessageStatus(id: number, status: MessageStatus) {
  return request<Message>(`/api/messages/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function deleteMessage(id: number) {
  return request<void>(`/api/messages/${id}`, { method: "DELETE" });
}

export function getSettings() {
  return request<SiteSettings>("/api/settings");
}

export function updateSettings(data: SiteSettings) {
  return request<SiteSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
