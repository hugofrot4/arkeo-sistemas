// Autorização e controle de cota compartilhados pelas funções da prospecção.

import type { Db } from "./database.ts";

/**
 * A chave "publishable" vai no bundle do frontend, então sozinha ela não
 * autoriza nada: exige token de sessão E que o usuário esteja em
 * `admin_users`. A v1 parava na validação do token, então qualquer usuário
 * autenticado do projeto conseguia disparar gasto de API.
 * O modo "secret" é server-to-server (cron) e já implica confiança na chave.
 */
export async function requireAdmin(
  req: Request,
  admin: Db,
  authMode: string,
): Promise<Response | null> {
  if (authMode !== "publishable") return null;

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: row } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!row) {
    return Response.json({ error: "Sem permissão de admin." }, { status: 403 });
  }
  return null;
}

export interface Budget {
  dayCount: number;
  monthCount: number;
  remaining: number;
}

/**
 * Quanto ainda dá para gastar neste SKU. Conta chamadas realmente feitas
 * (`api_usage`), não linhas de log — na v1 uma rajada de erros de rede
 * zerava o orçamento do mês sem ter trazido um lead sequer.
 */
export async function getBudget(
  admin: Db,
  provider: string,
  sku: string,
  dailyCap: number,
  monthlyCap: number,
): Promise<Budget> {
  const { data, error } = await admin.rpc("api_usage_window", {
    p_provider: provider,
    p_sku: sku,
  });
  if (error) throw new Error(`Falha ao ler cota (${sku}): ${error.message}`);

  const row = (Array.isArray(data) ? data[0] : data) ?? { day_count: 0, month_count: 0 };
  const dayCount = row.day_count ?? 0;
  const monthCount = row.month_count ?? 0;

  return {
    dayCount,
    monthCount,
    remaining: Math.max(0, Math.min(dailyCap - dayCount, monthlyCap - monthCount)),
  };
}

/** Registra uma chamada de fato realizada. Chamar depois do fetch, nunca antes. */
export async function bumpUsage(admin: Db, provider: string, sku: string, n = 1) {
  const { error } = await admin.rpc("bump_api_usage", {
    p_provider: provider,
    p_sku: sku,
    p_n: n,
  });
  if (error) console.error(`bump_api_usage falhou (${sku}): ${error.message}`);
}
