import type { Db, ProspectJobRow } from "../../_shared/database.ts";

export type Job = ProspectJobRow;

export interface HandlerContext {
  admin: Db;
  job: Job;
}

/** Lança em caso de falha — quem trata retry e backoff é complete_prospect_job. */
export type Handler = (ctx: HandlerContext) => Promise<void>;
