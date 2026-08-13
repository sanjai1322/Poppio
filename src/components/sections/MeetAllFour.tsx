"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CREAM, FLAVORS } from "@/lib/flavors";
import { clusterProgress } from "@/lib/scrollState";
import { SLAM_FROM, SLAM_IN, splitForSlam } from "@/lib/slam";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Transition section: the hero's two cans tumble and multiply into a four-can
 * cluster. The ScrollTrigger here drives `clusterProgress` which the CanCluster
 * component reads every frame.
 *
 * Copy lands on the left; the cluster occupies the right of the frame.
 * Background cross-fades from Mango orange (#E8480F) → Dragon cyan (#06B6D4).
 */
export default function MeetAllFour() {
  const root = useRef<HTMLElement>(null!);

  useGSAP(
    () => {
      // The transition ScrollTrigger: scrubs clusterProgress from 0 → 1.
      // Starts when the hero hits the top of viewport, ends when this
      // section is centred — giving ~150vh+ of scroll for the tumble.
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "center center",
        scrub: 1,
        onUpdate: (self) => {
          clusterProgress.current = self.progress;
        },
      });

      // Background cross-fade: Mango → Cream → Dragon cyan across the same range.
      // Look up #bg directly, not through scoped selectors.
      //
      // Routed through cream on the way: orange and cyan are near-opposites,
      // so a direct RGB blend passes through dead purple-grey at the halfway
      // point — cream is a neutral palette colour that avoids this entirely.
      const bg = document.getElementById("bg");
      if (bg) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top bottom",
              end: "center center",
              scrub: 1,
            },
          })
          .fromTo(
            bg,
            { backgroundColor: FLAVORS[0].color },
            { backgroundColor: CREAM, ease: "none", duration: 1 },
          )
          .to(bg, {
            backgroundColor: FLAVORS[3].color,
            ease: "none",
            duration: 1,
          });
      }

      // Slam the headline in when the section's sticky content is visible
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.current.querySelector("h2");
        if (heading) {
          const split = splitForSlam(heading);
          gsap.fromTo(split.lines, SLAM_FROM, {
            ...SLAM_IN,
            scrollTrigger: { trigger: root.current, start: "top 40%" },
          });
        }

        gsap.from("[data-cluster-in]", {
          y: 30,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 35%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      id="meet-all-four"
      ref={root}
      className="relative h-[200vh]"
    >
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-7xl px-6 md:px-10">
          {/* Copy block — left side, the cluster fills the right in 3D */}
          <div className="md:w-[45%]">
            <p
              data-cluster-in
              className="text-[0.6rem] uppercase tracking-[0.4em] text-cream/40"
            >
              The lineup
            </p>

            <h2 className="wordmark mt-5 text-[clamp(2.25rem,6vw,5rem)] leading-[0.85] text-cream">
              Meet all four
            </h2>

            <p
              data-cluster-in
              className="mt-7 max-w-md text-base leading-relaxed text-cream/80 md:text-lg"
            >
              Four island flavours, one honest recipe. 3g of plant prebiotic
              fibre in every can, no artificial sweeteners, nothing you need a
              chemistry degree to pronounce.
            </p>

            <a
              data-cluster-in
              href="#flavours"
              className="mt-10 inline-block rounded-full bg-cream px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-transform duration-300 hover:scale-105"
            >
              Explore flavours
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
