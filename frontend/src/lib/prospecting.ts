/**
 * Camada de dados da prospecção v2.
 *
 * Fica fora de `api.ts` de propósito: aquele arquivo é o CMS do site
 * institucional e já concentra tudo. `createListResource` também não serve
 * aqui — ele pressupõe `sort_order`, que nenhuma tabela de prospecção tem.
 */

import { buildRoutingOpener } from "./outreachOpener";
import { supabase } from "./supabase";

export type LeadSegment =
  | "nao_auditado"
  | "sem_presenca"
  | "so_rede_social"
  | "site_quebrado"
  | "site_obsoleto"
  | "site_ok";

export type LeadStage =
  | "novo"
  | "qualificado"
  | "prototipo_pronto"
  | "contatado"
  | "visualizou"
  | "em_conversa"
  | "proposta"
  | "ganho"
  | "perdido";

export type LostReason =
  | "sem_interesse"
  | "tem_agencia"
  | "sem_verba"
  | "sem_resposta"
  | "numero_errado"
  | "outro";

export interface Finding {
  code: string;
  severity: "alta" | "media" | "baixa";
  evidence: string;
}

export interface Lead {
  id: number;
  placeId: string;
  name: string;
  niche: string;
  phone: string | null;
  phoneE164: string | null;
  whatsappValid: boolean;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  website: string | null;
  socialUrl: string | null;
  segment: LeadSegment;
  score: number;
  stage: LeadStage;
  lostReason: LostReason | null;
  rating: number | null;
  userRatingCount: number | null;
  verifiedByHuman: boolean;
  preferredChannel: "whatsapp" | "email";
  notes: string;
  auditedAt: string | null;
  contactedAt: string | null;
  createdAt: string;
}

const LEAD_SELECT = [
  "id",
  "placeId:place_id",
  "name",
  "niche",
  "phone",
  "phoneE164:phone_e164",
  "whatsappValid:whatsapp_valid",
  "email",
  "address",
  "neighborhood",
  "website",
  "socialUrl:social_url",
  "segment",
  "score",
  "stage",
  "lostReason:lost_reason",
  "rating",
  "userRatingCount:user_rating_count",
  "verifiedByHuman:verified_by_human",
  "preferredChannel:preferred_channel",
  "notes",
  "auditedAt:audited_at",
  "contactedAt:contacted_at",
  "createdAt:created_at",
].join(",");

