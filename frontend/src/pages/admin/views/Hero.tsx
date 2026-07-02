import { Check } from "lucide-react";
import { useAdmin } from "../context";
import PanelHeader from "../components/PanelHeader";
import {
  btnPrimaryClass,
  formHintClass,
  formInputClass,
  formLabelClass,
  panelClass,
} from "../ui";

function Hero() {
  const { state, updateHero, heroLoading, heroSaving, saveHero } = useAdmin();
  const hero = state.hero;

  if (heroLoading) {
    return (
      <div className={`${panelClass} mb-0 text-text-muted text-[0.875rem]`}>
        Carregando conteúdo do Hero...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className={`${panelClass} mb-0`}>
        <PanelHeader
          tag="Seção Hero"
          title="Conteúdo principal do topo da página"
          description="Esse é o primeiro bloco que o visitante vê. As alterações aparecem em tempo real na pré-visualização ao lado."
        />

        <div className="mb-6">
          <label className={formLabelClass} htmlFor="heroBadge">
            Texto do selo (badge)
          </label>
          <input
            id="heroBadge"
            type="text"
            maxLength={60}
            value={hero.badge}
            onChange={(e) => updateHero({ badge: e.target.value })}
            className={formInputClass}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className={formLabelClass} htmlFor="heroH1Line1">
              Headline — linha 1
            </label>
            <input
              id="heroH1Line1"
              type="text"
              maxLength={40}
              value={hero.h1Line1}
              onChange={(e) => updateHero({ h1Line1: e.target.value })}
              className={formInputClass}
            />
          </div>
          <div>
            <label className={formLabelClass} htmlFor="heroH1Accent">
              Headline — linha 2 (cor de destaque)
            </label>
            <input
              id="heroH1Accent"
              type="text"
              maxLength={40}
              value={hero.h1Accent}
              onChange={(e) => updateHero({ h1Accent: e.target.value })}
              className={formInputClass}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className={formLabelClass} htmlFor="heroSubtitle">
            Subtítulo
          </label>
          <textarea
            id="heroSubtitle"
            rows={3}
            maxLength={220}
            value={hero.subtitle}
            onChange={(e) => updateHero({ subtitle: e.target.value })}
            className={formInputClass}
          />
          <div className="text-text-muted mt-1 text-right text-[0.7rem]">
            {hero.subtitle.length}/220
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className={formLabelClass} htmlFor="heroCtaPrimary">
              Texto do CTA primário
            </label>
            <input
              id="heroCtaPrimary"
              type="text"
              maxLength={30}
              value={hero.ctaPrimary}
              onChange={(e) => updateHero({ ctaPrimary: e.target.value })}
              className={formInputClass}
            />
          </div>
          <div>
            <label className={formLabelClass} htmlFor="heroCtaSecondary">
              Texto do CTA secundário
            </label>
            <input
              id="heroCtaSecondary"
              type="text"
              maxLength={30}
              value={hero.ctaSecondary}
              onChange={(e) => updateHero({ ctaSecondary: e.target.value })}
              className={formInputClass}
            />
          </div>
        </div>

        <button
          className={btnPrimaryClass}
          disabled={heroSaving}
          onClick={() => saveHero()}
        >
          <Check size={16} aria-hidden="true" />
          {heroSaving ? "Salvando..." : "Salvar alterações"}
        </button>
        <p className={formHintClass}>
          A pré-visualização atualiza em tempo real; clique em salvar para
          gravar as alterações no site.
        </p>
      </div>

      <div className={`${panelClass} mb-0`}>
        <PanelHeader tag="Pré-visualização" title="Como aparece no site" />
        <div className="border-border bg-bg relative overflow-hidden rounded-xl border p-7">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              opacity: 0.15,
              maskImage:
                "radial-gradient(ellipse 75% 75% at 50% 30%, black 10%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 75% at 50% 30%, black 10%, transparent 100%)",
            }}
            aria-hidden="true"
          />
          <div className="relative z-1">
            <div className="border-accent/25 bg-accent/10 text-accent mb-3.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.7rem] font-medium">
              <span aria-hidden="true">✦</span> {hero.badge}
            </div>
            <h1 className="mb-3 text-[clamp(1.3rem,4vw,1.85rem)]">
              {hero.h1Line1}
              <br />
              <span className="text-accent">{hero.h1Accent}</span>
            </h1>
            <p className="text-text-muted mb-4.5 max-w-105 text-[0.85rem] leading-relaxed">
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <span
                className={`${btnPrimaryClass} px-3.5! py-2! text-[0.8rem]!`}
              >
                {hero.ctaPrimary}
              </span>
              <span className="text-text border-border font-family-display inline-flex items-center rounded-lg border-[1.5px] px-3.5 py-2 text-[0.8rem] font-semibold">
                {hero.ctaSecondary}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
