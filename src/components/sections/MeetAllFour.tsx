"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS } from "@/lib/flavors";
import { clusterProgress, handoffProgress } from "@/lib/scrollState";
import { SLAM_FROM, SLAM_IN, splitForSlam } from "@/lib/slam";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Section 2: "Meet all four".
 *
 * Unpinned single composition: the headline block and the cans move together
 * as ordinary page content.
 *
 * As you scroll from Hero into Section 2:
 * - clusterProgress scrubs 0 -> 1 (Hero pair multiplies and tumbles into the 4-can cluster).
 * - Section 2 rest state: copy on left, all 4 cans in cluster on right.
 *
 * As you scroll from Section 2 into Skydive:
 * - handoffProgress scrubs 0 -> 1 (copy and 3 cans scroll up and away naturally).
 * - Dragon Blue lifts out of the group, drifts toward center frame, and eases into skydive flight.
 */
export default function MeetAllFour() {
  const root = useRef<HTMLElement>(null!);

  useGSAP(
    () => {
      // 1. Entrance ScrollTrigger: scrubs clusterProgress 0 -> 1 (Hero -> Cluster rest)
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "center center",
        scrub: 1,
        onUpdate: (self) => {
          clusterProgress.current = self.progress;
        },
      });

      // 2. Exit / Handoff ScrollTrigger: scrubs handoffProgress 0 -> 1 (Cluster rest -> Skydive)
      ScrollTrigger.create({
        trigger: root.current,
        start: "center center",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          handoffProgress.current = self.progress;
        },
      });

      // Background cross-fade: Mango orange -> Dragon cyan immediately on enter
      const bg = document.getElementById("bg");
      if (bg) {
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "center center",
          onEnter: () => {
            bg.style.background = FLAVORS[3].gradient;
          },
          onLeaveBack: () => {
            bg.style.background = FLAVORS[0].gradient;
          },
        });
      }

      // Slam headline in when section enters
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.current.querySelector("h2");
        if (heading) {
          const split = splitForSlam(heading);
          gsap.fromTo(split.lines, SLAM_FROM, {
            ...SLAM_IN,
            scrollTrigger: { trigger: root.current, start: "top 60%" },
          });
        }

        gsap.from("[data-cluster-in]", {
          y: 30,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 55%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      id="meet-all-four"
      ref={root}
      className="relative min-h-[130vh] flex flex-col justify-start md:justify-center overflow-hidden px-6 pt-24 pb-36 md:px-10 md:py-36 text-center md:text-left"
    >
      <div className="relative mx-auto w-full max-w-7xl">
        {/* Copy block — centered on mobile, left-aligned on desktop */}
        <div className="mx-auto md:mx-0 max-w-lg md:max-w-none md:w-[45%]">
          <p
            data-cluster-in
            className="text-[0.6rem] uppercase tracking-[0.4em] text-cream/40"
          >
            The lineup
          </p>

          <h2 className="wordmark mt-4 md:mt-5 text-[clamp(2.25rem,6vw,5rem)] leading-[0.85] text-cream">
            Meet all four
          </h2>

          <p
            data-cluster-in
            className="mt-6 md:mt-7 max-w-md mx-auto md:mx-0 text-sm sm:text-base leading-relaxed text-cream/80 md:text-lg"
          >
            Four island flavours, one honest recipe. 3g of plant prebiotic
            fibre in every can, no artificial sweeteners, nothing you need a
            chemistry degree to pronounce.
          </p>

          <a
            data-cluster-in
            href="#flavours"
            className="mt-8 md:mt-10 inline-block rounded-full bg-cream px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-transform duration-300 hover:scale-105"
          >
            Explore flavours
          </a>
        </div>
      </div>
    </section>
  );
}
