/**
 * Página pública do protótipo: /p/:slug
 *
 * O HTML é autoral por lead, escrito no Claude Code, e é servido dentro de um
 * iframe com `srcDoc`. O iframe não é preguiça: sem ele, o CSS do protótipo e
 * o do site da Arkeo se misturariam, e o `<head>` do arquivo seria perdido.
 *
 * O `sandbox` vai sem `allow-same-origin` de propósito. A página roda em
 * origem opaca: os scripts dela funcionam, mas não alcançam a sessão do admin
 * nem o Supabase desta origem. `allow-popups` é o que faz o botão de WhatsApp
 * abrir.
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSettings } from "../lib/api";
import { getPrototypeBySlug, recordPrototypeView } from "../lib/prospecting";

const SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox";

function useNoIndex(title: string | null) {
  useEffect(() => {
    // São páginas de terceiros hospedadas no domínio da Arkeo: não devem
    // entrar no índice nem competir com o site institucional.
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);

    const anterior = document.title;
    if (title) document.title = title;

    return () => {
      robots.remove();
      document.title = anterior;
    };
  }, [title]);
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="bg-bg text-text flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-family-display mb-3 text-2xl font-bold">{titulo}</h1>
        <p className="text-text-muted leading-relaxed">{texto}</p>
        <a href="/" className="text-accent mt-6 inline-block font-semibold">
          Ir para arkeosistemas.com.br
        </a>
      </div>
    </div>
  );
}

/** Assinatura da Arkeo, fora do iframe — o arquivo enviado é só o site do cliente. */
function BarraArkeo({ whatsapp }: { whatsapp: string }) {
  const texto = encodeURIComponent("Oi! Vi o protótipo do site e quero falar sobre ele.");
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#060c16] px-5 py-3 text-white">
      <p className="text-sm text-white/70">
        Protótipo feito pela{" "}
        <a
          href="https://www.arkeosistemas.com.br"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-white underline underline-offset-2"
        >
          Arkeo Sistemas
        </a>
      </p>
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${texto}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#2fbf71] px-5 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          Falar com a Arkeo
        </a>
      )}
    </div>
  );
}

export default function Prototype() {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [estado, setEstado] = useState<"carregando" | "pronto" | "ausente">("carregando");

  useEffect(() => {
    if (!slug) return;
    let ativo = true;

    getPrototypeBySlug(slug)
      .then((registro) => {
        if (!ativo) return;
        // A policy pública já filtra por publicado e dentro do prazo, então um
        // protótipo expirado chega aqui como inexistente.
        if (!registro?.html) {
          setEstado("ausente");
          return;
        }
        setHtml(registro.html);
        setPageTitle(registro.pageTitle);
        setEstado("pronto");

        // Uma visita por aba: recarregar não infla a contagem. É o sinal que
        // coloca o lead no bloco "abriram o protótipo" da fila.
        const chave = `arkeo:pv:${registro.id}`;
        try {
          if (!sessionStorage.getItem(chave)) {
            sessionStorage.setItem(chave, "1");
            recordPrototypeView(registro.id).catch(() => {});
          }
        } catch {
          // Navegador com armazenamento bloqueado: registra assim mesmo.
          recordPrototypeView(registro.id).catch(() => {});
        }
      })
      .catch(() => ativo && setEstado("ausente"));

    getSettings()
      .then((s) => ativo && setWhatsapp(s.whatsapp.replace(/\D/g, "")))
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, [slug]);

  useNoIndex(pageTitle);

  if (estado === "carregando") return <div className="bg-bg min-h-screen" aria-busy="true" />;
  if (estado === "ausente" || !html) {
    return (
      <Aviso
        titulo="Protótipo não encontrado"
        texto="Este link expirou ou não está mais disponível. Se você recebeu ele de nós, é só pedir um novo."
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <iframe
        srcDoc={html}
        sandbox={SANDBOX}
        title={pageTitle ?? "Protótipo"}
        className="min-h-0 w-full flex-1 border-0"
      />
      <BarraArkeo whatsapp={whatsapp} />
    </div>
  );
}
