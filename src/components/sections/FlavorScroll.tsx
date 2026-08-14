"use client";

import { Suspense, useRef, useState } from "react";
import { View } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText } from "gsap/SplitText";
import FlavorScrollScene from "@/components/canvas/FlavorScrollScene";
import { CREAM, FLAVORS, INK } from "@/lib/flavors";
import { cameraDolly, canSpin, flavorProgress } from "@/lib/scrollState";
import { activeFlavorStore, flavorSectionStore } from "@/lib/flavorStore";
import { SLAM_FROM, SLAM_IN, SLAM_OUT, splitForSlam } from "@/lib/slam";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BEATS = FLAVORS.length;

export default function FlavorScroll() {
  const root = useRef<HTMLElement>(null!);
  const splits = useRef<SplitText[]>([]);
  const previous = useRef(0);
  const [active, setActive] = useState(0);
  // What the can is actually wearing. Lags `active` by half a spin so the
  // swap lands while the label is edge-on.
  const [worn, setWorn] = useState(0);
  const activeRef = useRef(0);
  const spinTimeline = useRef<gsap.core.Timeline | null>(null);
  const { reducedMotion } = usePerfTier();

  useGSAP(
    () => {
      const articles = gsap.utils.toArray<HTMLElement>("[data-flavor-name]");
      // Looked up directly: selector strings inside useGSAP are scoped to the
      // section, and the colour plate is a sibling of it.
      splits.current = articles.map((article) =>
        splitForSlam(article.querySelector("h2")!),
      );

      articles.forEach((article, i) => {
        gsap.set(article, { autoAlpha: i === 0 ? 1 : 0 });
        gsap.set(
          splits.current[i].lines,
          i === 0 ? { yPercent: 0, autoAlpha: 1 } : SLAM_FROM,
        );
      });

      // No approach ramp any more: the skydive hands this section over with
      // the plate already on the first flavour's colour. The old ramp started
      // from dragon cyan and passed through cream, which is what produced the
      // blue flash and the mint wash before the oranges arrived.

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onToggle: (self) => flavorSectionStore.set(self.isActive),
        onEnter: () => {
          const bg = document.getElementById("bg");
          if (bg) bg.style.background = FLAVORS[activeRef.current].gradient;
          if (reducedMotion) return;
          gsap.fromTo(
            cameraDolly,
            { current: 0.55 },
            { current: 0, duration: 1.2, ease: "power2.out", overwrite: true },
          );
        },
        onEnterBack: () => {
          const bg = document.getElementById("bg");
          if (bg) bg.style.background = FLAVORS[activeRef.current].gradient;
        },
        onLeaveBack: () => {
          const bg = document.getElementById("bg");
          if (bg) bg.style.background = FLAVORS[3].gradient;
        },
        onUpdate: (self) => {
          flavorProgress.current = self.progress;
          // Mirrors the trigger every update rather than trusting onToggle:
          // a scroll that lands inside the section in one frame never fires
          // onToggle, and an unconditional true leaks the backdrop into the
          // hero on the way back up.
          flavorSectionStore.set(self.isActive);

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
      });

    },
    { scope: root },
  );

  // One event per beat. The can spins two full turns and the label swap is
  // buried at the midpoint, where it is edge-on and moving fastest, so the
  // change is never seen. Colour, nav and copy ride the same timeline, which is
  // what makes it read as a single transformation instead of a texture pop.
  useGSAP(
    () => {
      const from = previous.current;
      if (from === active) return;
      previous.current = active;

      const articles = gsap.utils.toArray<HTMLElement>("[data-flavor-name]");
      const outgoing = splits.current[from];
      const incoming = splits.current[active];
      const bg = document.getElementById("bg");
      const nav = document.getElementById("site-nav");
      const flavor = FLAVORS[active];
      const navColor = flavor.id === "pineapple" ? INK : CREAM;

      // A fast scroll can outrun the spin; drop the in-flight one and pick up
      // from wherever it stopped rather than queueing.
      spinTimeline.current?.kill();

      if (reducedMotion) {
        setWorn(active);
        articles.forEach((article, i) =>
          gsap.set(article, { autoAlpha: i === active ? 1 : 0 }),
        );
        gsap.set(incoming.lines, { yPercent: 0, autoAlpha: 1 });
        cameraDolly.current = 0;
        if (bg) bg.style.background = flavor.gradient;
        if (nav) gsap.set(nav, { color: navColor });
        return;
      }

      const SPIN = 0.5;
      const half = SPIN / 2;
      const direction = active > from ? 1 : -1;

      const timeline = gsap.timeline({
        onComplete: () => setWorn(activeRef.current),
      });
      spinTimeline.current = timeline;

      timeline.to(
        canSpin,
        {
          current: canSpin.current + direction * 2 * (Math.PI * 2),
          duration: SPIN,
          ease: "power3.inOut",
        },
        0,
      );

      // Camera pulls back as the can breaks into its spin, then eases in and
      // settles on the new label. The push-in outlasts the spin on purpose —
      // the settle is what makes a beat feel like it lands rather than stops.
      timeline
        .to(
          cameraDolly,
          { current: 0.55, duration: SPIN * 0.4, ease: "power2.out" },
          0,
        )
        .to(
          cameraDolly,
          { current: 0, duration: SPIN * 2.1, ease: "power2.out" },
          SPIN * 0.4,
        );

      timeline.call(() => setWorn(active), undefined, half);

      if (bg) {
        timeline.call(
          () => {
            bg.style.background = flavor.gradient;
          },
          undefined,
          half - 0.17,
        );
      }

      if (nav) {
        timeline.to(
          nav,
          { color: navColor, duration: 0.34, ease: "power2.inOut" },
          half - 0.17,
        );
      }

      if (outgoing) {
        timeline.to(outgoing.lines, SLAM_OUT, 0);
        timeline.to(articles[from], { autoAlpha: 0, duration: 0.2 }, 0.14);
      }

      timeline.set(articles[active], { autoAlpha: 1 }, half - 0.1);
      timeline.fromTo(incoming.lines, SLAM_FROM, SLAM_IN, half - 0.1);
      timeline.fromTo(
        articles[active].querySelectorAll("[data-sub]"),
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.04, ease: "power3.out" },
        half,
      );
    },
    { dependencies: [active, reducedMotion], scope: root },
  );

  return (
    // One viewport of scroll per beat, plus one for the sticky child itself —
    // a 400vh section would only leave 300vh of *stuck* scroll for 4 beats.
    <section id="flavours" ref={root} className="relative h-[340vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <View className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <FlavorScrollScene flavor={worn} />
          </Suspense>
        </View>

        <div className="relative mx-auto h-full max-w-7xl px-6 md:px-10">
          {/* Copy holds the left third, vertically centred; the can owns the
              right of the frame and the numeral bleeds off behind it. */}
          {FLAVORS.map((flavor, i) => {
            return (
              <article
                key={flavor.id}
                data-flavor-name
                className="absolute bottom-10 left-6 right-6 md:bottom-auto md:left-10 md:right-auto md:top-1/2 md:w-[42%] md:-translate-y-1/2"
              >

                <p
                  data-sub
                  className="text-[0.6rem] uppercase tracking-[0.4em] text-cream/90 font-medium"
                >
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {String(BEATS).padStart(2, "0")}
                </p>
                <h2 className="wordmark mt-3 text-[clamp(2.25rem,6vw,5rem)] leading-[0.85] text-cream">
                  {flavor.name}
                </h2>
                <p
                  data-sub
                  className="mt-4 text-sm uppercase tracking-[0.2em] text-cream/70"
                >
                  {flavor.notes}
                </p>
                <p data-sub className="mt-2 max-w-sm text-lg text-cream/90">
                  {flavor.tagline}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
