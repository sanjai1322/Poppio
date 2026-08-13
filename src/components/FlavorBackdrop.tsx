"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS } from "@/lib/flavors";
import { useActiveFlavor, useFlavorSectionActive } from "@/lib/flavorStore";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The backdrop behind the flavour scroll. Sits at z-5: above the colour plate
 * (z-0), below the shared canvas (z-10). Lives outside <main> so it can occupy
 * that layer, and reads the active flavour from the store.
 *
 * Deliberately typographic only. The fruit illustrations that used to live here
 * stacked with the ones in the flavour copy and the ones on the grid cards —
 * three illustration layers competing with the product shot, which is the thing
 * the section is actually about. The oversized numeral gives the same sense of
 * depth without adding another drawing to read.
 */
export default function FlavorBackdrop() {
  const root = useRef<HTMLDivElement>(null!);
  const active = useActiveFlavor();
  const visible = useFlavorSectionActive();

  useGSAP(
    () => {
      // Counter-scroll, so the numeral never tracks the page one-to-one.
      const section = document.getElementById("flavours");
      if (!section) return;

      gsap.fromTo(
        root.current,
        { yPercent: 5 },
        {
          yPercent: -5,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {FLAVORS.map((flavor, index) => (
        <div
          key={flavor.id}
          className="absolute inset-0 transition-opacity duration-[500ms] ease-out"
          style={{ opacity: index === active ? 1 : 0 }}
        >
          {/* Oversized beat number, bleeding off the right edge. */}
          <span className="wordmark absolute right-[-9vw] top-1/2 -translate-y-1/2 text-[54vh] leading-none text-cream/[0.07]">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}
