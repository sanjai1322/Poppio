const LINKS = [
  { label: "Stockists", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Wholesale", href: "#" },
  { label: "Say hi", href: "#" },
];

export default function Footer() {
  return (
    <footer id="footer" className="relative bg-ink px-6 pb-10 pt-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap gap-x-10 gap-y-4 border-b border-cream/15 pb-12 text-xs uppercase tracking-[0.2em] text-cream/70">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-cream"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p
          aria-hidden
          className="wordmark mt-12 w-full text-[15.5vw] leading-[0.8] text-cream"
        >
          POPPIO
        </p>

        <p className="mt-8 text-[0.7rem] uppercase tracking-[0.2em] text-cream/40">
          © {new Date().getFullYear()} POPPIO — Drink responsibly-ish.
        </p>
      </div>
    </footer>
  );
}
