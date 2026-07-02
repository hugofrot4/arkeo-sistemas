import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getHero, type HeroContent } from "../../lib/api";
import Button from "../ui/Button";

const defaultHero: HeroContent = {
  badge: "Desenvolvimento acelerado com IA",
  h1Line1: "Seu site. Seu sistema.",
  h1Accent: "Sua vantagem.",
  subtitle:
    "Desenvolvemos sites e sistemas web personalizados para pequenas e médias empresas que querem crescer com presença digital profissional — sem precisar de equipe técnica interna.",
  ctaPrimary: "Quero um orçamento",
  ctaSecondary: "Ver projetos",
};

const stars = [
  { top: "12%", left: "8%", fontSize: "0.75rem", duration: "9s", delay: "0s" },
  {
    top: "22%",
    left: "88%",
    fontSize: "1.2rem",
    duration: "11s",
    delay: "1.5s",
  },
  { top: "65%", left: "4%", fontSize: "0.55rem", duration: "8s", delay: "3s" },
  {
    top: "78%",
    left: "94%",
    fontSize: "0.9rem",
    duration: "12s",
    delay: "0.5s",
  },
  { top: "42%", left: "78%", fontSize: "1.4rem", duration: "10s", delay: "2s" },
  { top: "85%", left: "48%", fontSize: "0.65rem", duration: "7s", delay: "4s" },
  { top: "8%", left: "58%", fontSize: "1rem", duration: "13s", delay: "1s" },
  { top: "52%", left: "18%", fontSize: "0.5rem", duration: "9s", delay: "5s" },
];

function Hero() {
  const [hero, setHero] = useState<HeroContent>(defaultHero);

  useEffect(() => {
    getHero()
      .then(setHero)
      .catch(() => setHero(defaultHero));
  }, []);

  return (
    <section className="relative flex items-center overflow-hidden pt-25 pb-16 md:min-h-screen md:pt-30 md:pb-20">
      <div
        className="pointer-events-none absolute -top-[10%] -right-[15%] h-[700px] w-[700px]"
        style={{
          background:
            "radial-gradient(circle, rgba(61,120,245,0.1) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.12,
          maskImage:
            "radial-gradient(ellipse 75% 75% at 50% 40%, black 20%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 75% at 50% 40%, black 20%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {stars.map((star, index) => (
          <span
            key={index}
            className="animate-star-float text-accent absolute opacity-0"
            style={{
              top: star.top,
              left: star.left,
              fontSize: star.fontSize,
              animationDuration: star.duration,
              animationDelay: star.delay,
            }}
          >
            ✦
          </span>
        ))}
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <div
            className="border-accent/25 bg-accent/10 text-accent mb-6 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-medium"
            aria-label="Destaque"
          >
            <span aria-hidden="true">✦</span>
            {hero.badge}
          </div>

          <h1 className="font-family-display mb-6 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.15] font-bold text-white">
            {hero.h1Line1}
            <br />
            <span className="text-accent">{hero.h1Accent}</span>
          </h1>

          <p className="text-text-muted mb-12 max-w-[520px] text-[1.1rem] leading-[1.75]">
            {hero.subtitle}
          </p>

          <div className="flex flex-wrap gap-4">
            <Button anchor="#contato">
              <span className="inline-flex items-center gap-2">
                <ArrowRight size={18} aria-hidden="true" />
                {hero.ctaPrimary}
              </span>
            </Button>
            <a
              href="#projetos"
              className="border-border text-text hover:border-accent hover:text-accent font-family-display inline-flex items-center rounded-lg border-[1.5px] px-6.5 py-3.25 text-[0.925rem] font-semibold transition"
            >
              {hero.ctaSecondary}
            </a>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <span
            className="text-accent absolute -top-6 -right-2 text-2xl opacity-40"
            aria-hidden="true"
          >
            ✦
          </span>
          <div
            className="border-border bg-surface relative overflow-hidden rounded-[20px] border p-6 shadow-md"
            aria-hidden="true"
          >
            <div className="via-accent/20 from-accent absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r to-transparent" />

            <div className="mb-6 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <div className="text-text-muted flex h-6 flex-1 items-center rounded-md bg-white/[0.04] px-2.5 text-[0.68rem]">
                meuapp.com.br/dashboard
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="h-8 rounded-md bg-white/[0.04]" />
              <div
                className="flex h-24 items-center justify-center rounded-lg text-[1.75rem] opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(61,120,245,0.15), rgba(13,27,46,0.9))",
                }}
              >
                ✦
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="border-border h-[54px] rounded-md border bg-white/[0.04]" />
                <div className="border-border h-[54px] rounded-md border bg-white/[0.04]" />
                <div className="border-border h-[54px] rounded-md border bg-white/[0.04]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border-accent/15 bg-accent/[0.08] h-10 rounded-md border" />
                <div className="border-accent/15 bg-accent/[0.08] h-10 rounded-md border" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
