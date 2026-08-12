const LINKS = [
  { label: "Flavours", href: "#flavours" },
  { label: "Why", href: "#why" },
  { label: "Stockists", href: "#footer" },
];

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-10">
      <a href="#top" className="wordmark text-2xl text-cream md:text-3xl">
        POPPIO
      </a>
      <nav className="flex gap-6 text-xs uppercase tracking-[0.2em] text-cream">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hidden transition-opacity hover:opacity-60 sm:block"
          >
            {link.label}
          </a>
        ))}
        <a href="#footer" className="transition-opacity hover:opacity-60">
          Find us
        </a>
      </nav>
    </header>
  );
}
