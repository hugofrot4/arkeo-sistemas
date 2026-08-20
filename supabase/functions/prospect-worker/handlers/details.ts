import { PROVIDER_PLACES, SKU_DETAILS, placeDetails } from "../../_shared/places.ts";
import { bumpUsage } from "../../_shared/guard.ts";
import { parseBrPhone } from "../../_shared/phone.ts";
import { classifyUrl } from "../../_shared/site.ts";
import type { LeadRow } from "../../_shared/database.ts";
import type { Handler } from "./types.ts";

// Busca os campos caros do Places (telefone, site, rating, avaliações) para um
// lead que a descoberta já encontrou, e enfileira a auditoria.
//
// Campos com `verified_by_human` são intocados: se o admin corrigiu o site à
// mão, o Places não desfaz. Era exatamente o que a v1 fazia a cada busca.

export const handleDetails: Handler = async ({ admin, job }) => {
  if (!job.lead_id) throw new Error("job details sem lead_id");

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY não configurada");

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id, place_id, verified_by_human, stage")
    .eq("id", job.lead_id)
    .single();
  if (leadError || !lead) throw new Error(`lead ${job.lead_id} não encontrado`);

  const details = await placeDetails(apiKey, lead.place_id);
  await bumpUsage(admin, PROVIDER_PLACES, SKU_DETAILS);

  // Negócio fechado não vira lead. Encerrar aqui evita gerar protótipo e
  // gastar chamada de IA com quem não existe mais.
  if (details.businessStatus === "CLOSED_PERMANENTLY") {
    const { error } = await admin
      .from("leads")
      .update({ stage: "perdido", lost_reason: "outro", notes: "Fechado permanentemente (Google)." })
      .eq("id", lead.id);
    if (error) throw new Error(`Falha ao encerrar lead fechado: ${error.message}`);
    return;
  }

  const phone = parseBrPhone(details.nationalPhoneNumber);
  const site = classifyUrl(details.websiteUri);

  const patch: Partial<LeadRow> = {
    rating: details.rating ?? null,
    user_rating_count: details.userRatingCount ?? null,
  };

  if (!lead.verified_by_human) {
    patch.phone = details.nationalPhoneNumber ?? null;
    patch.phone_e164 = phone.e164;
    patch.whatsapp_valid = phone.isMobile;
    patch.website = site.kind === "site" ? site.url : null;
    patch.social_url = site.kind === "social" ? site.url : null;
  }

  const { error: updateError } = await admin.from("leads").update(patch).eq("id", lead.id);
  if (updateError) throw new Error(`Falha ao gravar detalhes: ${updateError.message}`);

  const { error: jobError } = await admin
    .from("prospect_jobs")
    .insert({ lead_id: lead.id, kind: "enrich" });
  // Conflito aqui só significa que já existe um enrich aberto para o lead.
  if (jobError && !jobError.message.includes("duplicate key")) {
    throw new Error(`Falha ao enfileirar enrich: ${jobError.message}`);
  }
};
