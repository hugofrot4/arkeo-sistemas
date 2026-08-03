import {
  CheckCircle2,
  ChevronDown,
  Globe,
  MessageCircle,
  Play,
  Radar,
  Search,
  Settings2,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getProspectingCallsThisMonth } from "../../../lib/api";
import { useAdmin } from "../context";
import type { ProspectSegment, ProspectStatus } from "../types";
import {
  btnOutlineClass,
  btnPrimaryClass,
  filterTabActiveClass,
  filterTabClass,
  formHintClass,
  formInputClass,
  formLabelClass,
  iconBtnClass,
  iconBtnDangerClass,
  panelClass,
} from "../ui";
import { fillTemplate, normalizePhoneForWa, prospectStatusMeta } from "../utils";

const segments: { key: ProspectSegment; label: string }[] = [
  { key: "sem_site", label: "Sem site" },
  { key: "com_site", label: "Com site" },
];

const statusFilters: { status: ProspectStatus | "all"; label: string }[] = [
  { status: "all", label: "Todos" },
  { status: "novo", label: "Novo" },
  { status: "contatado_whatsapp", label: "Contatado" },
  { status: "respondeu", label: "Respondeu" },
  { status: "convertido", label: "Convertido" },
  { status: "nao_contatar", label: "Não contatar" },
  { status: "descartado", label: "Descartado" },
];

