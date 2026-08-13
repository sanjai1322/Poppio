"use client";

import { Suspense, useRef, useState } from "react";
import { View } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS } from "@/lib/flavors";
import { scrollToBeat } from "@/lib/flavorBeats";
import { SLAM_FROM, SLAM_IN, splitForSlam } from "@/lib/slam";
import PanelStage from "@/components/canvas/PanelStage";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The four flavours as full-height colour panels rather than cards.
 *
 * The previous version put a washed-out fruit cutout behind every card, which
 * is the cheapest-looking move available: a stock illustration at low opacity
 * doing the job that colour and type should do. The panels carry the brand
 * colour at full strength instead, and the only graphic element is the
 * typography.
 *
 * Hovering or focusing a panel expands it and reveals the rest of its copy —
 * so the section is something you operate, not a static grid you read.
 */
export default function FlavorGrid() {
  const root = useRef<HTMLElement>(null!);
  const [open, setOpen] = useState<number | null>(null);
  const { isMobile } = usePerfTier();

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.current.querySelector("h2");
        if (heading) {
          const split = splitForSlam(heading);
          gsap.fromTo(split.lines, SLAM_FROM, {
            ...SLAM_IN,
            scrollTrigger: { trigger: heading, start: "top 85%" },
          });
        }

        gsap.from("[data-panel]", {
          yPercent: 12,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-panels]", start: "top 80%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="pick" ref={root} className="relative">
      <div className="mx-auto max-w-7xl px-6 pt-24 md:px-10 md:pt-32">
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.4em] text-cream/40">
          All four
        </p>
        <h2 className="wordmark mt-5 max-w-2xl text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] text-cream">
          Pick a side
        </h2>
      </div>

      {/* Full-bleed: the colour should run to the edges of the screen. */}
      <div className="relative mt-14 md:mt-20">
        {/* Colour and cans are drawn by the shared canvas, tracked to this row.
            The buttons above are transparent — they carry type and hit areas
            only, because an opaque background here would cover the canvas. */}
        {!isMobile && (
          <View className="pointer-events-none absolute inset-0">
            <Suspense fallback={null}>
              <PanelStage open={open} />
            </Suspense>
          </View>
        )}

        <div
          data-panels
          className="relative flex h-[70vh] min-h-[520px] w-full flex-col md:h-[78vh] md:flex-row"
          onMouseLeave={() => setOpen(null)}
        >
        {FLAVORS.map((flavor, i) => {
          const isOpen = open === i;
          const isQuiet = open !== null && !isOpen;

          return (
            <button
              key={flavor.id}
              data-panel
              type="button"
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              onClick={() => scrollToBeat(i)}
              aria-label={"Jump to " + flavor.name}
              className="group relative flex-1 overflow-hidden text-left outline-none transition-opacity duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                // flexGrow is driven imperatively by PanelStage so the DOM and
                // the colour plane share one number. Setting it here too would
                // have React overwrite it on every render.
                opacity: isQuiet ? 0.75 : 1,
                // Mobile stacks the panels and skips the 3D stage entirely, so
                // the colour has to come from CSS there.
                backgroundColor: isMobile ? flavor.color : undefined,
              }}
            >
              {/* Hairline separators, so four solid colours read as one system
                  rather than four blocks jammed together. */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 hidden w-px bg-ink/15 md:block"
              />

              <span className="relative flex h-full flex-col justify-between p-7 md:p-8">
                <span className="flex items-baseline gap-3">
                  <span className="text-[0.6rem] font-medium uppercase tracking-[0.4em] text-cream/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden
                    className="h-px flex-1 origin-left bg-cream/30 transition-transform duration-700 ease-out"
                    style={{ transform: isOpen ? "scaleX(1)" : "scaleX(0.4)" }}
                  />
                </span>

                <span className="block">
                  {/* Type scales with the panel. At a fixed size the name
                      overruns a narrowed panel and gets clipped mid-word. */}
                  <span
                    className="wordmark block leading-[0.88] text-cream transition-[font-size] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      fontSize: isQuiet
                        ? "clamp(1.1rem,1.7vw,1.6rem)"
                        : "clamp(1.6rem,2.9vw,2.75rem)",
                    }}
                  >
                    {flavor.name}
                  </span>

                  {/* Detail is held back until a panel is chosen — that reveal
                      is what makes the row feel like an instrument. */}
                  <span
                    className="mt-4 block overflow-hidden transition-[max-height,opacity] duration-[700ms] ease-out"
                    style={{
                      maxHeight: isOpen ? "12rem" : "0rem",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <span className="block text-[0.65rem] font-medium uppercase tracking-[0.3em] text-cream/80">
                      {flavor.notes}
                    </span>
                    <span className="mt-3 block max-w-xs text-lg leading-snug text-cream">
                      {flavor.tagline}
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-cream">
                      See it
                      <span aria-hidden>&rarr;</span>
                    </span>
                  </span>
                </span>
              </span>
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
