// Tipo do schema da prospecção v2 para o cliente Supabase.
//
// Sem isto, `admin.from("leads")` resolve para `never` e qualquer nome de
// coluna errado só aparece em produção como erro do PostgREST — que era
// justamente o modo de falha da v1, onde as escritas nem tinham o `error`
// conferido. Cobre só as tabelas e funções que as Edge Functions tocam.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

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

export type JobKind = "details" | "enrich";
export type JobStatus = "pending" | "running" | "done" | "failed";

export type LeadRow = {
  id: number;
  place_id: string;
  name: string;
  niche: string;
  phone: string | null;
  phone_e164: string | null;
  whatsapp_valid: boolean;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  website: string | null;
  social_url: string | null;
  segment: LeadSegment;
  score: number;
  stage: LeadStage;
  lost_reason: string | null;
  rating: number | null;
  user_rating_count: number | null;
  lat: number | null;
  lng: number | null;
  verified_by_human: boolean;
  notes: string;
  source_cell_id: number | null;
  audited_at: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadAuditRow = {
  id: number;
  lead_id: number;
  reachable: boolean | null;
  http_status: number | null;
  final_url: string | null;
  https_ok: boolean | null;
  has_viewport: boolean | null;
  has_title: boolean | null;
  has_description: boolean | null;
  has_contact_link: boolean | null;
  has_form: boolean | null;
  has_analytics: boolean | null;
  platform: string | null;
  copyright_year: number | null;
  js_rendered: boolean | null;
  page_text: string | null;
  findings: Finding[];
  audited_at: string;
}

/** Um achado da auditoria — vira argumento citável na abordagem. */
export type Finding = {
  code: string;
  severity: "alta" | "media" | "baixa";
  evidence: string;
}

export type PrototypeRow = {
  id: number;
  lead_id: number;
  slug: string;
  template: string;
  content: Record<string, unknown>;
  published: boolean;
  expires_at: string | null;
  model: string | null;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  updated_at: string;
}

export type OutreachTouchRow = {
  id: number;
  lead_id: number;
  step: number;
  channel: "whatsapp" | "email";
  body: string;
  scheduled_for: string;
  sent_at: string | null;
  status: "pending" | "sent" | "skipped" | "cancelled";
  created_at: string;
}

export type SearchCellRow = {
  id: number;
  label: string;
  lat: number;
  lng: number;
  radius_m: number;
  priority: number;
  dead: boolean;
  probe_empty_streak: number;
}

export type SearchTaskRow = {
  id: number;
  cell_id: number;
  niche: string;
  status: "pending" | "exhausted";
  last_run_at: string | null;
  run_count: number;
  empty_streak: number;
  total_found: number;
  total_new: number;
  last_error: string | null;
}

export type ProspectJobRow = {
  id: number;
  lead_id: number | null;
  kind: JobKind;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  locked_at: string | null;
  payload: Record<string, unknown>;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export type ProspectingSettingsRow = {
  id: number;
  active: boolean;
  city_name: string;
  niches: string[];
  run_task_cap: number;
  nearby_daily_cap: number;
  nearby_monthly_cap: number;
  details_daily_cap: number;
  details_monthly_cap: number;
  daily_outreach_cap: number;
  prototype_ttl_days: number;
  updated_at: string;
}

export type ClaimedSearchTask = {
  task_id: number;
  cell_id: number;
  cell_label: string;
  niche: string;
  lat: number;
  lng: number;
  radius_m: number;
}

/** Row + Insert + Update a partir de um único tipo, com as colunas geradas opcionais. */
type Table<Row, Generated extends keyof Row> = {
  Row: Row;
  Insert: Omit<Row, Generated> & Partial<Pick<Row, Generated>>;
  Update: Partial<Row>;
  Relationships: [];
};

type Defaulted<Row, K extends keyof Row> = Omit<Row, K> & Partial<Pick<Row, K>>;

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: Defaulted<
          LeadRow,
          Exclude<keyof LeadRow, "place_id" | "name" | "niche">
        >;
        Update: Partial<LeadRow>;
        Relationships: [];
      };
      lead_audits: Table<LeadAuditRow, "id" | "audited_at">;
      prototypes: Table<
        PrototypeRow,
        "id" | "published" | "expires_at" | "model" | "input_tokens"
        | "cached_input_tokens" | "output_tokens" | "created_at" | "updated_at"
      >;
      prototype_views: {
        Row: { id: number; prototype_id: number; viewed_at: string; user_agent: string | null; referrer: string | null };
        Insert: { prototype_id: number; user_agent?: string | null; referrer?: string | null };
        Update: Partial<{ prototype_id: number; user_agent: string | null; referrer: string | null }>;
        Relationships: [];
      };
      outreach_touches: Table<OutreachTouchRow, "id" | "channel" | "sent_at" | "status" | "created_at">;
      search_cells: Table<SearchCellRow, "id" | "radius_m" | "priority" | "dead" | "probe_empty_streak">;
      search_tasks: Table<
        SearchTaskRow,
        "id" | "status" | "last_run_at" | "run_count" | "empty_streak"
        | "total_found" | "total_new" | "last_error"
      >;
      prospect_jobs: Table<
        ProspectJobRow,
        "id" | "status" | "attempts" | "max_attempts" | "next_run_at"
        | "locked_at" | "payload" | "error" | "created_at" | "updated_at"
      >;
      api_usage: Table<{ provider: string; sku: string; day: string; count: number }, "day" | "count">;
      prospecting_settings: { Row: ProspectingSettingsRow; Insert: Partial<ProspectingSettingsRow>; Update: Partial<ProspectingSettingsRow>; Relationships: [] };
      admin_users: Table<{ user_id: string; email: string | null; created_at: string }, "email" | "created_at">;
    };
    Views: Record<string, never>;
    Functions: {
      claim_search_tasks: { Args: { p_limit: number }; Returns: ClaimedSearchTask[] };
      record_search_task_result: { Args: { p_task_id: number; p_found: number; p_new: number }; Returns: void };
      claim_prospect_jobs: { Args: { p_kind: string; p_limit: number }; Returns: ProspectJobRow[] };
      complete_prospect_job: { Args: { p_id: number; p_ok: boolean; p_error?: string }; Returns: string };
      requeue_stale_jobs: { Args: Record<string, never>; Returns: number };
      enqueue_job: { Args: { p_lead_id: number; p_kind: string; p_payload?: Record<string, unknown> }; Returns: number };
      bump_api_usage: { Args: { p_provider: string; p_sku: string; p_n: number }; Returns: number };
      api_usage_window: { Args: { p_provider: string; p_sku: string }; Returns: { day_count: number; month_count: number }[] };
      advance_lead_stage: { Args: { p_lead_id: number; p_stage: string }; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Db = SupabaseClient<Database, "public">;

/**
 * `withSupabase` entrega o cliente sem o tipo do schema. Este cast é o único
 * ponto onde isso é assumido — depois dele, toda coluna é conferida.
 */
export function typed(client: unknown): Db {
  return client as Db;
}
