import { Send } from "lucide-react";
import { useState } from "react";
import Reveal from "../ui/Reveal";
import SectionLabel from "../ui/SectionLabel";

const WHATSAPP_LINK =
  "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os%20da%20Arkeo%20Sistemas.";

const SELECT_ARROW_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A90AD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

type FieldName = "name" | "whatsapp" | "service";

const inputClasses = (hasError: boolean) =>
  `text-text placeholder:text-text-muted focus:border-accent focus:bg-accent/5 w-full rounded-lg border bg-white/[0.04] px-3.5 py-3 text-[0.9rem] outline-none transition placeholder:opacity-55 ${
    hasError ? "border-[#ff6b6b]" : "border-border"
  }`;

function Contact() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<FieldName, boolean>>({
    name: false,
    whatsapp: false,
    service: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const checkField = (field: FieldName, value: string) => {
    const hasError = value.trim() === "";
    setErrors((prev) => ({ ...prev, [field]: hasError }));
    return !hasError;
  };

  return (
    <section
      id="contato"
      className="relative scroll-mt-24 overflow-hidden py-24"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(61,120,245,0.07) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <SectionLabel>Vamos conversar</SectionLabel>
            <h2 className="font-family-display mb-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] font-bold text-white">
              Pronto para começar?
              <br />
              Fale com a Arkeo.
            </h2>
            <p className="text-text-muted mb-8 text-[1.05rem]">
              Conte o que você precisa e respondemos em até 24 horas com uma
              análise inicial gratuita.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#25D366" }}
              className="inline-flex items-center gap-2 text-[0.925rem] font-semibold transition hover:opacity-75"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Prefere pelo WhatsApp? Clique aqui
            </a>
          </Reveal>

          <Reveal
            delay="0.2s"
            className="border-border bg-surface rounded-[20px] border p-12"
          >
            {submitted ? (
              <div className="py-8 text-center">
                <div
                  className="text-accent mb-4 text-[2.5rem]"
                  aria-hidden="true"
                >
                  ✦
                </div>
                <h3 className="font-family-display mb-2 text-[1.1rem] font-bold text-white">
                  Mensagem enviada!
                </h3>
                <p className="text-text-muted text-[0.9rem]">
                  Recebemos seu contato e respondemos em até 24 horas. Fique de
                  olho no seu WhatsApp.
                </p>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  const isNameValid = checkField("name", name);
                  const isWhatsappValid = checkField("whatsapp", whatsapp);
                  const isServiceValid = checkField("service", service);
                  if (isNameValid && isWhatsappValid && isServiceValid) {
                    setSubmitted(true);
                  }
                }}
              >
                <div className="mb-6">
                  <label
                    htmlFor="fname"
                    className="text-text-muted mb-1.5 block text-[0.825rem] font-medium"
                  >
                    Nome *
                  </label>
                  <input
                    id="fname"
                    type="text"
                    name="name"
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (errors.name) checkField("name", event.target.value);
                    }}
                    onBlur={(event) => checkField("name", event.target.value)}
                    className={inputClasses(errors.name)}
                  />
                  {errors.name && (
                    <span className="mt-1 block text-[0.78rem] text-[#ff6b6b]">
                      Informe seu nome.
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="fwa"
                    className="text-text-muted mb-1.5 block text-[0.825rem] font-medium"
                  >
                    WhatsApp *
                  </label>
                  <input
                    id="fwa"
                    type="tel"
                    name="whatsapp"
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    value={whatsapp}
                    onChange={(event) => {
                      setWhatsapp(event.target.value);
                      if (errors.whatsapp)
                        checkField("whatsapp", event.target.value);
                    }}
                    onBlur={(event) =>
                      checkField("whatsapp", event.target.value)
                    }
                    className={inputClasses(errors.whatsapp)}
                  />
                  {errors.whatsapp && (
                    <span className="mt-1 block text-[0.78rem] text-[#ff6b6b]">
                      Informe seu WhatsApp.
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="fsvc"
                    className="text-text-muted mb-1.5 block text-[0.825rem] font-medium"
                  >
                    Tipo de projeto *
                  </label>
                  <select
                    id="fsvc"
                    name="service"
                    value={service}
                    onChange={(event) => {
                      setService(event.target.value);
                      if (errors.service)
                        checkField("service", event.target.value);
                    }}
                    onBlur={(event) =>
                      checkField("service", event.target.value)
                    }
                    style={SELECT_ARROW_STYLE}
                    className={`cursor-pointer appearance-none ${inputClasses(errors.service)}`}
                  >
                    <option value="">Selecione um tipo de projeto</option>
                    <option value="landing">Landing Page</option>
                    <option value="institucional">Site Institucional</option>
                    <option value="sistema">Sistema Web / App</option>
                    <option value="outro">Outro / Não sei ainda</option>
                  </select>
                  {errors.service && (
                    <span className="mt-1 block text-[0.78rem] text-[#ff6b6b]">
                      Selecione um tipo de projeto.
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="fmsg"
                    className="text-text-muted mb-1.5 block text-[0.825rem] font-medium"
                  >
                    Mensagem (opcional)
                  </label>
                  <textarea
                    id="fmsg"
                    name="message"
                    placeholder="Conte um pouco sobre seu projeto ou o problema que quer resolver..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className={`min-h-24 resize-y ${inputClasses(false)}`}
                  />
                </div>

                <button
                  type="submit"
                  className="bg-accent shadow-accent hover:bg-accent-dark hover:shadow-accent-hover font-family-display mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-[0.975rem] font-semibold text-white transition"
                >
                  <Send size={17} aria-hidden="true" />
                  Enviar mensagem
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default Contact;
