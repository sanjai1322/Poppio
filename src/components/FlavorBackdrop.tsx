"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS } from "@/lib/flavors";
import { FRUIT_BY_FLAVOR } from "@/components/FruitShapes";
import { useActiveFlavor, useFlavorSectionActive } from "@/lib/flavorStore";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Where each fruit sits. Third slot is dropped on small screens. */
const SLOTS = [
  { className: "left-[3%] top-[4%] w-[30vmin]", drift: { x: 26, y: 22, r: -8 } },
  { className: "bottom-[2%] left-[19%] w-[34vmin]", drift: { x: 22, y: -26, r: 10 } },
  { className: "right-[1%] top-[6%] w-[24vmin]", drift: { x: -18, y: 30, r: 6 } },
];

/**
 * Sits at z-5: above the colour plate, below the canvas. It has to live
 * outside <main> to get there, so it reads the live flavour from the store
 * rather than from props.
 */
export default function FlavorBackdrop() {
  const root = useRef<HTMLDivElement>(null!);
  const active = useActiveFlavor();
  const visible = useFlavorSectionActive();
  const { isMobile, reducedMotion } = usePerfTier();
  const slotCount = isMobile ? 2 : 3;

  useGSAP(
    () => {
      // Parallax: the layer counter-scrolls a little, so the fruit never
      // tracks the page one-to-one.
      const section = document.getElementById("flavours");
      if (section) {
        gsap.fromTo(
          root.current,
          { yPercent: 6 },
          {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-fruit]").forEach((fruit) => {
          const drift = JSON.parse(fruit.dataset.drift ?? "{}");
          gsap.to(fruit, {
            x: drift.x,
            y: drift.y,
            rotation: drift.r,
            duration: gsap.utils.random(14, 22),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });
      });
    },
    { scope: root, dependencies: [slotCount] },
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
          className="absolute inset-0 transition-opacity duration-[600ms] ease-out"
          style={{ opacity: index === active ? 1 : 0 }}
        >
          {/* Oversized beat number, bleeding off the right edge. */}
          <span className="wordmark absolute right-[-9vw] top-1/2 -translate-y-1/2 text-[54vh] leading-none text-cream/[0.08]">
            {String(index + 1).padStart(2, "0")}
          </span>

          {FRUIT_BY_FLAVOR[flavor.id]
            .slice(0, slotCount)
            .map((Fruit, slot) => (
              <div
                key={slot}
                data-fruit
                data-drift={JSON.stringify(SLOTS[slot].drift)}
                className={`absolute text-cream ${SLOTS[slot].className}`}
                style={{ opacity: reducedMotion ? 0.12 : 0.15 }}
              >
                <Fruit className="h-auto w-full" />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
