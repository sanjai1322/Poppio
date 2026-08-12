"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS, type FlavorId } from "@/lib/flavors";
import { useActiveFlavor, useFlavorSectionActive } from "@/lib/flavorStore";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Map each flavour to its PNG in public/fruits/. */
const FRUIT_PNG: Record<FlavorId, string> = {
  mango: "/fruits/mango.png",
  guava: "/fruits/guava.png",
  pineapple: "/fruits/pineapple.png",
  dragon: "/fruits/dragonfruit.png",
};

/**
 * Two placement slots per flavour — left side and lower-right — positioned in
 * the negative space around the can, avoiding the headline block and the can
 * itself. Each slot has a unique base rotation and scale so the two copies
 * don't look identical.
 *
 * Desktop shows both; mobile shows only the first slot.
 */
const SLOTS = [
  {
    // Upper-left, behind the can's left shoulder
    className: "left-[2%] top-[6%]",
    height: "55vh",
    rotation: -6,
    scale: 1.05,
    parallaxY: 25,
  },
  {
    // Lower-right, below and behind the can
    className: "right-[4%] bottom-[4%]",
    height: "45vh",
    rotation: 7,
    scale: 0.92,
    parallaxY: -18,
  },
];

/**
 * Full-viewport fruit illustration backdrop. Sits at z-5: above the colour
 * plate (z-0), below the shared canvas (z-10). Lives outside <main> so it
 * can occupy that layer; reads the active flavour from the store.
 *
 * Each section shows 2 instances of that flavour's fruit PNG (1 on mobile)
 * with scroll-tied parallax drift at a different rate than the can rotation.
 */
export default function FlavorBackdrop() {
  const root = useRef<HTMLDivElement>(null!);
  const active = useActiveFlavor();
  const visible = useFlavorSectionActive();
  const { isMobile, reducedMotion } = usePerfTier();
  const slotCount = isMobile ? 1 : 2;

  useGSAP(
    () => {
      const section = document.getElementById("flavours");
      if (!section) return;

      // Global parallax on the entire layer — counter-scrolls slightly so
      // the fruit never tracks the page one-to-one.
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

      // Per-instance parallax drift — each fruit image moves at its own
      // rate relative to scroll progress. Disabled on mobile to save
      // scroll-tied recalculation cost.
      if (!isMobile && !reducedMotion) {
        gsap.utils
          .toArray<HTMLElement>("[data-fruit-img]")
          .forEach((el) => {
            const drift = parseFloat(el.dataset.parallaxY ?? "0");
            gsap.fromTo(
              el,
              { y: -drift },
              {
                y: drift,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: "bottom bottom",
                  scrub: true,
                },
              },
            );
          });
      }
    },
    { scope: root, dependencies: [isMobile, reducedMotion] },
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

          {/* Fruit PNG illustrations */}
          {SLOTS.slice(0, slotCount).map((slot, slotIdx) => (
            <div
              key={slotIdx}
              data-fruit-img
              data-parallax-y={slot.parallaxY}
              className={`absolute ${slot.className}`}
              style={{
                opacity: isMobile ? 0.08 : 0.15,
                transform: `rotate(${slot.rotation}deg) scale(${slot.scale})`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FRUIT_PNG[flavor.id]}
                alt=""
                draggable={false}
                style={{ height: slot.height, width: "auto" }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
