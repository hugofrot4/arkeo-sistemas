import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "../ui/Button";
import MobileMenu from "./MobileMenu";

const menuItems = [
  { title: "Serviços", anchor: "#servicos" },
  { title: "Processo", anchor: "#processo" },
  { title: "Projetos", anchor: "#projetos" },
  { title: "Contato", anchor: "#contato" },
];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-50 ${isScrolled ? "shadow-border-menu bg-bg-menu backdrop-blur-lg" : "shadow-none"} ${isMenuOpen && "bg-bg"}`}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <div className="w-32">
            <img src="./logo-arkeo.png" alt="" />
          </div>
          <button
            className="xl:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>

          <ul className="font-family-display hidden items-center gap-8 text-sm font-medium xl:flex">
            {menuItems.map((item) => (
              <li key={item.anchor}>
                <a
                  className="hover:text-text text-text-muted transition"
                  href={item.anchor}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden xl:block">
            <Button anchor="#contato">Falar com a Arkeo</Button>
          </div>
        </div>
      </header>

      <MobileMenu
        isMenuOpen={isMenuOpen}
        menuItems={menuItems}
        onNavigate={() => setIsMenuOpen(false)}
      />
    </>
  );
}

export default Navbar;
