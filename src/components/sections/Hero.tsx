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
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-20 pb-24 md:px-6 md:py-28 text-center"
    >
      <p
        data-hero-in
        className="relative text-[0.65rem] font-bold uppercase tracking-[0.45em] text-cream/70"
      >
        Prebiotic soda
      </p>

      <h1 className="wordmark relative mt-4 md:mt-6 text-[clamp(3.2rem,11.5vw,9.5rem)] font-black leading-[0.85] tracking-tight text-cream">
        Tropical
        <br />
        soda with
        <br />
        guts
      </h1>

      <p
        data-hero-in
        className="relative mt-5 md:mt-7 max-w-sm md:max-w-md text-sm sm:text-base font-normal leading-relaxed text-cream/90 md:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:drop-shadow-none"
      >
        Four island flavours. 3g of plant prebiotic fibre. None of the usual
        nonsense.
      </p>

      <a
        data-hero-in
        href="#flavours"
        className="relative mt-8 md:mt-10 rounded-full bg-cream px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-transform duration-300 hover:scale-105"
      >
        Meet the four
      </a>

      {/* Scroll indicator with vertical line */}
      <div className="absolute bottom-8 flex flex-col items-center gap-3">
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-cream/50">
          Scroll
        </span>
        <span className="block h-8 w-px bg-cream/30" />
      </div>
    </section>
  );
}
