import { CREAM } from "@/lib/flavors";

const LINKS = [
  { label: "Flavours", href: "#flavours" },
  { label: "Why", href: "#why" },
  { label: "Stockists", href: "#footer" },
];

/**
 * Colour is set once on the header and inherited by the wordmark and links, so
 * a single tween recolours the whole bar. The flavour timeline drives it to
 * ink over Pineapple Lime, where cream fails contrast.
 */
export default function Nav() {
  return (
    <header
      id="site-nav"
      style={{ color: CREAM }}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-5 md:px-10"
    >
      {/* POPPIO Waving Liquid Logo */}
      <a
        href="#top"
        className="group relative flex items-center transition-transform duration-300 hover:scale-[1.04] focus:outline-none"
        aria-label="POPPIO Home"
      >
        <svg
          viewBox="0 0 160 40"
          className="h-8 w-auto overflow-visible select-none md:h-9"
          aria-hidden="true"
        >
          <defs>
            {/* Clip path for the POPPIO wordmark typography */}
            <clipPath id="poppio-wave-clip">
              <text
                x="0"
                y="31"
                className="wordmark"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "35px",
                  letterSpacing: "-0.03em",
                }}
              >
                POPPIO
              </text>
            </clipPath>
          </defs>

          {/* Ghost base outline / background fill */}
          <text
            x="0"
            y="31"
            className="wordmark opacity-30 transition-opacity duration-300 group-hover:opacity-45"
            fill="currentColor"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "35px",
              letterSpacing: "-0.03em",
            }}
          >
            POPPIO
          </text>

          {/* Masked Animated Wave Layer */}
          <g clipPath="url(#poppio-wave-clip)">
            {/* Base liquid level */}
            <rect x="0" y="0" width="160" height="40" fill="currentColor" opacity="0.25" />

            {/* Primary moving fluid wave */}
            <g className="animate-wave-flow" style={{ width: "320px" }}>
              <path
                d="M 0 16 Q 40 8 80 16 T 160 16 T 240 16 T 320 16 L 320 40 L 0 40 Z"
                fill="currentColor"
                opacity="0.9"
              />
            </g>

            {/* Secondary counter wave with shimmer effect */}
            <g className="animate-wave-flow-reverse" style={{ width: "320px" }}>
              <path
                d="M 0 19 Q 40 25 80 19 T 160 19 T 240 19 T 320 19 L 320 40 L 0 40 Z"
                fill="currentColor"
                opacity="0.65"
              />
            </g>

            {/* Sparkling effervescent soda bubbles rising inside letters */}
            <circle cx="24" cy="22" r="1.5" fill="currentColor" className="animate-pulse-glow" />
            <circle cx="56" cy="27" r="1.2" fill="currentColor" className="animate-pulse-glow" style={{ animationDelay: "0.8s" }} />
            <circle cx="92" cy="20" r="1.7" fill="currentColor" className="animate-pulse-glow" style={{ animationDelay: "1.6s" }} />
            <circle cx="126" cy="25" r="1.3" fill="currentColor" className="animate-pulse-glow" style={{ animationDelay: "0.4s" }} />
            <circle cx="148" cy="22" r="1.4" fill="currentColor" className="animate-pulse-glow" style={{ animationDelay: "1.2s" }} />
          </g>
        </svg>
      </a>

      <nav className="flex items-center gap-3 sm:gap-8 text-[10px] sm:text-xs font-medium uppercase tracking-wider sm:tracking-[0.2em]">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="transition-opacity hover:opacity-60"
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
