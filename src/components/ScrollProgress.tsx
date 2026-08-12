"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS } from "@/lib/flavors";
import { beatScrollY } from "@/lib/flavorBeats";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function ScrollProgress() {
  const root = useRef<HTMLDivElement>(null!);
  const fill = useRef<HTMLDivElement>(null!);
  const [ticks, setTicks] = useState<number[]>([]);

  useGSAP(
    () => {
      // Ticks are measured, not guessed: recompute whenever ScrollTrigger
      // re-measures, since section heights are viewport-relative.
      const measure = () => {
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
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
      aria-hidden
      className="pointer-events-none fixed right-3 top-0 z-40 hidden h-screen w-px md:block"
    >
      <div className="absolute inset-0 bg-cream/20" />
      <div
        ref={fill}
        className="absolute inset-0 origin-top bg-cream"
        style={{ transform: "scaleY(0)" }}
      />

      {ticks.map((tick, i) => (
        <span
          key={i}
          className="absolute -left-1 h-px w-2.5 bg-cream/50"
          style={{ top: `${tick * 100}%` }}
        />
      ))}
    </div>
  );
}
