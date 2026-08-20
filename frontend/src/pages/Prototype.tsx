/**
 * Página pública do protótipo: /p/:slug
 *
 * É o link que vai na abordagem. Três coisas importam aqui:
 *  1. Abrir rápido e bonito no celular, que é onde o dono do negócio vai ver.
 *  2. Registrar a visita — quem abre o protótipo é lead quente, e é esse
 *     sinal que faz o follow-up valer.
 *  3. Não ser indexada: são páginas de terceiros no domínio da Arkeo.
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSettings } from "../lib/api";
import { getPrototypeBySlug, recordPrototypeView } from "../lib/prospecting";
import { ArkeoBar, PaletteRoot, PlaceholderNote } from "../prototypes/blocks";
import { TEMPLATES } from "../prototypes/registry";
import { isPrototypeContent, isTemplateId } from "../prototypes/validate";
import type { PrototypeContent } from "../prototypes/types";

function useNoIndex(title: string | null, description: string | null) {
  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);

    const previousTitle = document.title;
    if (title) document.title = title;

    let descriptionTag: HTMLMetaElement | null = null;
    if (description) {
      descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) descriptionTag.dataset.previous = descriptionTag.content;
      else {
        descriptionTag = document.createElement("meta");
        descriptionTag.name = "description";
        document.head.appendChild(descriptionTag);
      }
      descriptionTag.content = description;
    }

    return () => {
      robots.remove();
      document.title = previousTitle;
      if (descriptionTag) {
        const previous = descriptionTag.dataset.previous;
        if (previous === undefined) descriptionTag.remove();
        else descriptionTag.content = previous;
      }
    };
  }, [title, description]);
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-bg text-text flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-family-display mb-3 text-2xl font-bold">{title}</h1>
        <p className="text-text-muted leading-relaxed">{body}</p>
        <a href="/" className="text-accent mt-6 inline-block font-semibold">
          Ir para arkeosistemas.com.br
        </a>
      </div>
    </div>
  );
}

export default function Prototype() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<PrototypeContent | null>(null);
  const [agencyWhatsapp, setAgencyWhatsapp] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "missing" | "invalid">("loading");

  useEffect(() => {
    if (!slug) return;
    let active = true;

    (async () => {
      try {
        const record = await getPrototypeBySlug(slug);
        if (!active) return;
        // A policy pública já filtra por publicado e dentro do prazo, então
        // um protótipo expirado chega aqui como inexistente.
        if (!record) {
          setState("missing");
          return;
        }
        if (!isPrototypeContent(record.content)) {
          setState("invalid");
          return;
        }
        setContent(record.content);
        setState("ready");

        // Uma visita por aba: recarregar a página não infla a contagem.
        const key = `arkeo:pv:${record.id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          // Falha de registro não pode atrapalhar quem está vendo a página.
          recordPrototypeView(record.id).catch(() => {});
        }
      } catch {
        if (active) setState("missing");
      }
    })();

    getSettings()
      .then((s) => active && setAgencyWhatsapp(s.whatsapp.replace(/\D/g, "")))
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [slug]);

  useNoIndex(content?.seo.title ?? null, content?.seo.description ?? null);

  if (state === "loading") {
    return <div className="bg-bg min-h-screen" aria-busy="true" />;
  }
  if (state === "missing") {
    return (
      <Message
        title="Protótipo não encontrado"
        body="Este link expirou ou não está mais disponível. Se você recebeu ele de nós, é só pedir um novo."
      />
    );
  }
  if (state === "invalid" || !content) {
    return (
      <Message
        title="Protótipo indisponível"
        body="Houve um problema ao montar esta página. Já estamos vendo isso."
      />
    );
  }

  const Template = isTemplateId(content.template)
    ? TEMPLATES[content.template]
    : TEMPLATES["servico-local"];

  return (
    <PaletteRoot palette={content.palette}>
      <Template content={content} />
      <PlaceholderNote items={content.placeholders} />
      <ArkeoBar businessName={content.facts.name} agencyWhatsapp={agencyWhatsapp} />
    </PaletteRoot>
  );
}
