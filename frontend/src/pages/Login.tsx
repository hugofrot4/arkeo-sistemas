import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import { useState, type FormEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, setToken } from "../lib/api";

const stars = [
  { top: "10%", left: "10%", fontSize: "0.7rem", duration: "9s", delay: "0s" },
  {
    top: "18%",
    left: "86%",
    fontSize: "1.1rem",
    duration: "11s",
    delay: "1.5s",
  },
  { top: "70%", left: "6%", fontSize: "0.55rem", duration: "8s", delay: "3s" },
  {
    top: "80%",
    left: "90%",
    fontSize: "0.9rem",
    duration: "12s",
    delay: "0.5s",
  },
  { top: "45%", left: "92%", fontSize: "1.2rem", duration: "10s", delay: "2s" },
  { top: "88%", left: "45%", fontSize: "0.6rem", duration: "7s", delay: "4s" },
  { top: "6%", left: "52%", fontSize: "0.9rem", duration: "13s", delay: "1s" },
];

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPasswordFilled = (value: string) => value.trim().length > 0;

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@arkeosistemas.com.br");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);

    const emailOk = isValidEmail(email);
    const passwordOk = isPasswordFilled(password);
    setEmailError(!emailOk);
    setPasswordError(!passwordOk);
    if (!emailOk || !passwordOk) return;

    setLoading(true);
    try {
      const { token } = await login(email, password);
      setToken(token);
      navigate("/admin");
    } catch (err) {
      setLoginError(
        err instanceof TypeError
          ? "Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes."
          : err instanceof Error
            ? err.message
            : "E-mail ou senha incorretos. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleForgotClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    window.alert("Fluxo de recuperação de senha — a implementar.");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: 0.14,
          maskImage:
            "radial-gradient(ellipse 70% 65% at 50% 42%, black 15%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 65% at 50% 42%, black 15%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute top-[-12%] left-1/2 h-225 w-225 -translate-x-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(61,120,245,0.14) 0%, transparent 65%)",
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

      <div className="relative z-10 w-full max-w-102">
        <Link
          to="/"
          className="text-text-muted hover:text-text mb-6 inline-flex items-center gap-1.5 text-[0.825rem] whitespace-nowrap transition"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Voltar ao site
        </Link>

        <div
          className="border-border bg-surface relative overflow-hidden rounded-[20px] border p-8 sm:p-12"
          style={{
            boxShadow: "var(--shadow-md), 0 0 80px rgba(61,120,245,0.06)",
          }}
        >
          <div className="via-accent/20 from-accent absolute top-0 right-0 left-0 h-0.5 bg-linear-to-r to-transparent" />

          <div className="mb-8 flex justify-center">
            <img src="/logo-arkeo.png" alt="Arkeo Sistemas" className="w-37" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="font-family-display mb-1.5 text-[1.4rem] font-bold text-white">
              Acesse o painel
            </h1>
            <p className="text-text-muted text-sm">
              Entre com suas credenciais para gerenciar o conteúdo do site.
            </p>
          </div>

          {loginError && (
            <div className="bg-danger/8 border-danger/30 text-danger mb-6 flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-[0.82rem]">
              <AlertCircle size={17} className="shrink-0" aria-hidden="true" />
              <span>{loginError}</span>
            </div>
          )}

          <form noValidate onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="femail"
                className="text-text-muted mb-1.75 block text-[0.8rem] font-medium"
              >
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={17}
                  className="text-text-muted pointer-events-none absolute left-3.5"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  id="femail"
                  name="email"
                  placeholder="seu@email.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(!isValidEmail(e.target.value));
                  }}
                  onBlur={(e) => setEmailError(!isValidEmail(e.target.value))}
                  className={`text-text placeholder:text-text-muted/55 focus:border-accent focus:bg-accent/5 w-full rounded-lg border bg-white/3 py-3.25 pr-3.5 pl-10.5 text-[0.9rem] outline-none transition ${
                    emailError ? "border-danger" : "border-border"
                  }`}
                />
              </div>
              {emailError && (
                <span className="text-danger mt-1.5 flex items-center gap-1.5 text-[0.76rem]">
                  <AlertCircle size={13} aria-hidden="true" /> Informe um
                  e-mail válido.
                </span>
              )}
            </div>

            <div className="mb-8">
              <label
                htmlFor="fpassword"
                className="text-text-muted mb-1.75 block text-[0.8rem] font-medium"
              >
                Senha
              </label>
              <div className="relative flex items-center">
                <Lock
                  size={17}
                  className="text-text-muted pointer-events-none absolute left-3.5"
                  aria-hidden="true"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  id="fpassword"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError)
                      setPasswordError(!isPasswordFilled(e.target.value));
                  }}
                  onBlur={(e) => setPasswordError(!isPasswordFilled(e.target.value))}
                  className={`text-text placeholder:text-text-muted/55 focus:border-accent focus:bg-accent/5 w-full rounded-lg border bg-white/3 py-3.25 pr-10.5 pl-10.5 text-[0.9rem] outline-none transition ${
                    passwordError ? "border-danger" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="text-text-muted hover:text-text absolute right-2 flex h-7.5 w-7.5 items-center justify-center rounded-md transition hover:bg-white/4"
                >
                  {showPassword ? (
                    <EyeOff size={17} aria-hidden="true" />
                  ) : (
                    <Eye size={17} aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <span className="text-danger mt-1.5 flex items-center gap-1.5 text-[0.76rem]">
                  <AlertCircle size={13} aria-hidden="true" /> Informe sua
                  senha.
                </span>
              )}
            </div>

            <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
              <label className="text-text-muted flex cursor-pointer items-center gap-2 text-[0.825rem] select-none">
                <span
                  className={`relative flex h-4.25 w-4.25 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-all ${
                    remember
                      ? "border-accent bg-accent"
                      : "border-border bg-white/3"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {remember && (
                    <span className="border-r-1.75 border-b-1.75 h-2 w-1 -translate-y-px rotate-45 border-white" />
                  )}
                </span>
                Lembrar de mim
              </label>
              <a
                href="#"
                onClick={handleForgotClick}
                className="text-accent text-[0.825rem] font-medium transition hover:opacity-75"
              >
                Esqueci minha senha
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="font-family-display bg-accent shadow-accent hover:bg-accent-dark hover:shadow-accent-hover flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-[0.925rem] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-default disabled:opacity-75"
            >
              {loading ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                  aria-hidden="true"
                />
              ) : (
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <LogIn size={17} aria-hidden="true" /> Entrar
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-text-muted mt-6 text-center text-[0.78rem]">
          © 2026 Arkeo Sistemas. Todos os direitos reservados.
          <span
            className="text-accent mt-1.5 block text-[0.7rem] tracking-[4px]"
            aria-hidden="true"
          >
            ✦ ✦ ✦
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