function unwrap<T>({ data, error }: { data: unknown; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ── leads ────────────────────────────────────────────────────────────────

export interface LeadFilter {
  stages?: LeadStage[];
  segments?: LeadSegment[];
  niche?: string;
  minScore?: number;
  search?: string;
  limit?: number;
}

/**
 * Sempre paginado e sempre filtrado no servidor. A v1 puxava a tabela inteira
 * a cada carga do admin e filtrava no cliente, o que só funciona enquanto a
 * base é pequena — e o objetivo aqui é justamente que ela deixe de ser.
 */
export async function listLeads(filter: LeadFilter = {}) {
  let query = supabase
    .from("leads")
    .select(LEAD_SELECT)
    .order("score", { ascending: false })
    .order("id", { ascending: true })
    .limit(filter.limit ?? 100);

  if (filter.stages?.length) query = query.in("stage", filter.stages);
  if (filter.segments?.length) query = query.in("segment", filter.segments);
  if (filter.niche) query = query.eq("niche", filter.niche);
  if (filter.minScore !== undefined) query = query.gte("score", filter.minScore);
  if (filter.search) query = query.ilike("name", `%${filter.search}%`);

  return unwrap<Lead[]>(await query);
}

/**
 * Troca o canal dos toques que ainda não saíram.
 *
 * Toque já enviado guarda por onde foi de fato — reescrevê-lo apagaria o
 * histórico do que aconteceu.
 */
export async function setLeadChannel(leadId: number, channel: "whatsapp" | "email") {
  const { error } = await supabase
    .from("outreach_touches")
    .update({ channel })
    .eq("lead_id", leadId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  // Trocar de canal é trocar de destinatário, e o contato novo veio para ser
  // usado agora. Ver `anteciparProximoToque`.
  await anteciparProximoToque(leadId);
}

/**
 * Traz o próximo toque pendente para hoje, se ele estava marcado para depois.
 *
 * O intervalo entre toques existe para não importunar **uma pessoa**: mandar
 * duas mensagens seguidas para o mesmo número cansa, e é o que faz o lead
 * bloquear. Mas os dois canais são duas pessoas diferentes — a recepção
 * atende o WhatsApp, quem decide lê o e-mail —, e nesse caso a espera não
 * poupa ninguém: só atrasa a chegada em quem decide, depois de a pergunta de
 * roteamento já ter sido respondida.
 *
 * Devolve a data em que o toque ficou, ou null se não havia o que antecipar.
 */
async function anteciparProximoToque(leadId: number): Promise<string | null> {
  const hoje = new Date().toISOString().slice(0, 10);
  const res = await supabase
    .from("outreach_touches")
    .select("id, scheduledFor:scheduled_for")
    .eq("lead_id", leadId)
    .eq("status", "pending")
    .gt("scheduled_for", hoje)
    .order("step", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  const alvo = res.data as { id: number; scheduledFor: string } | null;
  if (!alvo) return null;

  const { error } = await supabase
    .from("outreach_touches")
    .update({ scheduled_for: hoje })
    .eq("id", alvo.id);
  if (error) throw new Error(error.message);
  return hoje;
}

export async function updateLead(id: number, patch: Partial<Lead>) {
  const columns: Record<keyof Lead & string, string> = {
    id: "id",
    placeId: "place_id",
    name: "name",
    niche: "niche",
    phone: "phone",
    phoneE164: "phone_e164",
    whatsappValid: "whatsapp_valid",
    email: "email",
    address: "address",
    neighborhood: "neighborhood",
    website: "website",
    socialUrl: "social_url",
    segment: "segment",
    score: "score",
    stage: "stage",
    lostReason: "lost_reason",
    rating: "rating",
    userRatingCount: "user_rating_count",
    verifiedByHuman: "verified_by_human",
    preferredChannel: "preferred_channel",
    notes: "notes",
    auditedAt: "audited_at",
    contactedAt: "contacted_at",
    createdAt: "created_at",
  };
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    const column = columns[key as keyof Lead];
    if (column && column !== "id") payload[column] = value;
  }
  const res = await supabase.from("leads").update(payload).eq("id", id).select(LEAD_SELECT).single();
  return unwrap<Lead>(res);
}

export async function getLeadAudit(leadId: number) {
  const res = await supabase
    .from("lead_audits")
    .select(
      "findings, platform, httpStatus:http_status, finalUrl:final_url, jsRendered:js_rendered, pageText:page_text, auditedAt:audited_at",
    )
    .eq("lead_id", leadId)
    .maybeSingle();
  return unwrap<{
    findings: Finding[];
    platform: string | null;
    httpStatus: number | null;
    finalUrl: string | null;
    jsRendered: boolean | null;
    pageText: string | null;
    auditedAt: string;
  } | null>(res);
}

// ── protótipos ───────────────────────────────────────────────────────────

export interface PrototypeRecord {
  id: number;
  leadId: number;
  slug: string;
  html: string | null;
  pageTitle: string | null;
  published: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const PROTOTYPE_SELECT =
  "id,leadId:lead_id,slug,html,pageTitle:page_title,published,expiresAt:expires_at,createdAt:created_at";

/** Listagem do admin: sem o HTML, que pesa centenas de KB por linha. */
const PROTOTYPE_META_SELECT =
  "id,leadId:lead_id,slug,pageTitle:page_title,published,expiresAt:expires_at,createdAt:created_at";

/** Leitura pública — é o link que o prospect abre, sem login. */
export async function getPrototypeBySlug(slug: string) {
  const res = await supabase
    .from("prototypes")
    .select(PROTOTYPE_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  return unwrap<PrototypeRecord | null>(res);
}

/** Insert anônimo. É o sinal de compra mais forte do sistema. */
export async function recordPrototypeView(prototypeId: number) {
  const { error } = await supabase.from("prototype_views").insert({
    prototype_id: prototypeId,
    user_agent: navigator.userAgent.slice(0, 400),
    referrer: document.referrer ? document.referrer.slice(0, 400) : null,
  });
  if (error) throw new Error(error.message);
}

export async function getPrototypeForLead(leadId: number) {
  const res = await supabase
    .from("prototypes")
    .select(PROTOTYPE_META_SELECT)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return unwrap<PrototypeRecord | null>(res);
}

export async function setPrototypePublished(id: number, published: boolean) {
  const res = await supabase
    .from("prototypes")
    .update({ published })
    .eq("id", id)
    .select(PROTOTYPE_META_SELECT)
    .single();
  const registro = unwrap<PrototypeRecord>(res);
  await sincronizarEstagio(registro.leadId);
  return registro;
}

/**
 * Alinha o estágio do lead com a existência de protótipo publicado.
 *
 * Sem isto o lead segue marcado como "protótipo pronto" depois que o protótipo
 * é apagado ou tirado do ar — as duas fontes discordam, e quem lê o painel vê
 * um lead que diz ter protótipo aparecendo na lista de quem precisa de um.
 *
 * Só regride quem está exatamente em `prototipo_pronto`: lead já contatado
 * teve o protótipo enviado de fato, e voltá-lo apagaria história real.
 */
async function sincronizarEstagio(leadId: number) {
  const { count, error } = await supabase
    .from("prototypes")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("published", true);
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  const { error: stageError } = await supabase
    .from("leads")
    .update({ stage: "qualificado" })
    .eq("id", leadId)
    .eq("stage", "prototipo_pronto");
  if (stageError) throw new Error(stageError.message);
}

export interface PrototypeListItem {
  id: number;
  leadId: number;
  leadName: string;
  slug: string;
  pageTitle: string | null;
  published: boolean;
  expiresAt: string | null;
  createdAt: string;
  views: number;
  lastViewedAt: string | null;
}

/**
 * Todos os protótipos já publicados, com o nome do lead e a contagem de
 * visitas. Sem o HTML, que pesa centenas de KB por linha — ele é buscado só
 * quando alguém pede o download.
 */
export async function listPrototypes(): Promise<PrototypeListItem[]> {
  const res = await supabase
    .from("prototypes")
    .select(
      "id, leadId:lead_id, slug, pageTitle:page_title, published, expiresAt:expires_at, createdAt:created_at, leads!inner(name)",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  type Row = Omit<PrototypeListItem, "leadName" | "views" | "lastViewedAt"> & {
    leads: { name: string };
  };
  const rows = unwrap<Row[]>(res);
  if (rows.length === 0) return [];

  const visitas = await supabase
    .from("prototype_views")
    .select("prototype_id, viewedAt:viewed_at")
    .in("prototype_id", rows.map((r) => r.id))
    .order("viewed_at", { ascending: false })
    .limit(5000);

  const porProtótipo = new Map<number, { total: number; ultima: string }>();
  for (const v of unwrap<{ prototype_id: number; viewedAt: string }[]>(visitas)) {
    const atual = porProtótipo.get(v.prototype_id);
    // Vêm ordenadas por data decrescente: a primeira de cada é a mais recente.
    if (atual) atual.total += 1;
    else porProtótipo.set(v.prototype_id, { total: 1, ultima: v.viewedAt });
  }

  return rows.map(({ leads, ...proto }) => ({
    ...proto,
    leadName: leads.name,
    views: porProtótipo.get(proto.id)?.total ?? 0,
    lastViewedAt: porProtótipo.get(proto.id)?.ultima ?? null,
  }));
}

/** O HTML só é carregado sob demanda: são centenas de KB por protótipo. */
export async function getPrototypeHtml(id: number): Promise<string> {
  const res = await supabase.from("prototypes").select("html").eq("id", id).single();
  const linha = unwrap<{ html: string | null }>(res);
  if (!linha.html) throw new Error("Este protótipo não tem HTML guardado.");
  return linha.html;
}

/**
 * Troca o HTML mantendo o mesmo endereço.
 *
 * O link já foi enviado ao prospect, então republicar com slug novo quebraria
 * a mensagem que ele tem no WhatsApp — e perderia o histórico de visitas.
 */
export async function updatePrototypeHtml(id: number, html: string, pageTitle: string | null) {
  const { error } = await supabase
    .from("prototypes")
    .update({ html, page_title: pageTitle })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Apaga o protótipo de vez.
 *
 * Leva junto o histórico de visitas: `prototype_views` tem cascade. Como a
 * visita é o sinal de compra do módulo, isso costuma ser mais caro que o
 * arquivo — quem quiser só tirar do ar deve usar `setPrototypePublished`, que
 * preserva tudo.
 */
export async function deletePrototype(id: number) {
  // Guarda o lead antes: depois do delete não há de onde tirar.
  const alvo = await supabase.from("prototypes").select("lead_id").eq("id", id).single();
  const leadId = unwrap<{ lead_id: number }>(alvo).lead_id;

  const { error } = await supabase.from("prototypes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await sincronizarEstagio(leadId);
}

/** Empurra o prazo para frente, a contar de hoje. */
export async function extendPrototype(id: number, days: number) {
  const { error } = await supabase
    .from("prototypes")
    .update({ expires_at: new Date(Date.now() + days * 86_400_000).toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export interface PrototypeViewSummary {
  leadId: number;
  prototypeId: number;
  slug: string;
  views: number;
  lastViewedAt: string;
}

/**
 * Quem abriu o protótipo, do mais recente para o mais antigo. É o que alimenta
 * o bloco QUENTE da fila: seguir com quem acabou de olhar converte muito acima
 * de qualquer sequência cega.
 */
export async function listPrototypeViews(sinceDays = 14): Promise<PrototypeViewSummary[]> {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const res = await supabase
    .from("prototype_views")
    .select("viewedAt:viewed_at, prototypes!inner(id, slug, lead_id)")
    .gte("viewed_at", since)
    .order("viewed_at", { ascending: false })
    .limit(1000);

  const rows = unwrap<
    { viewedAt: string; prototypes: { id: number; slug: string; lead_id: number } }[]
  >(res);

  // Agrupa por LEAD, não por protótipo: republicar cria uma linha nova em
  // `prototypes`, e as visitas do protótipo anterior continuam válidas. Com a
  // chave no protótipo, o mesmo negócio aparecia duas vezes na fila.
  const byLead = new Map<number, PrototypeViewSummary>();
  for (const row of rows) {
    const existing = byLead.get(row.prototypes.lead_id);
    if (existing) {
      existing.views += 1;
    } else {
      // As linhas vêm ordenadas por data decrescente, então a primeira de
      // cada lead já é a visita mais recente — e o slug dela é o do protótipo
      // que a pessoa abriu por último.
      byLead.set(row.prototypes.lead_id, {
        leadId: row.prototypes.lead_id,
        prototypeId: row.prototypes.id,
        slug: row.prototypes.slug,
        views: 1,
        lastViewedAt: row.viewedAt,
      });
    }
  }
  return [...byLead.values()].sort((a, b) =>
    b.lastViewedAt.localeCompare(a.lastViewedAt),
  );
}

// ── configurações ────────────────────────────────────────────────────────

export interface ProspectingSettings {
  active: boolean;
  cityName: string;
  niches: string[];
  runTaskCap: number;
  nearbyDailyCap: number;
  nearbyMonthlyCap: number;
  detailsDailyCap: number;
  detailsMonthlyCap: number;
  dailyOutreachCap: number;
  prototypeTtlDays: number;
  /** Quem assina a abordagem. Pessoa com nome responde melhor que empresa. */
  outreachSenderName: string;
  agencyName: string;
}

const SETTINGS_SELECT = [
  "active",
  "cityName:city_name",
  "niches",
  "runTaskCap:run_task_cap",
  "nearbyDailyCap:nearby_daily_cap",
  "nearbyMonthlyCap:nearby_monthly_cap",
  "detailsDailyCap:details_daily_cap",
  "detailsMonthlyCap:details_monthly_cap",
  "dailyOutreachCap:daily_outreach_cap",
  "prototypeTtlDays:prototype_ttl_days",
  "outreachSenderName:outreach_sender_name",
  "agencyName:agency_name",
].join(",");

export async function getProspectingSettings() {
  const res = await supabase.from("prospecting_settings").select(SETTINGS_SELECT).eq("id", 1).single();
  return unwrap<ProspectingSettings>(res);
}

export async function updateProspectingSettings(data: Partial<ProspectingSettings>) {
  const payload: Record<string, unknown> = {};
  if (data.active !== undefined) payload.active = data.active;
  if (data.cityName !== undefined) payload.city_name = data.cityName;
  if (data.niches !== undefined) payload.niches = data.niches;
  if (data.runTaskCap !== undefined) payload.run_task_cap = data.runTaskCap;
  if (data.nearbyDailyCap !== undefined) payload.nearby_daily_cap = data.nearbyDailyCap;
  if (data.nearbyMonthlyCap !== undefined) payload.nearby_monthly_cap = data.nearbyMonthlyCap;
  if (data.detailsDailyCap !== undefined) payload.details_daily_cap = data.detailsDailyCap;
  if (data.detailsMonthlyCap !== undefined) payload.details_monthly_cap = data.detailsMonthlyCap;
  if (data.dailyOutreachCap !== undefined) payload.daily_outreach_cap = data.dailyOutreachCap;
  if (data.prototypeTtlDays !== undefined) payload.prototype_ttl_days = data.prototypeTtlDays;
  if (data.outreachSenderName !== undefined) payload.outreach_sender_name = data.outreachSenderName;
  if (data.agencyName !== undefined) payload.agency_name = data.agencyName;

  const res = await supabase
    .from("prospecting_settings")
    .update(payload)
    .eq("id", 1)
    .select(SETTINGS_SELECT)
    .single();
  return unwrap<ProspectingSettings>(res);
}

// ── operação ─────────────────────────────────────────────────────────────

export interface QuotaUsage {
  sku: string;
  today: number;
  month: number;
  remaining: number;
}

export interface PipelineCounts {
  stage: LeadStage;
  count: number;
}

export async function getPipelineCounts(): Promise<PipelineCounts[]> {
  const stages: LeadStage[] = [
    "novo", "qualificado", "prototipo_pronto", "contatado",
    "visualizou", "em_conversa", "proposta", "ganho", "perdido",
  ];
  const results = await Promise.all(
    stages.map(async (stage) => {
      const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("stage", stage);
      if (error) throw new Error(error.message);
      return { stage, count: count ?? 0 };
    }),
  );
  return results;
}

export interface CoberturaContato {
  comWhatsapp: number;
  comEmail: number;
  comAmbos: number;
  semNada: number;
}

/**
 * Por onde dá para falar com os leads vivos.
 *
 * Existe porque a escolha de canal depende disto e não havia como ver: com o
 * WhatsApp restringindo os envios, saber quantos leads têm e-mail é o que
 * define se o e-mail substitui o canal ou só complementa.
 */
export async function getCoberturaContato(): Promise<CoberturaContato> {
  const res = await supabase
    .from("leads")
    .select("phone_e164, email")
    .not("stage", "in", "(ganho,perdido)")
    .limit(5000);
  const leads = unwrap<{ phone_e164: string | null; email: string | null }[]>(res);

  let comWhatsapp = 0, comEmail = 0, comAmbos = 0, semNada = 0;
  for (const l of leads) {
    const tel = !!l.phone_e164;
    const mail = !!l.email;
    if (tel) comWhatsapp++;
    if (mail) comEmail++;
    if (tel && mail) comAmbos++;
    if (!tel && !mail) semNada++;
  }
  return { comWhatsapp, comEmail, comAmbos, semNada };
}

export interface CoberturaPrototipos {
  /** Auditados e sem protótipo: o conjunto realmente pronto para gerar. */
  prontosParaGerar: number;
  /** Vivos no funil e sem protótipo, auditados ou não. */
  semPrototipo: number;
  comPrototipo: number;
}

/**
 * Quantos leads ainda precisam de protótipo, medido pela ausência de
 * protótipo — não pelo estágio.
 *
 * O estágio é um proxy e diverge: ele só avança, então um lead que já foi
 * contatado e teve o protótipo apagado continua adiante, e qualquer caminho
 * que crie protótipo sem passar pelo `advance_lead_stage` deixa o lead para
 * trás. Contar o que de fato existe não tem esse problema.
 */
export async function getCoberturaPrototipos(): Promise<CoberturaPrototipos> {
  const ativos = await supabase
    .from("leads")
    .select("id, segment")
    .not("stage", "in", "(ganho,perdido)")
    .limit(5000);
  const leads = unwrap<{ id: number; segment: LeadSegment }[]>(ativos);
  if (leads.length === 0) {
    return { prontosParaGerar: 0, semPrototipo: 0, comPrototipo: 0 };
  }

  const publicados = await supabase
    .from("prototypes")
    .select("lead_id")
    .eq("published", true)
    .limit(5000);
  const comProto = new Set(
    unwrap<{ lead_id: number }[]>(publicados).map((p) => p.lead_id),
  );

  const comPrototipo = leads.filter((l) => comProto.has(l.id)).length;
  // Sem auditoria o protótipo até sai, mas a abordagem vai sem argumento —
  // por isso o passo aponta só os auditados, e o resto vira o passo anterior.
  const prontosParaGerar = leads.filter(
    (l) => !comProto.has(l.id) && l.segment !== "nao_auditado",
  ).length;
  return { prontosParaGerar, semPrototipo: leads.length - comPrototipo, comPrototipo };
}

export interface JobQueueSummary {
  kind: string;
  status: string;
  count: number;
}

export async function getJobQueue(): Promise<JobQueueSummary[]> {
  const res = await supabase.from("prospect_jobs").select("kind, status").limit(5000);
  const rows = unwrap<{ kind: string; status: string }[]>(res);
  const map = new Map<string, JobQueueSummary>();
  for (const row of rows) {
    const key = `${row.kind}:${row.status}`;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { kind: row.kind, status: row.status, count: 1 });
  }
  return [...map.values()];
}

export async function getGridProgress() {
  const [total, pending, dead] = await Promise.all([
    supabase.from("search_tasks").select("id", { count: "exact", head: true }),
    supabase.from("search_tasks").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("search_cells").select("id", { count: "exact", head: true }).eq("dead", true),
  ]);
  return {
    totalTasks: total.count ?? 0,
    pendingTasks: pending.count ?? 0,
    deadCells: dead.count ?? 0,
  };
}

/** Chama uma Edge Function com a sessão do admin. */
async function invokeFunction<T>(name: string, params?: Record<string, string>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");

  const base = import.meta.env.VITE_SUPABASE_URL;
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const res = await fetch(`${base}/functions/v1/${name}${query}`, {
    method: "POST",
    headers: {
      apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Função ${name} respondeu ${res.status}.`);
  return body as T;
}

export interface SourcingResult {
  skipped?: boolean;
  reason?: string;
  tasksProcessed?: number;
  totalFound?: number;
  totalNew?: number;
  errors?: { cell: string; niche: string; message: string }[];
  usage?: { sku: string; today: number; month: number; remaining: number };
}

export function runSourcing() {
  return invokeFunction<SourcingResult>("prospect-source");
}

export interface WorkerResult {
  skipped?: boolean;
  reason?: string;
  results?: Record<string, { claimed: number; done: number; failed: number; skipped?: string }>;
}

export function runWorker(kind?: string) {
  return invokeFunction<WorkerResult>("prospect-worker", kind ? { kind } : undefined);
}


/**
 * Por onde a sequência sai.
 *
 * O e-mail ganha do telefone quando existe, e não o contrário. O WhatsApp que
 * o Google traz é o da recepção, que não decide sobre site: ela repassa na
 * melhor das hipóteses, e denuncia como propaganda na pior — foi o que
 * restringiu o número. O e-mail do rodapé cai numa caixa que o dono lê.
 *
 * Sem e-mail, a sequência vai por WhatsApp e o primeiro toque serve para
 * descobrir o e-mail de quem decide. Ver
 * `.claude/skills/prototipo-site/references/abordagem.md`.
 */
export function canalDoLead(lead: Pick<Lead, "email">): "whatsapp" | "email" {
  return lead.email ? "email" : "whatsapp";
}

// ── abordagem ────────────────────────────────────────────────────────────

export interface OutreachTouch {
  id: number;
  leadId: number;
  step: number;
  channel: "whatsapp" | "email";
  subject: string | null;
  body: string;
  /**
   * Redação para o canal e-mail. As duas sequências estão deslocadas de um
   * toque — em e-mail a entrega vai no 1, no WhatsApp no 2 —, então no mesmo
   * slot moram mensagens de papéis diferentes. Nula quando não foi escrita.
   */
  bodyEmail: string | null;
  scheduledFor: string;
  sentAt: string | null;
  status: "pending" | "sent" | "skipped" | "cancelled";
}

export interface QueueItem extends OutreachTouch {
  lead: Pick<
    Lead,
    | "id" | "name" | "niche" | "neighborhood" | "phone" | "phoneE164"
    | "whatsappValid" | "email" | "preferredChannel" | "score" | "segment" | "stage"
  > & {
    /** Quando a sequência foi reiniciada — ordena a fila. Ver `restartOutreach`. */
    outreachRestartedAt: string | null;
  };
  prototypeSlug: string | null;
  /**
   * A prévia já foi entregue num toque anterior desta sequência.
   *
   * O toque 1 e o toque 2 podem os dois carregar o link: o 1 entrega quando o
   * lead já tem e-mail, o 2 entrega quando o 1 foi gastar perguntando com quem
   * falar. Só um dos dois caminhos acontece por lead, mas nada impede o
   * operador de mandar os dois — e aí o mesmo link vai duas vezes.
   */
  linkJaEntregue: boolean;
}

const TOUCH_SELECT =
  "id,leadId:lead_id,step,channel,subject,body,bodyEmail:body_email," +
  "scheduledFor:scheduled_for,sentAt:sent_at,status";

/**
 * Fila do dia: toques vencidos e ainda não enviados, do maior score para o
 * menor. Lead terminal fica de fora — não faz sentido seguir cobrando quem já
 * fechou ou já disse não.
 */
export async function listOutreachQueue(): Promise<QueueItem[]> {
  const today = new Date().toISOString().slice(0, 10);
  const res = await supabase
    .from("outreach_touches")
    .select(
      `${TOUCH_SELECT},
       leads!inner(id, name, niche, neighborhood, phone, phone_e164, whatsapp_valid, email, preferred_channel, score, segment, stage, outreach_restarted_at)`,
    )
    .eq("status", "pending")
    .lte("scheduled_for", today)
    .not("leads.stage", "in", "(ganho,perdido)")
    .order("step", { ascending: true })
    .limit(200);

  type Row = Omit<QueueItem, "lead" | "prototypeSlug"> & {
    leads: {
      id: number; name: string; niche: string; neighborhood: string | null;
      phone: string | null; phone_e164: string | null; whatsapp_valid: boolean;
      email: string | null; preferred_channel: "whatsapp" | "email";
      score: number; segment: LeadSegment; stage: LeadStage;
      outreach_restarted_at: string | null;
    };
  };
  const rows = unwrap<Row[]>(res);
  if (rows.length === 0) return [];

  // O slug entra por fora: é uma consulta só para todos os leads da fila, em
  // vez de um join que traria o jsonb inteiro de cada protótipo.
  const slugRes = await supabase
    .from("prototypes")
    .select("slug, leadId:lead_id")
    .in("lead_id", rows.map((r) => r.leads.id))
    .eq("published", true);
  const slugs = new Map(
    unwrap<{ slug: string; leadId: number }[]>(slugRes).map((p) => [p.leadId, p.slug]),
  );

  // Quem já recebeu a prévia. Uma consulta só para a fila inteira, como o slug.
  const entregueRes = await supabase
    .from("outreach_touches")
    .select("leadId:lead_id, body, bodyEmail:body_email, channel")
    .in("lead_id", rows.map((r) => r.leads.id))
    .eq("status", "sent");
  const jaEntregue = new Set(
    unwrap<{ leadId: number; body: string; bodyEmail: string | null; channel: string }[]>(
      entregueRes,
    )
      .filter((t) => /\/p\//.test(t.channel === "email" ? (t.bodyEmail ?? t.body) : t.body))
      .map((t) => t.leadId),
  );

  return rows
    .map(({ leads, ...touch }) => ({
      ...touch,
      lead: {
        id: leads.id,
        name: leads.name,
        niche: leads.niche,
        neighborhood: leads.neighborhood,
        phone: leads.phone,
        phoneE164: leads.phone_e164,
        email: leads.email,
        preferredChannel: leads.preferred_channel,
        whatsappValid: leads.whatsapp_valid,
        score: leads.score,
        segment: leads.segment,
        stage: leads.stage,
        outreachRestartedAt: leads.outreach_restarted_at,
      },
      prototypeSlug: slugs.get(leads.id) ?? null,
      linkJaEntregue: jaEntregue.has(leads.id),
    }))
    .sort((a, b) => b.lead.score - a.lead.score);
}

/** Quantos toques já saíram hoje — alimenta o teto diário. */
export async function countSentToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("outreach_touches")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", start.toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Marca o toque como enviado e avança o estágio. O avanço passa por
 * `advance_lead_stage`, que nunca regride: registrar um toque num lead que já
 * respondeu não o rebaixa para "contatado" — era o que a v1 fazia.
 */
export interface TouchSentResult {
  /** Estágio em que o lead ficou. */
  stage: string;
  /** Data do próximo toque agendado, se houver — para dizer ao operador o que vem. */
  nextTouchDate: string | null;
  nextStep: number | null;
  nextChannel: "whatsapp" | "email" | null;
  /** O próximo toque foi puxado para hoje: mudou de canal, ou este era o roteamento. */
  nextAntecipado: boolean;
  /** Este toque era a pergunta de roteamento — o que vem é a entrega. */
  eraRoteamento: boolean;
}

/**
 * Registra o envio e devolve o que acontece em seguida.
 *
 * O retorno existe porque, marcado o envio, o lead sai da fila de hoje — e
 * sumir sem explicação é desorientador. Com a data do próximo toque dá para
 * dizer exatamente quando ele volta.
 */
export async function markTouchSent(
  touch: QueueItem,
  canal: "whatsapp" | "email" = touch.channel,
): Promise<TouchSentResult> {
  // Grava o canal que foi de fato usado. O card oferece os dois, então o
  // canal do toque é uma sugestão até o envio acontecer — e é do canal usado
  // que depende a decisão de antecipar o próximo.
  const { error } = await supabase
    .from("outreach_touches")
    .update({ status: "sent", sent_at: new Date().toISOString(), channel: canal })
    .eq("id", touch.id);
  if (error) throw new Error(error.message);

  const { data: stage, error: stageError } = await supabase.rpc("advance_lead_stage", {
    p_lead_id: touch.leadId,
    p_stage: "contatado",
  });
  if (stageError) throw new Error(stageError.message);

  const proximo = await supabase
    .from("outreach_touches")
    .select("step, channel, scheduledFor:scheduled_for")
    .eq("lead_id", touch.leadId)
    .eq("status", "pending")
    .order("step", { ascending: true })
    .limit(1)
    .maybeSingle();

  const seguinte = proximo.data as {
    step: number;
    channel: "whatsapp" | "email";
    scheduledFor: string;
  } | null;

  // Este toque foi para uma pessoa; o próximo, em outro canal, vai para outra.
  // O intervalo entre eles não protege ninguém — ver `anteciparProximoToque`.
  const trocaDeCanal = !!seguinte && seguinte.channel !== canal;

  // A pergunta de roteamento também não abre intervalo. Ela não ofereceu nada
  // — perguntou com quem falar —, e a recepção responde em minutos, não em
  // dois dias. Esperar aí é perder a resposta enquanto ela ainda está quente:
  // é justamente quando o e-mail chega que a entrega deve sair.
  const eraRoteamento =
    touch.step === 1 && canal === "whatsapp" && !/\/p\//.test(touch.body);

  const hoje = new Date().toISOString().slice(0, 10);
  let antecipado = false;
  if (seguinte && (trocaDeCanal || eraRoteamento) && seguinte.scheduledFor > hoje) {
    antecipado = (await anteciparProximoToque(touch.leadId)) !== null;
  }

  return {
    stage: (stage as string) ?? "contatado",
    nextTouchDate: antecipado ? hoje : (seguinte?.scheduledFor ?? null),
    nextStep: seguinte?.step ?? null,
    nextChannel: seguinte?.channel ?? null,
    nextAntecipado: antecipado,
    eraRoteamento,
  };
}

/** Toques de um lead, com o estado de cada um. */
export async function listTouches(leadId: number) {
  const res = await supabase
    .from("outreach_touches")
    .select(TOUCH_SELECT)
    .eq("lead_id", leadId)
    .order("step", { ascending: true });
  return unwrap<OutreachTouch[]>(res);
}

/**
 * Devolve um toque para a fila de hoje.
 *
 * Existe porque envio registrado por engano acontece — pop-up bloqueado,
 * mensagem que não foi mandada, número errado. Sem isto o lead sai da fila e
 * não há caminho de volta pela interface.
 *
 * Zera o `sent_at` e reagenda para hoje. Se o lead tinha avançado para
 * "contatado" por causa deste toque e não há outro enviado, o estágio volta.
 */
export async function reopenTouch(touch: OutreachTouch) {
  const hoje = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("outreach_touches")
    .update({ status: "pending", sent_at: null, scheduled_for: hoje })
    .eq("id", touch.id);
  if (error) throw new Error(error.message);

  const { count, error: countError } = await supabase
    .from("outreach_touches")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", touch.leadId)
    .eq("status", "sent");
  if (countError) throw new Error(countError.message);

  // Nenhum toque enviado sobrou: o lead nunca foi de fato abordado.
  if ((count ?? 0) === 0) {
    const { error: stageError } = await supabase
      .from("leads")
      .update({ stage: "prototipo_pronto", contacted_at: null })
      .eq("id", touch.leadId)
      .eq("stage", "contatado");
    if (stageError) throw new Error(stageError.message);
  }
}

/**
 * Corrige o texto de um toque que ainda não saiu.
 *
 * Sequência já publicada fica congelada no banco, e às vezes precisa mudar:
 * corrigir o texto, trocar o assunto ao mudar de canal, ou tirar o link da
 * primeira mensagem de WhatsApp — que era o que fazia a plataforma restringir
 * o número. Sem isto, a única saída era gerar o protótipo de novo.
 */
export async function updateTouch(
  touchId: number,
  campos: {
    body?: string;
    bodyEmail?: string | null;
    subject?: string | null;
    channel?: "whatsapp" | "email";
  },
) {
  const payload: Record<string, unknown> = {};
  if (campos.body !== undefined) payload.body = campos.body;
  if (campos.bodyEmail !== undefined) payload.body_email = campos.bodyEmail;
  if (campos.subject !== undefined) payload.subject = campos.subject;
  if (campos.channel !== undefined) payload.channel = campos.channel;

  const { error } = await supabase
    .from("outreach_touches")
    .update(payload)
    .eq("id", touchId)
    .eq("status", "pending"); // toque enviado guarda o que foi dito de fato
  if (error) throw new Error(error.message);
}

export async function skipTouch(touchId: number) {
  const { error } = await supabase
    .from("outreach_touches")
    .update({ status: "skipped" })
    .eq("id", touchId);
  if (error) throw new Error(error.message);
}

/** Cancela os toques restantes de um lead — usado ao marcar ganho ou perdido. */
export async function cancelRemainingTouches(leadId: number) {
  const { error } = await supabase
    .from("outreach_touches")
    .update({ status: "cancelled" })
    .eq("lead_id", leadId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
}

export interface HotLead extends PrototypeViewSummary {
  lead: Pick<
    Lead,
    "id" | "name" | "niche" | "phoneE164" | "whatsappValid" | "email" | "score" | "stage"
  >;
}

/**
 * Quem abriu o protótipo e ainda não fechou. É a maior alavanca do sistema:
 * seguir com quem acabou de olhar a página converte muito acima de qualquer
 * sequência agendada.
 */
export async function listHotLeads(sinceDays = 14): Promise<HotLead[]> {
  const views = await listPrototypeViews(sinceDays);
  if (views.length === 0) return [];

  const res = await supabase
    .from("leads")
    .select(
      "id, name, niche, phoneE164:phone_e164, whatsappValid:whatsapp_valid, email, score, stage",
    )
    .in("id", views.map((v) => v.leadId))
    .not("stage", "in", "(ganho,perdido)");
  const leads = new Map(
    unwrap<HotLead["lead"][]>(res).map((l) => [l.id, l]),
  );

  return views
    .map((v) => {
      const lead = leads.get(v.leadId);
      return lead ? { ...v, lead } : null;
    })
    .filter((v): v is HotLead => v !== null);
}

/** Marca o lead como visualizado quando uma visita ao protótipo é detectada. */
export async function markViewed(leadId: number) {
  const { error } = await supabase.rpc("advance_lead_stage", {
    p_lead_id: leadId,
    p_stage: "visualizou",
  });
  if (error) throw new Error(error.message);
}

export async function closeLead(leadId: number, won: boolean, reason?: LostReason) {
  await updateLead(leadId, {
    stage: won ? "ganho" : "perdido",
    lostReason: won ? null : (reason ?? "outro"),
  });
  await cancelRemainingTouches(leadId);
}

/**
 * Abre o cliente de e-mail com tudo preenchido.
 *
 * Manual de propósito: e-mail escrito de uma caixa real passa em filtro onde
 * disparo em massa não passa, e não arrisca a reputação do domínio que atende
 * cliente. O rastreio continua vindo da visita ao protótipo, que é sinal
 * melhor que "abriu o e-mail".
 */
export function emailLink(para: string, assunto: string, corpo: string): string {
  return `mailto:${encodeURIComponent(para)}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

/** Mensagem pronta para o wa.me, com o texto do toque já embutido. */
export function whatsappLink(phoneE164: string, body: string): string {
  return `https://wa.me/${phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`;
}

/**
 * Recoloca o lead na fila de auditoria. Site muda, e abordar alguém com um
 * achado que já foi corrigido é pior do que não abordar.
 */
export async function requestReaudit(leadId: number) {
  const { error } = await supabase.rpc("enqueue_job", {
    p_lead_id: leadId,
    p_kind: "enrich",
    p_payload: {},
  });
  if (error) throw new Error(error.message);
}

// ── publicação do protótipo ──────────────────────────────────────────────

/** Espaçamento dos toques, em dias. O toque 1 sai hoje. */
const TOUCH_SCHEDULE = [0, 2, 5, 9];

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "site"
  );
}

/**
 * Publica o protótipo enviado por upload.
 *
 * O HTML é o site do cliente inteiro, autoral, escrito no Claude Code com a
 * skill `prototipo-site`. O sistema não monta mais nada da página — só guarda,
 * serve em /p/:slug dentro de um iframe isolado e agenda a abordagem.
 */
export async function publishPrototype(
  lead: Lead,
  upload: {
    html: string;
    pageTitle: string | null;
    messages: string[];
    /** Redação de e-mail por toque, quando a abordagem trouxer as duas. */
    emailMessages?: (string | null)[];
    /** Assunto por toque, quando a abordagem trouxer. Só usado no canal e-mail. */
    subjects?: (string | null)[];
  },
  options: { ttlDays: number },
) {
  // O link antigo precisa parar de responder quando um novo entra: o índice
  // parcial no banco só admite um publicado por lead.
  const { error: unpublishError } = await supabase
    .from("prototypes")
    .update({ published: false })
    .eq("lead_id", lead.id)
    .eq("published", true);
  if (unpublishError) throw new Error(unpublishError.message);

  const base = slugify(lead.name);
  const expiresAt = new Date(Date.now() + options.ttlDays * 86_400_000).toISOString();

  let slug = "";
  let prototypeId: number | null = null;
  for (let attempt = 0; attempt < 3 && prototypeId === null; attempt++) {
    slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    const { data, error } = await supabase
      .from("prototypes")
      .insert({
        lead_id: lead.id,
        slug,
        html: upload.html,
        page_title: upload.pageTitle,
        published: true,
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (!error && data) {
      prototypeId = data.id;
      break;
    }
    if (error && !error.message.includes("duplicate key")) throw new Error(error.message);
  }
  if (prototypeId === null) throw new Error("Não foi possível gerar um endereço livre para o protótipo.");

  const link = `${window.location.origin}/p/${slug}`;
  const today = Date.now();

  const canal = canalDoLead(lead);
  if (canal !== lead.preferredChannel) {
    await supabase.from("leads").update({ preferred_channel: canal }).eq("id", lead.id);
  }

  // O texto marca `{{link}}` onde o endereço encaixa na frase — o slug só
  // existe aqui, na publicação, então não há como escrevê-lo antes.
  //
  // Sem marcador, onde o link cai depende do canal, e isso não é detalhe de
  // formatação: no WhatsApp, mandar link na primeira mensagem para quem não
  // tem você nos contatos é o padrão que a plataforma penaliza — foi o que
  // restringiu o número mesmo com menos de vinte envios por dia. Lá o primeiro
  // toque pede permissão e o link vem no segundo. Em e-mail, link na primeira
  // é normal e esperado.
  /**
   * Põe o endereço do protótipo no toque em que ele pertence.
   *
   * `indiceDoLink` muda por canal porque a entrega muda de toque: em e-mail
   * ela é a primeira mensagem, onde link é esperado; no WhatsApp a primeira é
   * fria, e link nela é o padrão que restringiu o número da Arkeo mesmo com
   * menos de vinte envios por dia — lá a entrega desce para a segunda.
   *
   * No WhatsApp o marcador na primeira mensagem é removido em vez de
   * substituído: confiar na redação seria deixar um erro de texto custar o
   * número.
   */
  function comLink(textos: (string | null)[], indiceDoLink: number) {
    const temMarcador = textos.some((t) => t?.includes("{{link}}"));
    return textos.map((texto, i) => {
      if (texto === null) return null;
      if (indiceDoLink !== 0 && i === 0) {
        return texto.replaceAll("{{link}}", "").replace(/[ \t]+\n/g, "\n").trim();
      }
      if (texto.includes("{{link}}")) return texto.replaceAll("{{link}}", link);
      if (!temMarcador && i === indiceDoLink) return `${texto}\n\n${link}`;
      return texto;
    });
  }

  // Sem a parte "=== E-MAIL ===", os quatro blocos são a redação do canal do
  // lead: é para ele que o brief mandou escrever. Num lead de e-mail, tratá-los
  // como texto de WhatsApp poria o link no toque errado.
  const temParteEmail = (upload.emailMessages ?? []).some(Boolean);
  const soEmail = !temParteEmail && canal === "email";

  const bodies = comLink(upload.messages, soEmail ? 0 : 1) as string[];

  /**
   * Onde cada bloco de e-mail cai depende de o lead ter e-mail.
   *
   * A escada de e-mail é escrita numa ordem só — entrega, retomada, proposta
   * de conversa, encerramento. Mas quem já tem e-mail entrega no toque 1,
   * enquanto quem não tem gasta o toque 1 perguntando com quem falar e só
   * entrega no 2. Um toque à frente, portanto, e o resto acompanha.
   *
   * A entrega ocupa os dois primeiros toques no segundo caso porque só um
   * deles chega a sair: o toque 1 vai por WhatsApp, e sua redação de e-mail
   * fica de reserva para o lead que ganhar um e-mail antes da hora.
   */
  const escada = upload.emailMessages ?? [null, null, null, null];
  const emailBodies = soEmail
    ? bodies
    : comLink(
        canal === "email"
          ? escada
          : [escada[0], escada[0], escada[2], escada[3]],
        0,
      );

  const { error: touchError } = await supabase.from("outreach_touches").upsert(
    bodies.map((body, i) => ({
      lead_id: lead.id,
      step: i + 1,
      channel: canal,
      subject: upload.subjects?.[i] ?? null,
      body,
      body_email: emailBodies[i] ?? null,
      scheduled_for: new Date(today + TOUCH_SCHEDULE[i] * 86_400_000).toISOString().slice(0, 10),
      status: "pending",
      sent_at: null,
    })),
    { onConflict: "lead_id,step" },
  );
  if (touchError) throw new Error(touchError.message);

  const { error: stageError } = await supabase.rpc("advance_lead_stage", {
    p_lead_id: lead.id,
    p_stage: "prototipo_pronto",
  });
  if (stageError) throw new Error(stageError.message);

  return { slug, link };
}

/**
 * Data em que a doutrina do primeiro toque mudou.
 *
 * Antes dela, o toque 1 de WhatsApp oferecia o protótipo e pedia permissão
 * para mandar o link. Depois, ele pergunta com quem falar sobre o site — o
 * WhatsApp do Google é a recepção, que não decide e por isso não responde a
 * uma oferta. Toque escrito antes desta data carrega o texto velho.
 *
 * É uma data fixa de propósito: marca um evento que aconteceu uma vez. Quem já
 * foi reiniciado fica registrado em `leads.outreach_restarted_at`, então a
 * lista se esvazia sozinha e não volta a encher.
 */
const DOUTRINA_TOQUE_1_DESDE = "2026-08-24T00:00:00Z";

export interface RestartCandidate {
  leadId: number;
  name: string;
  niche: string;
  segment: LeadSegment;
  score: number;
  channel: "whatsapp" | "email";
  /** Quantos toques já saíram com o texto antigo. */
  sentCount: number;
}

/**
 * Leads cuja sequência foi escrita com a abordagem antiga e ainda não foi
 * reiniciada.
 */
export async function listRestartCandidates(): Promise<RestartCandidate[]> {
  const res = await supabase
    .from("outreach_touches")
    .select(
      `leadId:lead_id, step, status, channel,
       leads!inner(id, name, niche, segment, score, stage, outreach_restarted_at)`,
    )
    .lt("created_at", DOUTRINA_TOQUE_1_DESDE)
    .not("leads.stage", "in", "(ganho,perdido)")
    .is("leads.outreach_restarted_at", null)
    .limit(500);

  type Row = {
    leadId: number;
    step: number;
    status: string;
    channel: "whatsapp" | "email";
    leads: {
      id: number; name: string; niche: string;
      segment: LeadSegment; score: number;
    };
  };

  const porLead = new Map<number, RestartCandidate>();
  for (const linha of unwrap<Row[]>(res)) {
    const atual = porLead.get(linha.leadId) ?? {
      leadId: linha.leadId,
      name: linha.leads.name,
      niche: linha.leads.niche,
      segment: linha.leads.segment,
      score: linha.leads.score,
      channel: linha.channel,
      sentCount: 0,
    };
    // O canal da sequência é o do toque 1: é ele que decide se o texto precisa
    // ser reescrito, e os toques seguintes podem já ter sido trocados à mão.
    if (linha.step === 1) atual.channel = linha.channel;
    if (linha.status === "sent") atual.sentCount += 1;
    porLead.set(linha.leadId, atual);
  }
  return [...porLead.values()].sort((a, b) => b.score - a.score);
}

/**
 * Devolve o lead ao começo da sequência, com o toque 1 reescrito.
 *
 * Só o toque 1 muda de texto — era ele que carregava a abordagem. Os toques 2
 * a 4 continuam palavra por palavra: a entrega do protótipo e os argumentos
 * não mudaram de lugar na sequência, e reescrevê-los jogaria fora copy que foi
 * feita para aquele lead.
 *
 * No canal e-mail nem o toque 1 muda: lá a entrega no primeiro toque continua
 * sendo a doutrina, e o que precisa de reinício é só o histórico de envio.
 */
export async function restartOutreach(
  lead: Pick<RestartCandidate, "leadId" | "name" | "niche" | "segment" | "channel">,
  identity: { senderName: string; agencyName: string },
): Promise<number> {
  const body =
    lead.channel === "whatsapp"
      ? buildRoutingOpener({
          leadName: lead.name,
          niche: lead.niche,
          segment: lead.segment,
          senderName: identity.senderName,
          agencyName: identity.agencyName,
        })
      : null;

  const { data, error } = await supabase.rpc("restart_outreach", {
    p_lead_id: lead.leadId,
    p_body: body,
  });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}
