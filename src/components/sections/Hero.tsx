"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SLAM_FROM, SLAM_IN, splitForSlam } from "@/lib/slam";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const root = useRef<HTMLElement>(null!);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.current.querySelector("h1");
        if (heading) {
          const split = splitForSlam(heading, "words");
          gsap.fromTo(split.words, SLAM_FROM, { ...SLAM_IN, delay: 0.15 });
        }

        gsap.from("[data-hero-in]", {
          y: 40,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.45,
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      id="top"
      ref={root}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center"
    >
      {/* Cans are now rendered at the Canvas root level via CanCluster —
          no View needed here. */}

      <p
        data-hero-in
        className="relative text-[0.6rem] font-medium uppercase tracking-[0.4em] text-cream/50"
      >
        Prebiotic soda
      </p>

      <h1 className="wordmark relative mt-6 text-[clamp(3.25rem,13vw,11rem)] leading-[0.82] text-cream">
        Tropical
        <br />
        soda with
        <br />
        guts
      </h1>

      <p
        data-hero-in
        className="relative mt-8 max-w-md text-base leading-relaxed text-cream/80 md:text-lg"
      >
        Four island flavours. 3g of plant prebiotic fibre. None of the usual
        nonsense.
      </p>

      <a
        data-hero-in
        href="#flavours"
        className="relative mt-10 rounded-full bg-cream px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-transform duration-300 hover:scale-105"
      >
        Meet the four
      </a>

      <span className="absolute bottom-8 text-[0.65rem] uppercase tracking-[0.3em] text-cream/50">
        Scroll
      </span>
    </section>
  );
}
