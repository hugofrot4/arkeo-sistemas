interface MobileMenuProps {
  isMenuOpen: boolean;
  menuItems: { title: string; anchor: string }[];
}

export default function MobileMenu({ isMenuOpen, menuItems }: MobileMenuProps) {
  return (
    <div
      className={`bg-bg fixed top-17 right-0 bottom-0 left-0 flex flex-col items-center justify-center p-6 transition-all ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <ul className="font-family-display mb-10 flex flex-col items-center gap-10 text-2xl font-bold">
        {menuItems.map((item) => (
          <li key={item.anchor}>
            <a href={item.anchor}>{item.title}</a>
          </li>
        ))}
      </ul>
      <a
        className="bg-accent font-family-display shadow-accent rounded-lg px-6 py-3 text-2xl font-bold"
        href="#contato"
      >
        Falar com a Arkeo
      </a>
    </div>
  );
}
