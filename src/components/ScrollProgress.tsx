"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS } from "@/lib/flavors";
import { beatScrollY, scrollToBeat } from "@/lib/flavorBeats";
import { useActiveFlavor, useFlavorSectionActive } from "@/lib/flavorStore";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Scroll rail with a stop per flavour.
 *
 * The ticks are real buttons, not decoration: they jump to that flavour's rest
 * point, which turns the four-beat structure from something you have to scroll
 * far enough to discover into something you can read and operate at a glance.
 */
export default function ScrollProgress() {
  const root = useRef<HTMLDivElement>(null!);
  const fill = useRef<HTMLDivElement>(null!);
  const [ticks, setTicks] = useState<number[]>([]);
  const active = useActiveFlavor();
  const inFlavours = useFlavorSectionActive();

  useGSAP(
    () => {
      // Measured, not guessed: recompute whenever ScrollTrigger re-measures,
      // since every section height is viewport-relative.
      const measure = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        setTicks(FLAVORS.map((_, i) => beatScrollY(i) / max));
      };

      measure();
      ScrollTrigger.addEventListener("refresh", measure);

      gsap.fromTo(
        fill.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        },
      );

      return () => ScrollTrigger.removeEventListener("refresh", measure);
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="pointer-events-none fixed right-4 top-0 z-40 hidden h-screen w-px md:block"
    >
      <div className="absolute inset-0 bg-cream/20" />
      <div
        ref={fill}
        className="absolute inset-0 origin-top bg-cream"
        style={{ transform: "scaleY(0)" }}
      />

      {ticks.map((tick, i) => {
        const isActive = inFlavours && i === active;
        return (
          <button
            key={i}
            type="button"
            onClick={() => scrollToBeat(i)}
            title={FLAVORS[i].name}
            aria-label={"Jump to " + FLAVORS[i].name}
            className="group pointer-events-auto absolute right-0 flex h-6 w-6 -translate-y-1/2 items-center justify-end"
            style={{ top: tick * 100 + "%" }}
          >
            <span
              className="block h-px transition-all duration-300 ease-out group-hover:w-5"
              style={{
                width: isActive ? "1.25rem" : "0.625rem",
                backgroundColor: isActive ? FLAVORS[i].color : undefined,
                opacity: isActive ? 1 : 0.5,
              }}
            />
            {/* Name only on hover — the rail stays a hairline until asked. */}
            <span className="pointer-events-none absolute right-8 whitespace-nowrap text-[0.6rem] uppercase tracking-[0.2em] text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {FLAVORS[i].name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
