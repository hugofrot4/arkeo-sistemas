import { Check, Upload } from "lucide-react";
import { useAdmin } from "../context";
import PanelHeader from "../components/PanelHeader";
import {
  btnBlockClass,
  btnOutlineClass,
  btnPrimaryClass,
  btnSmClass,
  formHintClass,
  formInputClass,
  formLabelClass,
  panelClass,
} from "../ui";

const palette = [
  { label: "Cor primária", value: "#0D1B2E" },
  { label: "Cor de destaque (accent)", value: "#3D78F5" },
  { label: "Fundo", value: "#060C16" },
];

function Settings() {
  const { state, updateSettings, settingsLoading, settingsSaving, saveSettings } =
    useAdmin();
  const s = state.settings;

  if (settingsLoading) {
    return (
      <div className={`${panelClass} mb-0 text-text-muted text-[0.875rem]`}>
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <div className={panelClass}>
          <PanelHeader tag="Identidade" title="Dados da empresa" />
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className={formLabelClass} htmlFor="stSiteName">
                Nome da empresa
              </label>
              <input
                id="stSiteName"
                type="text"
                value={s.siteName}
                onChange={(e) => updateSettings({ siteName: e.target.value })}
                className={formInputClass}
              />
            </div>
            <div>
              <label className={formLabelClass} htmlFor="stTagline">
                Frase da marca (footer)
              </label>
              <input
                id="stTagline"
                type="text"
                value={s.tagline}
                onChange={(e) => updateSettings({ tagline: e.target.value })}
                className={formInputClass}
              />
            </div>
          </div>
          <div>
            <label className={formLabelClass} htmlFor="stCopy">
              Texto de copyright
            </label>
            <input
              id="stCopy"
              type="text"
              value={s.copy}
              onChange={(e) => updateSettings({ copy: e.target.value })}
              className={formInputClass}
            />
          </div>
        </div>

        <div className={panelClass}>
          <PanelHeader tag="Contato" title="Canais de contato" />
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className={formLabelClass} htmlFor="stWhatsapp">
                Número do WhatsApp
              </label>
              <input
                id="stWhatsapp"
                type="tel"
                value={s.whatsapp}
                onChange={(e) => updateSettings({ whatsapp: e.target.value })}
                className={formInputClass}
              />
            </div>
            <div>
              <label className={formLabelClass} htmlFor="stEmail">
                E-mail de contato
              </label>
              <input
                id="stEmail"
                type="email"
                value={s.email}
                onChange={(e) => updateSettings({ email: e.target.value })}
                className={formInputClass}
              />
            </div>
          </div>
          <div>
            <label className={formLabelClass} htmlFor="stWaMsg">
              Mensagem padrão do WhatsApp
            </label>
            <textarea
              id="stWaMsg"
              rows={2}
              value={s.waMessage}
              onChange={(e) => updateSettings({ waMessage: e.target.value })}
              className={formInputClass}
            />
          </div>
        </div>

        <div className={panelClass}>
          <PanelHeader tag="Redes sociais" title="Links de redes sociais" />
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className={formLabelClass} htmlFor="stInstagram">
                Instagram
              </label>
              <input
                id="stInstagram"
                type="text"
                placeholder="https://instagram.com/arkeosistemas"
                value={s.instagram}
                onChange={(e) => updateSettings({ instagram: e.target.value })}
                className={formInputClass}
              />
            </div>
            <div>
              <label className={formLabelClass} htmlFor="stLinkedin">
                LinkedIn
              </label>
              <input
                id="stLinkedin"
                type="text"
                placeholder="https://linkedin.com/company/arkeosistemas"
                value={s.linkedin}
                onChange={(e) => updateSettings({ linkedin: e.target.value })}
                className={formInputClass}
              />
            </div>
          </div>
          <div>
            <label className={formLabelClass} htmlFor="stGithub">
              GitHub
            </label>
            <input
              id="stGithub"
              type="text"
              placeholder="https://github.com/arkeosistemas"
              value={s.github}
              onChange={(e) => updateSettings({ github: e.target.value })}
              className={formInputClass}
            />
          </div>
        </div>

        <button
          className={btnPrimaryClass}
          disabled={settingsSaving}
          onClick={() => saveSettings()}
        >
          <Check size={16} aria-hidden="true" />
          {settingsSaving ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>

      <div>
        <div className={panelClass}>
          <PanelHeader tag="Marca" title="Logo atual" />
          <div className="border-border bg-bg mb-3 flex items-center justify-center rounded-lg border p-5">
            <img src="/logo-arkeo.png" alt="Logo Arkeo Sistemas" className="w-35" />
          </div>
          <button className={`${btnOutlineClass} ${btnBlockClass} ${btnSmClass}`}>
            <Upload size={15} aria-hidden="true" /> Substituir logo
          </button>
          <p className={formHintClass}>
            PNG transparente, largura recomendada de 400px. Usada na navbar e
            no rodapé do site.
          </p>
        </div>

        <div className={panelClass}>
          <PanelHeader tag="Paleta da marca" title="Cores do sistema" />
          <p className={`${formHintClass} mt-0 mb-3.5`}>
            Derivadas da logo oficial — alterar aqui muda a identidade visual
            de todo o site.
          </p>
          {palette.map((p, i) => (
            <div className={i < palette.length - 1 ? "mb-6" : ""} key={p.label}>
              <label className={formLabelClass}>{p.label}</label>
              <div className="flex items-center gap-2.5">
                <div
                  className="border-border h-10 w-10 shrink-0 rounded-lg border"
                  style={{ background: p.value }}
                />
                <input
                  type="text"
                  value={p.value}
                  readOnly
                  className={formInputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Settings;
