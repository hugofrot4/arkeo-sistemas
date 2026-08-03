// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

// Busca diária de negócios locais via Google Places API (New) e alimenta a
// tabela `prospects` para o pipeline de prospecção ativa do admin.
// Duas formas de chamar:
// - server-to-server (cron do GitHub Actions) com a chave "secret";
// - painel admin (botão "Buscar agora") com a chave "publishable" + o token
//   de sessão do admin logado, validado abaixo antes de rodar.
// `ctx.supabaseAdmin` ignora RLS.

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
].join(",");

interface ProspectingConfigRow {
  id: number;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  niche_types: string[];
  sub_areas: { label: string; lat: number; lng: number }[];
  next_search_index: number;
  daily_call_cap: number;
  monthly_free_limit: number;
  active: boolean;
}

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
}

interface SearchUnit {
  niche: string;
  areaLabel: string | null;
  lat: number;
  lng: number;
}

function buildSearchUnits(config: ProspectingConfigRow): SearchUnit[] {
  const areas = config.sub_areas.length > 0
    ? config.sub_areas
    : [{ label: null as unknown as string, lat: config.center_lat, lng: config.center_lng }];
  const units: SearchUnit[] = [];
  for (const niche of config.niche_types) {
    for (const area of areas) {
      units.push({ niche, areaLabel: area.label, lat: area.lat, lng: area.lng });
    }
  }
  return units;
}

async function searchNearby(
  apiKey: string,
  unit: SearchUnit,
  radiusMeters: number,
): Promise<PlaceResult[]> {
  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: [unit.niche],
      maxResultCount: 20,
      regionCode: "BR",
      languageCode: "pt-BR",
      locationRestriction: {
        circle: {
          center: { latitude: unit.lat, longitude: unit.lng },
          radius: radiusMeters,
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Places API respondeu ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.places ?? []) as PlaceResult[];
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    const admin = ctx.supabaseAdmin;

    // Chave "publishable" é pública (vai no bundle do frontend) — só autoriza
    // a rodar a busca se também vier um token de sessão de admin autenticado.
    if (ctx.authMode === "publishable") {
      const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      const { data: userData, error: userError } = await admin.auth.getUser(token);
      if (userError || !userData.user) {
        return Response.json({ error: "Não autenticado." }, { status: 401 });
      }
    }

    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googleApiKey) {
      return Response.json(
        { error: "GOOGLE_PLACES_API_KEY não configurada nos secrets da função." },
        { status: 500 },
      );
    }

    const { data: config, error: configError } = await admin
      .from("prospecting_config")
      .select("*")
      .eq("id", 1)
      .single();
    if (configError || !config) {
      return Response.json({ error: "prospecting_config não encontrada." }, { status: 500 });
    }
    const cfg = config as ProspectingConfigRow;

    if (!cfg.active) {
      return Response.json({ skipped: true, reason: "prospecting_config.active = false" });
    }
    if (cfg.niche_types.length === 0) {
      return Response.json({ skipped: true, reason: "Nenhum nicho configurado." });
    }

    // Trava de gasto: nunca ultrapassa monthly_free_limit chamadas à Places
    // API dentro do mês corrente, independente do que der errado no cap diário.
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    const { count: callsThisMonth, error: usageError } = await admin
      .from("prospecting_runs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());
    if (usageError) {
      return Response.json({ error: `Falha ao checar uso mensal: ${usageError.message}` }, { status: 500 });
    }
    const remainingBudget = cfg.monthly_free_limit - (callsThisMonth ?? 0);
    if (remainingBudget <= 0) {
      return Response.json({
        skipped: true,
        reason: `Limite mensal de ${cfg.monthly_free_limit} chamadas atingido (${callsThisMonth} usadas). Aguardando o próximo mês.`,
      });
    }

    const allUnits = buildSearchUnits(cfg);
    const cap = Math.min(cfg.daily_call_cap, allUnits.length, remainingBudget);
    const slice: SearchUnit[] = Array.from(
      { length: cap },
      (_, i) => allUnits[(cfg.next_search_index + i) % allUnits.length],
    );

    let totalFound = 0;
    let totalNew = 0;
    let totalUpdated = 0;

    for (const unit of slice) {
      try {
        const places = await searchNearby(googleApiKey, unit, cfg.radius_meters);
        let found = 0;
        let created = 0;
        let updated = 0;

        for (const place of places) {
          if (place.businessStatus === "CLOSED_PERMANENTLY") continue;
          found++;

          const row = {
            place_id: place.id,
            name: place.displayName?.text ?? "Sem nome",
            niche: unit.niche,
            phone: place.nationalPhoneNumber ?? null,
            address: place.formattedAddress ?? null,
            website: place.websiteUri ?? null,
            segment: place.websiteUri ? "com_site" : "sem_site",
            rating: place.rating ?? null,
            user_rating_count: place.userRatingCount ?? null,
            lat: place.location?.latitude ?? null,
            lng: place.location?.longitude ?? null,
          };

          const { data: existing } = await admin
            .from("prospects")
            .select("id")
            .eq("place_id", place.id)
            .maybeSingle();

          if (existing) {
            await admin.from("prospects").update(row).eq("place_id", place.id);
            updated++;
          } else {
            await admin.from("prospects").insert(row);
            created++;
          }
        }

        totalFound += found;
        totalNew += created;
        totalUpdated += updated;

        await admin.from("prospecting_runs").insert({
          niche: unit.niche,
          area_label: unit.areaLabel,
          places_found: found,
          places_new: created,
          places_updated: updated,
          status: "ok",
        });
      } catch (err) {
        await admin.from("prospecting_runs").insert({
          niche: unit.niche,
          area_label: unit.areaLabel,
          status: "error",
          error_message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await admin
      .from("prospecting_config")
      .update({ next_search_index: (cfg.next_search_index + cap) % allUnits.length })
      .eq("id", 1);

    return Response.json({
      unitsProcessed: slice.length,
      totalFound,
      totalNew,
      totalUpdated,
      callsThisMonth: (callsThisMonth ?? 0) + slice.length,
      monthlyFreeLimit: cfg.monthly_free_limit,
    });
  }),
};

/* Para invocar manualmente (produção), use a chave "secret" do projeto:

  curl -i --location --request POST \
    'https://<project-ref>.supabase.co/functions/v1/prospect-search' \
    --header 'apiKey: <SUPABASE_SECRET_KEY>'

*/
