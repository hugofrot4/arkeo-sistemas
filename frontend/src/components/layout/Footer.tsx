import { AiFillGithub, AiFillLinkedin, AiFillInstagram } from "react-icons/ai";

const linksItems = [
  { title: "Serviços", anchor: "#servicos" },
  { title: "Processo", anchor: "#processo" },
  { title: "Projetos", anchor: "#projetos" },
  { title: "FAQ", anchor: "#faq" },
  { title: "Contato", anchor: "#contato" },
];

const socialItems = [
  { icon: <AiFillGithub />, label: "GitHub", href: "#" },
  { icon: <AiFillLinkedin />, label: "LinkedIn", href: "#" },
  { icon: <AiFillInstagram />, label: "Instagram", href: "#" },
];

function Footer() {
  return (
    <footer className="border-border border-t px-6 pt-16 pb-8">
      <div className="border-border flex flex-col gap-8 border-b pb-12 xl:container xl:mx-auto xl:flex-row xl:justify-between">
        <div className="text-text-muted text-sm italic">
          <img className="mb-4 w-28.75" src="./logo-arkeo.png" alt="" />
          <p>Precisão em cada linha de código.</p>
        </div>

        <div className="flex flex-col gap-8 xl:flex-row xl:gap-16">
          <div className="text-text-muted">
            <p className="font-family-display mb-4 text-[0.72rem] font-bold tracking-widest uppercase">
              Links rápidos
            </p>
            <ul className="flex flex-col gap-2">
              {linksItems.map((item) => (
                <li key={`${item.anchor}-footer`} className="">
                  <a
                    href={item.anchor}
                    className="text-sm transition duration-200 hover:text-white"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-text-muted font-family-display mb-4 text-[0.72rem] font-bold tracking-widest uppercase">
              redes sociais
            </p>
            <ul className="flex gap-2">
              {socialItems.map((item) => (
                <li key={`social-${item.label}`}>
                  <a
                    href={item.href}
                    aria-label={item.label}
                    className="border-border bg-surface flex h-9 w-9 items-center justify-center rounded-lg border transition hover:border-[rgba(61,120,245,0.3)] hover:bg-[rgba(61,120,245,0.1)]"
                  >
                    {item.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 pt-4 xl:flex-row xl:justify-between">
        <p className="text-text-muted text-[0.78rem]">
          © 2026 Arkeo Sistemas. Todos os direitos reservados.
        </p>
        <span className="text-accent text-[0.7rem] tracking-[4px]">✦ ✦ ✦</span>
      </div>
    </footer>
  );
}

export default Footer;