function ConfigPanel() {
  const {
    state,
    updateProspectingConfig,
    saveProspectingConfig,
    prospectingConfigLoading,
    prospectingConfigSaving,
    prospectSearchRunning,
    runProspectSearchNow,
  } = useAdmin();
  const [open, setOpen] = useState(false);
  const [callsThisMonth, setCallsThisMonth] = useState<number | null>(null);
  const cfg = state.prospectingConfig;

  const refreshUsage = () => {
    getProspectingCallsThisMonth()
      .then(setCallsThisMonth)
      .catch(() => {});
  };

  useEffect(refreshUsage, []);

  async function handleRunNow() {
    await runProspectSearchNow();
    refreshUsage();
  }

  if (prospectingConfigLoading) return null;

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="text-text flex items-center gap-2 text-left font-family-display text-[0.95rem] font-semibold"
          onClick={() => setOpen((v) => !v)}
        >
          <Settings2 size={17} aria-hidden="true" />
          Configuração da busca
          <ChevronDown
            size={17}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        <div className="flex items-center gap-3">
          {callsThisMonth !== null && (
            <span className="text-text-muted text-[0.78rem]">
              {callsThisMonth} / {cfg.monthlyFreeLimit} chamadas usadas este mês
            </span>
          )}
          <button
            className={btnOutlineClass}
            onClick={handleRunNow}
            disabled={prospectSearchRunning}
          >
            <Play size={15} aria-hidden="true" />
            {prospectSearchRunning ? "Buscando..." : "Buscar agora"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={formLabelClass}>Cidade / região</label>
            <input
              type="text"
              className={formInputClass}
              value={cfg.cityName}
              onChange={(e) => updateProspectingConfig({ cityName: e.target.value })}
            />
          </div>
          <div>
            <label className={formLabelClass}>Raio de busca (metros)</label>
            <input
              type="number"
              min={1000}
              max={50000}
              className={formInputClass}
              value={cfg.radiusMeters}
              onChange={(e) =>
                updateProspectingConfig({ radiusMeters: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className={formLabelClass}>Latitude do centro</label>
            <input
              type="number"
              step="any"
              className={formInputClass}
              value={cfg.centerLat}
              onChange={(e) =>
                updateProspectingConfig({ centerLat: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className={formLabelClass}>Longitude do centro</label>
            <input
              type="number"
              step="any"
              className={formInputClass}
              value={cfg.centerLng}
              onChange={(e) =>
                updateProspectingConfig({ centerLng: Number(e.target.value) })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className={formLabelClass}>Nichos (separados por vírgula)</label>
            <input
              type="text"
              className={formInputClass}
              value={cfg.nicheTypes.join(", ")}
              onChange={(e) =>
                updateProspectingConfig({
                  nicheTypes: e.target.value
                    .split(",")
                    .map((n) => n.trim())
                    .filter(Boolean),
                })
              }
            />
            <p className={formHintClass}>
              Use os tipos da Google Places API (ex: restaurant, dentist, hair_salon).
            </p>
          </div>
          <div>
            <label className={formLabelClass}>Limite de buscas por clique em "Buscar agora"</label>
            <input
              type="number"
              min={1}
              className={formInputClass}
              value={cfg.dailyCallCap}
              onChange={(e) =>
                updateProspectingConfig({ dailyCallCap: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className={formLabelClass}>Limite grátis por mês</label>
            <input
              type="number"
              min={1}
              className={formInputClass}
              value={cfg.monthlyFreeLimit}
              onChange={(e) =>
                updateProspectingConfig({ monthlyFreeLimit: Number(e.target.value) })
              }
            />
            <p className={formHintClass}>
              A busca para automaticamente ao atingir esse total no mês. A Google libera
              1.000 chamadas grátis/mês nesse tipo de busca — deixe uma margem de segurança.
            </p>
          </div>
          <div className="flex items-end gap-2.5">
            <label className="text-text flex items-center gap-2 text-[0.85rem] font-medium">
              <input
                type="checkbox"
                checked={cfg.active}
                onChange={(e) => updateProspectingConfig({ active: e.target.checked })}
              />
              Busca ativa (permite rodar ao clicar em "Buscar agora")
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={formLabelClass}>Template da mensagem de WhatsApp</label>
            <textarea
              rows={3}
              className={formInputClass}
              value={cfg.waMessageTemplate}
              onChange={(e) =>
                updateProspectingConfig({ waMessageTemplate: e.target.value })
              }
            />
            <p className={formHintClass}>
              Placeholders disponíveis: {"{{nome}}"} e {"{{niche}}"}.
            </p>
          </div>
          <div className="sm:col-span-2">
            <button
              className={btnPrimaryClass}
              onClick={saveProspectingConfig}
              disabled={prospectingConfigSaving}
            >
              {prospectingConfigSaving ? "Salvando..." : "Salvar configuração"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Prospects() {
  const {
    state,
    prospectsLoading,
    updateProspectStatus,
    markProspectHasWebsite,
    openConfirmDeleteProspect,
  } = useAdmin();
  const [segment, setSegment] = useState<ProspectSegment>("sem_site");
  const [filter, setFilter] = useState<ProspectStatus | "all">("all");
  const [search, setSearch] = useState("");

  const list = useMemo(() => {
    let items = state.prospects.filter((p) => p.segment === segment);
    if (filter !== "all") items = items.filter((p) => p.status === filter);
    if (search.trim()) {
      const t = search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          p.niche.toLowerCase().includes(t) ||
          (p.phone ?? "").toLowerCase().includes(t),
      );
    }
    return items;
  }, [state.prospects, segment, filter, search]);

  function handleGenerateWhatsApp(p: (typeof list)[number]) {
    const digits = normalizePhoneForWa(p.phone);
    if (!digits) return;
    const text = fillTemplate(state.prospectingConfig.waMessageTemplate, {
      nome: p.name,
      niche: p.niche,
    });
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    updateProspectStatus(p.id, "contatado_whatsapp");
  }

  function handleVerifyOnGoogle(p: (typeof list)[number]) {
    const query = `${p.name} ${state.prospectingConfig.cityName}`;
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleMarkHasWebsite(p: (typeof list)[number]) {
    const website = window.prompt(
      `Achou o site da "${p.name}"? Cole a URL (ou deixe em branco e confirme).`,
      "",
    );
    if (website === null) return; // cancelou
    markProspectHasWebsite(p.id, website.trim() || null);
  }

  return (
    <>
      <ConfigPanel />

      <div className={panelClass}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {segments.map((s) => (
              <button
                key={s.key}
                onClick={() => setSegment(s.key)}
                className={`${btnOutlineClass} ${segment === s.key ? "border-accent! text-accent!" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="border-border bg-bg text-text-muted flex w-55 items-center gap-2 rounded-lg border px-3 py-2.25">
            <Search size={15} aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por nome, nicho ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-text placeholder:text-text-muted w-full bg-transparent text-[0.82rem] outline-none"
            />
          </div>
        </div>

        {segment === "sem_site" && (
          <p className={`${formHintClass} mb-4 -mt-2`}>
            "Sem site" é baseado no que está cadastrado no Google Maps — o negócio pode ter
            um site que só não foi vinculado lá. Use "Verificar no Google" antes de chamar,
            e "Tem site" pra corrigir se for o caso.
          </p>
        )}

        <div className="mb-6 flex flex-wrap gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={f.status}
              onClick={() => setFilter(f.status)}
              className={`${filterTabClass} ${filter === f.status ? filterTabActiveClass : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {prospectsLoading ? (
          <p className="text-text-muted py-10 text-center text-[0.875rem]">
            Carregando...
          </p>
        ) : list.length === 0 ? (
          <div className="text-text-muted py-10 text-center">
            <Radar size={34} className="mx-auto mb-2.5" aria-hidden="true" />
            <p className="text-[0.875rem]">
              Nenhum prospect encontrado com esse filtro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 border-collapse">
              <thead>
                <tr>
                  {["Empresa", "Telefone", "Endereço", "Avaliação", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-text-muted border-border border-b px-3.5 py-2.5 text-left text-[0.7rem] tracking-[0.08em] whitespace-nowrap uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const waDigits = normalizePhoneForWa(p.phone);
                  return (
                    <tr key={p.id} className="hover:bg-white/2 transition-colors">
                      <td className="border-border border-b px-3.5 py-3.25 align-middle">
                        <div className="text-white text-[0.85rem] font-semibold">
                          {p.name}
                        </div>
                        <div className="text-text-muted text-[0.8rem]">{p.niche}</div>
                      </td>
                      <td className="text-text-muted border-border border-b px-3.5 py-3.25 text-[0.85rem] align-middle">
                        {p.phone ?? "—"}
                      </td>
                      <td
                        className="text-text-muted border-border max-w-65 truncate border-b px-3.5 py-3.25 text-[0.85rem] align-middle"
                        title={p.address ?? ""}
                      >
                        {p.address ?? "—"}
                      </td>
                      <td className="text-text-muted border-border border-b px-3.5 py-3.25 text-[0.8rem] align-middle">
                        {p.rating ? (
                          <span className="flex items-center gap-1">
                            <Star size={13} className="fill-current" aria-hidden="true" />
                            {p.rating.toFixed(1)} ({p.userRatingCount ?? 0})
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="border-border border-b px-3.5 py-3.25 align-middle">
                        <select
                          value={p.status}
                          onChange={(e) =>
                            updateProspectStatus(p.id, e.target.value as ProspectStatus)
                          }
                          className="bg-bg border-border text-text cursor-pointer rounded-lg border px-2.5 py-1.5 text-[0.78rem] outline-none"
                        >
                          {Object.entries(prospectStatusMeta).map(([value, meta]) => (
                            <option key={value} value={value}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-border border-b px-3.5 py-3.25 align-middle">
                        <div className="flex gap-1.5">
                          {segment === "sem_site" && (
                            <>
                              <button
                                className={iconBtnClass}
                                onClick={() => handleVerifyOnGoogle(p)}
                                aria-label="Verificar no Google"
                                title="Verificar no Google se o site existe de verdade"
                              >
                                <Globe size={15} aria-hidden="true" />
                              </button>
                              <button
                                className={iconBtnClass}
                                onClick={() => handleMarkHasWebsite(p)}
                                aria-label="Marcar como 'tem site'"
                                title="Na verdade tem site — mover para 'Com site'"
                              >
                                <CheckCircle2 size={15} aria-hidden="true" />
                              </button>
                              <button
                                className={iconBtnClass}
                                onClick={() => handleGenerateWhatsApp(p)}
                                disabled={!waDigits}
                                aria-label="Gerar mensagem de WhatsApp"
                                title={
                                  waDigits
                                    ? "Gerar mensagem de WhatsApp"
                                    : "Sem telefone — contato precisa ser manual"
                                }
                              >
                                <MessageCircle size={15} aria-hidden="true" />
                              </button>
                            </>
                          )}
                          <button
                            className={`${iconBtnClass} ${iconBtnDangerClass}`}
                            onClick={() => openConfirmDeleteProspect(p.id)}
                            aria-label="Excluir"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default Prospects;
