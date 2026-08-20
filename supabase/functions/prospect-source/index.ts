// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { PROVIDER_PLACES, SKU_NEARBY, extractNeighborhood, searchNearby, sleep } from "../_shared/places.ts";
import { PermanentPlacesError } from "../_shared/places.ts";
import { bumpUsage, getBudget, requireAdmin } from "../_shared/guard.ts";
import { typed } from "../_shared/database.ts";
import type { ClaimedSearchTask } from "../_shared/database.ts";

// Descoberta de território: varre pares (célula, nicho) ainda não visitados e
// grava os negócios encontrados como leads novos.
//
// Esta função NÃO atualiza lead existente. Descobrir e atualizar são trabalhos
// diferentes: quem atualiza é o job `details`, que sabe o que é dado do Places
// e o que foi conferido por humano. Na v1 a busca reescrevia a linha inteira e
// apagava o site que o admin tinha digitado à mão.

const THROTTLE_MS = 250;

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    const admin = typed(ctx.supabaseAdmin);

    const denied = await requireAdmin(req, admin, ctx.authMode);
    if (denied) return denied;

    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googleApiKey) {
      return Response.json(
        { error: "GOOGLE_PLACES_API_KEY não configurada nos secrets da função." },
        { status: 500 },
      );
    }

    const { data: settings, error: settingsError } = await admin
      .from("prospecting_settings")
      .select("active, run_task_cap, nearby_daily_cap, nearby_monthly_cap")
      .eq("id", 1)
      .single();
    if (settingsError || !settings) {
      return Response.json({ error: "prospecting_settings não encontrada." }, { status: 500 });
    }
    if (!settings.active) {
      return Response.json({ skipped: true, reason: "Prospecção desativada nas configurações." });
    }

    const budget = await getBudget(
      admin,
      PROVIDER_PLACES,
      SKU_NEARBY,
      settings.nearby_daily_cap,
      settings.nearby_monthly_cap,
    );
    if (budget.remaining <= 0) {
      return Response.json({
        skipped: true,
        reason:
          `Cota de descoberta esgotada: ${budget.dayCount} chamadas hoje, ` +
          `${budget.monthCount} no mês. Volta a rodar amanhã.`,
      });
    }

    const limit = Math.min(settings.run_task_cap, budget.remaining);
    const { data: tasks, error: claimError } = await admin.rpc("claim_search_tasks", {
      p_limit: limit,
    });
    if (claimError) {
      return Response.json({ error: `Falha ao reservar tasks: ${claimError.message}` }, { status: 500 });
    }

    const claimed = (tasks ?? []) as ClaimedSearchTask[];
    if (claimed.length === 0) {
      return Response.json({
        skipped: true,
        reason: "Nenhum território pendente — o grid inteiro já foi varrido. " +
          "Reative tasks esgotadas nas configurações para uma nova passada.",
      });
    }

    let totalFound = 0;
    let totalNew = 0;
    const errors: { cell: string; niche: string; message: string }[] = [];

    for (const task of claimed) {
      try {
        const places = await searchNearby(googleApiKey, {
          niche: task.niche,
          lat: task.lat,
          lng: task.lng,
          radiusMeters: task.radius_m,
        });
        // Contabiliza depois do fetch: chamada que não aconteceu não gasta cota.
        await bumpUsage(admin, PROVIDER_PLACES, SKU_NEARBY);

        const rows = places
          .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY" && p.displayName?.text)
          .map((p) => ({
            place_id: p.id,
            name: p.displayName!.text,
            niche: task.niche,
            address: p.formattedAddress ?? null,
            neighborhood: extractNeighborhood(p.formattedAddress),
            lat: p.location?.latitude ?? null,
            lng: p.location?.longitude ?? null,
            source_cell_id: task.cell_id,
          }));

        let inserted: { id: number }[] = [];
        if (rows.length > 0) {
          // ignoreDuplicates: lead já conhecido não é tocado aqui, e o retorno
          // traz só o que entrou de fato — é daí que sai a contagem de novos.
          const { data, error } = await admin
            .from("leads")
            .upsert(rows, { onConflict: "place_id", ignoreDuplicates: true })
            .select("id");
          if (error) throw new Error(`Falha ao gravar leads: ${error.message}`);
          inserted = data ?? [];
        }

        if (inserted.length > 0) {
          const { error: jobError } = await admin
            .from("prospect_jobs")
            .insert(inserted.map((l) => ({ lead_id: l.id, kind: "details" })));
          if (jobError) throw new Error(`Falha ao enfileirar details: ${jobError.message}`);
        }

        totalFound += rows.length;
        totalNew += inserted.length;

        await admin.rpc("record_search_task_result", {
          p_task_id: task.task_id,
          p_found: rows.length,
          p_new: inserted.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ cell: task.cell_label, niche: task.niche, message });

        // Erro permanente (nicho inválido, chave sem permissão) não melhora
        // com repetição — esgota a task em vez de gastar cota nela de novo.
        await admin
          .from("search_tasks")
          .update({
            last_error: message.slice(0, 500),
            ...(err instanceof PermanentPlacesError ? { status: "exhausted" } : {}),
          })
          .eq("id", task.task_id);
      }

      await sleep(THROTTLE_MS);
    }

    const after = await getBudget(
      admin,
      PROVIDER_PLACES,
      SKU_NEARBY,
      settings.nearby_daily_cap,
      settings.nearby_monthly_cap,
    );

    return Response.json({
      tasksProcessed: claimed.length,
      totalFound,
      totalNew,
      errors,
      usage: {
        sku: SKU_NEARBY,
        today: after.dayCount,
        month: after.monthCount,
        remaining: after.remaining,
      },
    });
  }),
};
