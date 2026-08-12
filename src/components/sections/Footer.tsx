"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

const LINKS = [
  { label: "Stockists", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Wholesale", href: "#" },
  { label: "Say hi", href: "#" },
];

const WORDMARK = "POPPIO".split("");

export default function Footer() {
  const root = useRef<HTMLElement>(null!);

  const { contextSafe } = useGSAP({ scope: root });

  // Stagger down the letters and back — a wave, not a bounce per letter.
  const wave = contextSafe(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.to("[data-letter]", {
      y: -18,
      duration: 0.34,
      ease: "power2.out",
      stagger: { each: 0.05, yoyo: true, repeat: 1 },
    });
  });

  return (
    <footer
      id="footer"
      ref={root}
      className="relative bg-ink px-6 pb-10 pt-24 md:px-10"
    >
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
          aria-label="POPPIO"
          onPointerEnter={wave}
          className="wordmark mt-12 flex w-full cursor-default text-[15.5vw] leading-[0.8] text-cream"
        >
          {WORDMARK.map((letter, i) => (
            <span key={i} data-letter aria-hidden className="inline-block">
              {letter}
            </span>
          ))}
        </p>

        <p className="mt-8 text-[0.7rem] uppercase tracking-[0.2em] text-cream/40">
          © {new Date().getFullYear()} POPPIO — Drink responsibly-ish.
        </p>
      </div>
    </footer>
  );
}
