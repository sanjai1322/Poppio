"use client";

import { useRef } from "react";

const LINKS = [
  { label: "Flavours", href: "#flavours" },
  { label: "Why it works", href: "#why" },
  { label: "Stockists", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Wholesale", href: "#" },
  { label: "Say hi", href: "#" },
];

export default function Footer() {
  const root = useRef<HTMLElement>(null!);

  return (
    <footer
      id="footer"
      ref={root}
      className="relative bg-ink px-6 pb-12 pt-24 md:px-10 md:pb-16 md:pt-32"
    >
      <div className="mx-auto max-w-7xl">
        <nav className="grid grid-cols-2 md:flex md:flex-wrap gap-x-6 md:gap-x-10 gap-y-6 md:gap-y-4 border-b border-cream/15 pb-12 text-xs uppercase tracking-[0.2em] text-cream/70">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors duration-200 hover:text-cream"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* POPPIO Large Waving Liquid Wordmark */}
        <div className="group mt-12 w-full select-none md:mt-16">
          <svg
            viewBox="0 0 1000 220"
            className="w-full h-auto overflow-visible"
            aria-label="POPPIO"
            role="img"
          >
            <defs>
              {/* Clip path for the giant POPPIO wordmark typography */}
              <clipPath id="poppio-footer-wave-clip">
                <text
                  x="50%"
                  y="180"
                  textAnchor="middle"
                  className="wordmark"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "220px",
                    letterSpacing: "-0.035em",
                  }}
                >
                  POPPIO
                </text>
              </clipPath>
            </defs>

            {/* Ghost base outline / background fill */}
            <text
              x="50%"
              y="180"
              textAnchor="middle"
              className="wordmark transition-opacity duration-300 opacity-25 group-hover:opacity-40"
              fill="#FFF4E0"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "220px",
                letterSpacing: "-0.035em",
              }}
            >
              POPPIO
            </text>

            {/* Masked Animated Wave Layer */}
            <g clipPath="url(#poppio-footer-wave-clip)">
              {/* Base liquid level */}
              <rect x="0" y="0" width="1000" height="220" fill="#FFF4E0" opacity="0.22" />

              {/* Primary moving fluid wave */}
              <g className="animate-wave-flow" style={{ width: "2000px" }}>
                <path
                  d="M 0 95 Q 250 50 500 95 T 1000 95 T 1500 95 T 2000 95 L 2000 220 L 0 220 Z"
                  fill="#FFF4E0"
                  opacity="0.9"
                />
              </g>

              {/* Secondary counter wave with shimmer effect */}
              <g className="animate-wave-flow-reverse" style={{ width: "2000px" }}>
                <path
                  d="M 0 115 Q 250 160 500 115 T 1000 115 T 1500 115 T 2000 115 L 2000 220 L 0 220 Z"
                  fill="#FFF4E0"
                  opacity="0.65"
                />
              </g>

              {/* Sparkling effervescent soda bubbles rising inside letters */}
              <circle cx="155" cy="135" r="4.5" fill="#FFF4E0" className="animate-pulse-glow" />
              <circle cx="310" cy="160" r="3.8" fill="#FFF4E0" className="animate-pulse-glow" style={{ animationDelay: "0.7s" }} />
              <circle cx="475" cy="120" r="5.2" fill="#FFF4E0" className="animate-pulse-glow" style={{ animationDelay: "1.4s" }} />
              <circle cx="645" cy="155" r="4.2" fill="#FFF4E0" className="animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
              <circle cx="815" cy="130" r="4.8" fill="#FFF4E0" className="animate-pulse-glow" style={{ animationDelay: "1.1s" }} />
              <circle cx="910" cy="140" r="3.6" fill="#FFF4E0" className="animate-pulse-glow" style={{ animationDelay: "1.8s" }} />
            </g>
          </svg>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-cream/10 pt-6 text-[0.7rem] uppercase tracking-[0.2em] text-cream/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} POPPIO — Drink responsibly-ish.</p>
          <p>Prebiotic Tropical Soda • 3g Fibre • 40 Cal</p>
        </div>
      </div>
    </footer>
  );
}
