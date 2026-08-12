"use client";

import { Suspense, useRef, useState } from "react";
import { View } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FlavorScrollScene from "@/components/canvas/FlavorScrollScene";
import { FLAVORS } from "@/lib/flavors";
import { flavorProgress } from "@/lib/scrollState";
import { activeFlavorStore, flavorSectionStore } from "@/lib/flavorStore";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BEATS = FLAVORS.length;

export default function FlavorScroll() {
  const root = useRef<HTMLElement>(null!);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useGSAP(
    () => {
      const names = gsap.utils.toArray<HTMLElement>("[data-flavor-name]");
      // Looked up directly: selector strings inside useGSAP are scoped to the
      // section, and the colour plate is a sibling of it.
      const bg = document.getElementById("bg");

      gsap.set(names, { autoAlpha: 0, y: 28 });
      gsap.set(names[0], { autoAlpha: 1, y: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onToggle: (self) => flavorSectionStore.set(self.isActive),
          onUpdate: (self) => {
            flavorProgress.current = self.progress;
            // onToggle alone misses a scroll that lands inside the section in
            // one frame (anchor jump, restored position), leaving the backdrop
            // stuck invisible.
            flavorSectionStore.set(true);

            const index = Math.min(
              BEATS - 1,
              Math.floor(self.progress * BEATS),
            );
            if (index !== activeRef.current) {
              activeRef.current = index;
              setActive(index);
              activeFlavorStore.set(index);
            }
          },
        },
      });

      // Pad the timeline to one time unit per beat so positions below line up
      // with scroll progress (progress 0.5 === position 2 with four flavours).
      timeline.to({}, { duration: BEATS });

      FLAVORS.forEach((flavor, i) => {
        if (i === 0) return;
        const at = i - 0.2;

        if (bg) {
          timeline.to(
            bg,
            { backgroundColor: flavor.color, duration: 0.4, ease: "none" },
            at,
          );
        }
        timeline.to(
          names[i - 1],
          { autoAlpha: 0, y: -28, duration: 0.25, ease: "power2.in" },
          at,
        );
        timeline.to(
          names[i],
          { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" },
          at + 0.15,
        );
      });
    },
    { scope: root },
  );

  return (
    // One viewport of scroll per beat, plus one for the sticky child itself —
    // a 400vh section would only leave 300vh of *stuck* scroll for 4 beats.
    <section id="flavours" ref={root} className="relative h-[500vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <View className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <FlavorScrollScene flavor={active} />
          </Suspense>
        </View>

        <div className="relative mx-auto h-full max-w-7xl px-6 md:px-10">
          <p className="absolute right-6 top-28 text-[0.7rem] uppercase tracking-[0.3em] text-cream/60 md:right-10">
            The lineup
          </p>

          {/* Copy holds the left third, vertically centred; the can owns the
              right of the frame and the numeral bleeds off behind it. */}
          {FLAVORS.map((flavor, i) => (
            <article
              key={flavor.id}
              data-flavor-name
              className="absolute bottom-16 left-6 right-6 md:bottom-auto md:left-10 md:right-auto md:top-1/2 md:w-[38%] md:-translate-y-1/2"
            >
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/60">
                {String(i + 1).padStart(2, "0")} /{" "}
                {String(BEATS).padStart(2, "0")}
              </p>
              <h2 className="wordmark mt-3 text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.85] text-cream">
                {flavor.name}
              </h2>
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-cream/70">
                {flavor.notes}
              </p>
              <p className="mt-2 max-w-sm text-lg text-cream/90">
                {flavor.tagline}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
