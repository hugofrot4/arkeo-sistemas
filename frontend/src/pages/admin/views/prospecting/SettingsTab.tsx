import { useState } from "react";
import { useAdmin } from "../../context";
import {
  updateProspectingSettings,
  type ProspectingSettings,
} from "../../../../lib/prospecting";
import { NICHE_LABELS } from "./meta";

/** Tipos aceitos pela Places API. Texto livre aqui gera erro 400 e queima cota. */
const AVAILABLE_NICHES = Object.keys(NICHE_LABELS);

export default function SettingsTab({
  settings,
  refresh,
}: {
  settings: ProspectingSettings | null;
  refresh: () => Promise<void>;
}) {
  const { showToast } = useAdmin();
  // Rascunho por cima do que veio do servidor, em vez de copiar para o estado
  // e sincronizar por efeito: assim um refresh nunca apaga edição em andamento
  // nem deixa o formulário exibindo valor velho.
  const [draft, setDraft] = useState<Partial<ProspectingSettings>>({});
  const [saving, setSaving] = useState(false);

  if (!settings) return <p className="text-text-muted text-sm">Carregando…</p>;
  const form: ProspectingSettings = { ...settings, ...draft };

  function set<K extends keyof ProspectingSettings>(key: K, value: ProspectingSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await updateProspectingSettings(form);
      setDraft({});
      await refresh();
      showToast("Configuração salva.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-7">
      <label className="border-border bg-surface flex items-center justify-between gap-4 rounded-xl border p-4">
        <span>
          <span className="block font-semibold">Prospecção ativa</span>
          <span className="text-text-muted text-sm">
            Desligado, nem a busca nem o worker rodam.
          </span>
        </span>
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set("active", e.target.checked)}
          className="h-5 w-5 shrink-0"
        />
      </label>

      <Group
        title="Nichos"
        hint="Só tipos válidos da Places API — um nome inventado devolve erro e gasta cota à toa."
      >
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_NICHES.map((niche) => {
            const on = form.niches.includes(niche);
            return (
              <button
                key={niche}
                onClick={() =>
                  set(
                    "niches",
                    on ? form.niches.filter((n) => n !== niche) : [...form.niches, niche],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-accent bg-accent/12 text-accent"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                {NICHE_LABELS[niche]}
              </button>
            );
          })}
        </div>
        <p className="text-text-muted mt-3 text-xs">
          Mudar os nichos aqui não recria o grid de busca. As tasks existentes
          seguem valendo; nicho novo entra na próxima migração de grid.
        </p>
      </Group>

      <Group title="Ritmo da busca" hint="Cada busca é uma chamada paga à Places API.">
        <Number label="Buscas por execução" value={form.runTaskCap} onChange={(v) => set("runTaskCap", v)} />
        <Number label="Buscas por dia" value={form.nearbyDailyCap} onChange={(v) => set("nearbyDailyCap", v)} />
        <Number label="Buscas por mês" value={form.nearbyMonthlyCap} onChange={(v) => set("nearbyMonthlyCap", v)} />
      </Group>

      <Group
        title="Detalhes do lead"
        hint="Telefone, site e avaliações vêm de um SKU mais caro do Google, com cota grátis menor."
      >
        <Number label="Por dia" value={form.detailsDailyCap} onChange={(v) => set("detailsDailyCap", v)} />
        <Number label="Por mês" value={form.detailsMonthlyCap} onChange={(v) => set("detailsMonthlyCap", v)} />
      </Group>

      <Group
        title="Protótipos"
        hint="O conteúdo é escrito por você no Claude Code — o sistema monta o prompt e confere o que volta. Não há custo de API aqui."
      >
        <Number
          label="Protótipo fica no ar (dias)"
          value={form.prototypeTtlDays}
          onChange={(v) => set("prototypeTtlDays", v)}
        />
      </Group>

      <Group
        title="Abordagem"
        hint="Teto diário de mensagens. Volume alto num dia só é o que faz número ser marcado como spam."
      >
        <Number
          label="Mensagens por dia"
          value={form.dailyOutreachCap}
          onChange={(v) => set("dailyOutreachCap", v)}
        />
      </Group>

      <button
        onClick={save}
        disabled={saving || form.niches.length === 0}
        className="bg-accent rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Salvando…" : "Salvar configuração"}
      </button>
    </div>
  );
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-family-display font-bold">{title}</h3>
      <p className="text-text-muted mb-3 text-sm">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Number({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-text-muted mb-1 block text-sm">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, globalThis.Number(e.target.value)))}
        className="border-border bg-surface w-full rounded-lg border px-3 py-2 text-sm tabular-nums"
      />
    </label>
  );
}
