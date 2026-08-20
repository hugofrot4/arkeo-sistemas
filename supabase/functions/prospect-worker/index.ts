// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { PROVIDER_PLACES, SKU_DETAILS } from "../_shared/places.ts";
import { getBudget, requireAdmin } from "../_shared/guard.ts";
import { typed } from "../_shared/database.ts";
import { handleDetails } from "./handlers/details.ts";
import { handleEnrich } from "./handlers/enrich.ts";
import type { Handler, Job } from "./handlers/types.ts";

// Worker da fila de prospecção.
//
// Invocação curta e repetida, em vez do laço longo da v1: cada chamada
// reivindica poucos jobs, processa e devolve. Assim o timeout da Edge Function
// deixa de ser risco, uma falha isolada não derruba o lote, e duas invocações
// concorrentes não pegam o mesmo job (o lock está em claim_prospect_jobs).
//
// Agendado por pg_cron; também pode ser chamado pelo admin.

const BATCH_SIZE = 5;

const HANDLERS: Record<string, Handler> = {
  details: handleDetails,
  enrich: handleEnrich,
};

/** Ordem importa: details traz o telefone e o site que enrich vai auditar. */
const KINDS = ["details", "enrich"];

/**
 * Tipos que gastam cota de API por job. `enrich` fica de fora: é só requisição
 * HTTP ao site do próprio lead, sem custo por chamada.
 */
const PAID_KINDS: Record<
  string,
  { provider: string; sku: string; dailyCap: CapField; monthlyCap: CapField }
> = {
  details: {
    provider: PROVIDER_PLACES,
    sku: SKU_DETAILS,
    dailyCap: "details_daily_cap",
    monthlyCap: "details_monthly_cap",
  },
};

/** Só as colunas numéricas de teto — evita indexar `active` por engano. */
type CapField = "details_daily_cap" | "details_monthly_cap";

interface SettingsRow {
  active: boolean;
  details_daily_cap: number;
  details_monthly_cap: number;
}

interface KindResult {
  claimed: number;
  done: number;
  failed: number;
  skipped?: string;
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    const admin = typed(ctx.supabaseAdmin);

    const denied = await requireAdmin(req, admin, ctx.authMode);
    if (denied) return denied;

    const { data: settings } = await admin
      .from("prospecting_settings")
      .select("active, details_daily_cap, details_monthly_cap")
      .eq("id", 1)
      .single();
    if (!settings?.active) {
      return Response.json({ skipped: true, reason: "Prospecção desativada nas configurações." });
    }

    const requested = new URL(req.url).searchParams.get("kind");
    const kinds = requested ? [requested] : KINDS;
    const results: Record<string, KindResult> = {};

    for (const kind of kinds) {
      const handler = HANDLERS[kind];
      if (!handler) {
        results[kind] = { claimed: 0, done: 0, failed: 0, skipped: "handler não implementado" };
        continue;
      }

      // Cota conferida ANTES de reivindicar: job reivindicado e não executado
      // queimaria uma tentativa à toa.
      const paid = PAID_KINDS[kind];
      if (paid) {
        const budget = await getBudget(
          admin,
          paid.provider,
          paid.sku,
          settings[paid.dailyCap],
          settings[paid.monthlyCap],
        );
        if (budget.remaining <= 0) {
          results[kind] = {
            claimed: 0,
            done: 0,
            failed: 0,
            skipped: `cota esgotada (${budget.dayCount} hoje, ${budget.monthCount} no mês)`,
          };
          continue;
        }
      }

      const { data: claimed, error } = await admin.rpc("claim_prospect_jobs", {
        p_kind: kind,
        p_limit: BATCH_SIZE,
      });
      if (error) {
        results[kind] = { claimed: 0, done: 0, failed: 0, skipped: `claim falhou: ${error.message}` };
        continue;
      }

      const jobs = (claimed ?? []) as Job[];
      let done = 0;
      let failed = 0;

      for (const job of jobs) {
        try {
          await handler({ admin, job });
          await admin.rpc("complete_prospect_job", { p_id: job.id, p_ok: true });
          done++;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`job ${job.id} (${kind}) falhou: ${message}`);
          await admin.rpc("complete_prospect_job", {
            p_id: job.id,
            p_ok: false,
            p_error: message.slice(0, 500),
          });
          failed++;
        }
      }

      results[kind] = { claimed: jobs.length, done, failed };
    }

    return Response.json({ results });
  }),
};
