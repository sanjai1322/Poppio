"use client";

import { Suspense, useRef } from "react";
import { View } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CarbonationScene from "@/components/canvas/CarbonationScene";
import { INK } from "@/lib/flavors";
import { carbonationProgress } from "@/lib/scrollState";
import { SLAM_FROM, SLAM_IN, splitForSlam } from "@/lib/slam";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STATS = [
  { value: "3g", label: "Plant prebiotic fibre" },
  { value: "40", label: "Calories per can" },
  { value: "5g", label: "Sugar, and that's it" },
];

export default function Carbonation() {
  const root = useRef<HTMLElement>(null!);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          carbonationProgress.current = self.progress;
        },
      });

      // Land the colour plate on ink before the grid's own ink panel arrives,
      // so the section boundary isn't a hard cyan-to-black cut.
      const bg = document.getElementById("bg");
      if (bg) {
        gsap.to(bg, {
          backgroundColor: INK,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "center center",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.current.querySelector("h2");
        if (heading) {
          const split = splitForSlam(heading);
          gsap.fromTo(split.lines, SLAM_FROM, {
            ...SLAM_IN,
            scrollTrigger: { trigger: root.current, start: "top 65%" },
          });
        }

        gsap.from("[data-stat]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 60%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="why" ref={root} className="relative h-[200vh]">
      <div className="sticky top-0 flex h-[100svh] items-start overflow-hidden pt-24 md:items-center md:pt-0">
        <View className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <CarbonationScene />
          </Suspense>
        </View>

        <div className="relative mx-auto grid w-full max-w-7xl gap-16 px-6 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/60">
              Why it works
            </p>
            <h2 className="wordmark mt-5 text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] text-cream">
              The fizz is fun.
              <br />
              The fibre is
              <br />
              the point.
            </h2>
            <p className="mt-7 max-w-md text-base leading-relaxed text-cream/80 md:text-lg">
              Every can carries 3g of plant prebiotics — the stuff that feeds the
              good bacteria already living in your gut. Nothing synthetic,
              nothing you need a chemistry degree to pronounce.
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-cream/20 pt-8 md:mt-12">
              {STATS.map((stat) => (
                <div key={stat.label} data-stat>
                  <dt className="wordmark text-4xl text-cream md:text-5xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-2 text-[0.7rem] uppercase leading-relaxed tracking-[0.15em] text-cream/60">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right column is deliberately empty — the rising can occupies it. */}
          <div aria-hidden className="hidden md:block" />
        </div>
      </div>
    </section>
  );
}
