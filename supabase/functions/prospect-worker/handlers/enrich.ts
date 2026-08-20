import { auditSite, guessWebsite, type SiteAudit } from "../../_shared/audit.ts";
import { scoreLead } from "../../_shared/score.ts";
import type { Finding, LeadRow, LeadSegment } from "../../_shared/database.ts";
import type { Handler } from "./types.ts";

// Audita a presença digital do lead, decide o segmento, calcula o score e
// qualifica.
//
// A v1 resolvia isto com uma linha — `websiteUri ? "com_site" : "sem_site"` —
// e por isso classificava errado justamente os melhores leads: quem tem
// Instagram mas não site, e quem tem site que não abre.

const CURRENT_YEAR = new Date().getUTCFullYear();

/** Um site que responde ainda pode estar obsoleto. Estes são os critérios. */
function isObsolete(audit: SiteAudit): boolean {
  return (
    !audit.hasViewport ||
    !audit.httpsOk ||
    audit.platform === "google_sites" ||
    (audit.copyrightYear !== null && audit.copyrightYear <= CURRENT_YEAR - 3)
  );
}

function socialFinding(socialUrl: string): Finding {
  const network = /instagram/i.test(socialUrl)
    ? "Instagram"
    : /facebook|fb\.com/i.test(socialUrl)
    ? "Facebook"
    : "rede social";
  return {
    code: "so_rede_social",
    severity: "alta",
    evidence:
      `O link do Google aponta para ${network}, não para um site. ` +
      "Quem procura no Google não encontra uma página do negócio.",
  };
}

export const handleEnrich: Handler = async ({ admin, job }) => {
  if (!job.lead_id) throw new Error("job enrich sem lead_id");

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id, name, niche, website, social_url, phone, phone_e164, whatsapp_valid, rating, user_rating_count, verified_by_human, stage")
    .eq("id", job.lead_id)
    .single();
  if (leadError || !lead) throw new Error(`lead ${job.lead_id} não encontrado`);

  let website = lead.website;
  let segment: LeadSegment;
  let audit: SiteAudit | null = null;

  // Sem site conhecido: antes de cravar "sem presença", tenta o domínio óbvio.
  // Não custa cota de API e recupera lead que só não vinculou o site no Maps.
  if (!website && !lead.verified_by_human) {
    website = await guessWebsite(lead.name);
  }

  if (website) {
    audit = await auditSite(website);
    if (!audit.reachable) segment = "site_quebrado";
    else if (isObsolete(audit)) segment = "site_obsoleto";
    else segment = "site_ok";
  } else if (lead.social_url) {
    segment = "so_rede_social";
  } else {
    segment = "sem_presenca";
  }

  const findings: Finding[] = audit ? [...audit.findings] : [];
  if (segment === "so_rede_social" && lead.social_url) {
    findings.push(socialFinding(lead.social_url));
  }
  if (segment === "sem_presenca") {
    findings.push({
      code: "sem_presenca",
      severity: "alta",
      evidence:
        "O negócio não tem site nem página própria. Quem pesquisa o nome no " +
        "Google encontra só o cartão do Maps.",
    });
  }

  const score = scoreLead({
    segment,
    niche: lead.niche,
    rating: lead.rating,
    userRatingCount: lead.user_rating_count,
    whatsappValid: lead.whatsapp_valid,
    hasPhone: !!lead.phone,
  });

  const { error: auditError } = await admin.from("lead_audits").upsert(
    {
      lead_id: lead.id,
      reachable: audit?.reachable ?? null,
      http_status: audit?.httpStatus ?? null,
      final_url: audit?.finalUrl ?? null,
      https_ok: audit?.httpsOk ?? null,
      has_viewport: audit?.hasViewport ?? null,
      has_title: audit?.hasTitle ?? null,
      has_description: audit?.hasDescription ?? null,
      has_contact_link: audit?.hasContactLink ?? null,
      has_form: audit?.hasForm ?? null,
      has_analytics: audit?.hasAnalytics ?? null,
      platform: audit?.platform ?? null,
      copyright_year: audit?.copyrightYear ?? null,
      js_rendered: audit?.jsRendered ?? null,
      page_text: audit?.pageText ?? null,
      findings,
      audited_at: new Date().toISOString(),
    },
    { onConflict: "lead_id" },
  );
  if (auditError) throw new Error(`Falha ao gravar auditoria: ${auditError.message}`);

  const patch: Partial<LeadRow> = {
    segment,
    score: score.total,
    audited_at: new Date().toISOString(),
  };
  // O que veio da adivinhação de domínio ou da leitura da página só entra se
  // o admin ainda não corrigiu o lead à mão.
  if (!lead.verified_by_human) {
    if (website) patch.website = website;
    if (audit?.email) patch.email = audit.email;
  }

  const { error: updateError } = await admin.from("leads").update(patch).eq("id", lead.id);
  if (updateError) throw new Error(`Falha ao gravar segmento e score: ${updateError.message}`);

  const { error: stageError } = await admin.rpc("advance_lead_stage", {
    p_lead_id: lead.id,
    p_stage: "qualificado",
  });
  if (stageError) throw new Error(`Falha ao qualificar lead: ${stageError.message}`);
};
