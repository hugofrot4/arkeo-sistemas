import { supabase } from "./supabase";

export interface HeroContent {
  badge: string;
  h1Line1: string;
  h1Accent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface AuthUser {
  id: string;
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

export type XpAction =
  | "lead_first_response"
  | "lead_converted"
  | "lead_descartado"
  | "content_created"
  | "content_updated"
  | "hero_updated"
  | "settings_updated";

export interface XpEvent {
  id: number;
  action: XpAction;
  xp: number;
  refTable: string | null;
  refId: number | null;
  createdAt: string;
}

export interface AchievementUnlocked {
  key: string;
  unlockedAt: string;
}

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

/** Sessão fica persistida pelo supabase-js (localStorage) — chame para encerrá-la. */
export async function clearToken() {
  await supabase.auth.signOut();
}

function unwrap<T>({ data, error }: { data: unknown; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getHero() {
  const res = await supabase
    .from("hero")
    .select(
      "badge,h1Line1:h1_line1,h1Accent:h1_accent,subtitle,ctaPrimary:cta_primary,ctaSecondary:cta_secondary",
    )
    .eq("id", 1)
    .single();
  return unwrap<HeroContent>(res);
}

export async function updateHero(data: HeroContent) {
  const res = await supabase
    .from("hero")
    .update({
      badge: data.badge,
      h1_line1: data.h1Line1,
      h1_accent: data.h1Accent,
      subtitle: data.subtitle,
      cta_primary: data.ctaPrimary,
      cta_secondary: data.ctaSecondary,
    })
    .eq("id", 1)
    .select(
      "badge,h1Line1:h1_line1,h1Accent:h1_accent,subtitle,ctaPrimary:cta_primary,ctaSecondary:cta_secondary",
    )
    .single();
  return unwrap<HeroContent>(res);
}

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("E-mail ou senha incorretos.");
}

export async function getMe() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Não autenticado.");
  const name =
    (data.user.user_metadata?.name as string | undefined) ??
    data.user.email ??
    "Admin";
  return { id: data.user.id, name, email: data.user.email ?? "" } satisfies AuthUser;
}

/** Mapa campo (camelCase, usado no frontend) → coluna (snake_case, usada no Supabase). */
type ColumnMap = Record<string, string>;

function selectString(columns: ColumnMap) {
  return [
    "id",
    ...Object.entries(columns).map(([feKey, dbCol]) =>
      feKey === dbCol ? dbCol : `${feKey}:${dbCol}`,
    ),
  ].join(",");
}

function toDbPayload(data: Record<string, string>, columns: ColumnMap) {
  const out: Record<string, string> = {};
  for (const [feKey, dbCol] of Object.entries(columns)) {
    if (feKey in data) out[dbCol] = data[feKey];
  }
  return out;
}

/**
 * Fábrica de cliente para recursos de lista com o mesmo contrato (listar,
 * criar, editar, excluir, reordenar) — mapeia nomes de campo do frontend
 * (camelCase) para as colunas do Supabase (snake_case) via `columns`.
 */
function createListResource<T extends { id: number }>(
  table: string,
  columns: ColumnMap,
  reorderFn: string,
) {
  const select = selectString(columns);
  return {
    list: async () => {
      const res = await supabase.from(table).select(select).order("sort_order", { ascending: true });
      return unwrap<T[]>(res);
    },
    create: async (data: Record<string, string>) => {
      const res = await supabase
        .from(table)
        .insert(toDbPayload(data, columns))
        .select(select)
        .single();
      return unwrap<T>(res);
    },
    update: async (id: number, data: Record<string, string>) => {
      const res = await supabase
        .from(table)
        .update(toDbPayload(data, columns))
        .eq("id", id)
        .select(select)
        .single();
      return unwrap<T>(res);
    },
    remove: async (id: number) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    reorder: async (ids: number[]) => {
      const res = await supabase.rpc(reorderFn, { ids }).select(select);
      return unwrap<T[]>(res);
    },
  };
}

export const metricsApi = createListResource<Metric>(
  "metrics",
  { number: "number", label: "label", order: "sort_order" },
  "reorder_metrics",
);
export const servicesApi = createListResource<Service>(
  "services",
  { icon: "icon", title: "title", desc: "description", meta: "meta", order: "sort_order" },
  "reorder_services",
);
export const processApi = createListResource<ProcessStep>(
  "process_steps",
  { title: "title", desc: "description", order: "sort_order" },
  "reorder_process_steps",
);
export const differentialsApi = createListResource<Differential>(
  "differentials",
  { icon: "icon", title: "title", desc: "description", order: "sort_order" },
  "reorder_differentials",
);
export const portfolioApi = createListResource<PortfolioProject>(
  "portfolio_projects",
  { tag: "tag", title: "title", result: "result", image: "image", order: "sort_order" },
  "reorder_portfolio_projects",
);
export const faqApi = createListResource<FaqItem>(
  "faq",
  { question: "question", answer: "answer", order: "sort_order" },
  "reorder_faq",
);

export async function createMessage(data: {
  name: string;
  whatsapp: string;
  service: string;
  message?: string;
}) {
  // Sem .select() de propósito: o envio é público (RLS só dá SELECT em
  // `messages` pra usuários autenticados), e quem chama não usa o retorno.
  const { error } = await supabase.from("messages").insert({
    name: data.name,
    whatsapp: data.whatsapp,
    service: data.service,
    message: data.message ?? "",
  });
  if (error) throw new Error(error.message);
}

/** Cria um lead diretamente no admin (contato recebido por outro canal — telefone, indicação, presencial). */
export async function createMessageManual(data: {
  name: string;
  whatsapp: string;
  service: string;
  message?: string;
  status: MessageStatus;
}) {
  const res = await supabase
    .from("messages")
    .insert({
      name: data.name,
      whatsapp: data.whatsapp,
      service: data.service,
      message: data.message ?? "",
      status: data.status,
    })
    .select("id,name,whatsapp,service,message,status,date")
    .single();
  return unwrap<Message>(res);
}

export async function getMessages() {
  const res = await supabase
    .from("messages")
    .select("id,name,whatsapp,service,message,status,date")
    .order("date", { ascending: false });
  return unwrap<Message[]>(res);
}

export async function updateMessageStatus(id: number, status: MessageStatus) {
  const res = await supabase
    .from("messages")
    .update({ status })
    .eq("id", id)
    .select("id,name,whatsapp,service,message,status,date")
    .single();
  return unwrap<Message>(res);
}

export async function deleteMessage(id: number) {
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

const SETTINGS_SELECT =
  "siteName:site_name,tagline,copy,whatsapp,email,waMessage:wa_message,instagram,linkedin,github";

export async function getSettings() {
  const res = await supabase.from("settings").select(SETTINGS_SELECT).eq("id", 1).single();
  return unwrap<SiteSettings>(res);
}

export async function updateSettings(data: SiteSettings) {
  const res = await supabase
    .from("settings")
    .update({
      site_name: data.siteName,
      tagline: data.tagline,
      copy: data.copy,
      whatsapp: data.whatsapp,
      email: data.email,
      wa_message: data.waMessage,
      instagram: data.instagram,
      linkedin: data.linkedin,
      github: data.github,
    })
    .eq("id", 1)
    .select(SETTINGS_SELECT)
    .single();
  return unwrap<SiteSettings>(res);
}

const XP_EVENT_SELECT =
  "id,action,xp,refTable:ref_table,refId:ref_id,createdAt:created_at";

export async function getXpEvents() {
  const res = await supabase
    .from("xp_events")
    .select(XP_EVENT_SELECT)
    .order("created_at", { ascending: true });
  return unwrap<XpEvent[]>(res);
}

/** Retorna `null` em vez de lançar quando o evento já foi logado (dedupe por lead). */
export async function logXpEvent(
  action: XpAction,
  xp: number,
  ref?: { table: string; id: number },
) {
  const { data, error } = await supabase
    .from("xp_events")
    .insert({
      action,
      xp,
      ref_table: ref?.table ?? null,
      ref_id: ref?.id ?? null,
    })
    .select(XP_EVENT_SELECT)
    .single();
  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }
  return data as unknown as XpEvent;
}

export async function getAchievementsUnlocked() {
  const res = await supabase
    .from("achievements_unlocked")
    .select("key,unlockedAt:unlocked_at");
  return unwrap<AchievementUnlocked[]>(res);
}

/** Retorna `null` em vez de lançar quando a conquista já estava desbloqueada. */
export async function unlockAchievement(key: string) {
  const { data, error } = await supabase
    .from("achievements_unlocked")
    .insert({ key })
    .select("key,unlockedAt:unlocked_at")
    .single();
  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }
  return data as unknown as AchievementUnlocked;
}
