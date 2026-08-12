"use client";

import { Suspense, useRef, useState } from "react";
import { View } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText } from "gsap/SplitText";
import FlavorScrollScene from "@/components/canvas/FlavorScrollScene";
import { CREAM, FLAVORS, INK } from "@/lib/flavors";
import { flavorProgress } from "@/lib/scrollState";
import { activeFlavorStore, flavorSectionStore } from "@/lib/flavorStore";
import { SLAM_FROM, SLAM_IN, SLAM_OUT, splitForSlam } from "@/lib/slam";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BEATS = FLAVORS.length;

export default function FlavorScroll() {
  const root = useRef<HTMLElement>(null!);
  const splits = useRef<SplitText[]>([]);
  const previous = useRef(0);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useGSAP(
    () => {
      const articles = gsap.utils.toArray<HTMLElement>("[data-flavor-name]");
      // Looked up directly: selector strings inside useGSAP are scoped to the
      // section, and the colour plate is a sibling of it.
      const bg = document.getElementById("bg");
      const nav = document.getElementById("site-nav");

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

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onToggle: (self) => flavorSectionStore.set(self.isActive),
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

        // Cream fails contrast on Pineapple Lime, so the bar flips to ink on
        // the way in and back to cream on the way out — on the colour timeline,
        // so it rides the same cross-fade and reverses with it.
        if (nav) {
          const wantsInk = flavor.id === "pineapple";
          const leavingInk = FLAVORS[i - 1].id === "pineapple";
          if (wantsInk || leavingInk) {
            timeline.to(
              nav,
              { color: wantsInk ? INK : CREAM, duration: 0.4, ease: "none" },
              at,
            );
          }
        }
      });
    },
    { scope: root },
  );

  // Names are an event, not a scrub: each beat change slams the outgoing name
  // out and the incoming one in, rather than smearing both across the scroll.
  useGSAP(
    () => {
      const from = previous.current;
      if (from === active) return;
      previous.current = active;

      const articles = gsap.utils.toArray<HTMLElement>("[data-flavor-name]");
      const outgoing = splits.current[from];
      const incoming = splits.current[active];
      if (!outgoing || !incoming) return;

      gsap.to(outgoing.lines, SLAM_OUT);
      gsap.to(articles[from], { autoAlpha: 0, duration: 0.3, delay: 0.25 });

      gsap.set(articles[active], { autoAlpha: 1 });
      gsap.fromTo(incoming.lines, SLAM_FROM, SLAM_IN);
      gsap.fromTo(
        articles[active].querySelectorAll("[data-sub]"),
        { y: 20, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.06,
          ease: "power3.out",
          delay: 0.12,
        },
      );
    },
    { dependencies: [active], scope: root },
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
              <p
                data-sub
                className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/60"
              >
                {String(i + 1).padStart(2, "0")} /{" "}
                {String(BEATS).padStart(2, "0")}
              </p>
              <h2 className="wordmark mt-3 text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.85] text-cream">
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
          ))}
        </div>
      </div>
    </section>
  );
}
