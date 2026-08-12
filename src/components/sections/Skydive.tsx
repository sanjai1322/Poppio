"use client";

import { Suspense, useRef } from "react";
import { View } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SkydiveScene from "@/components/canvas/SkydiveScene";
import { SLAM_FROM, SLAM_IN, splitForSlam } from "@/lib/slam";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Skydive() {
  const root = useRef<HTMLElement>(null!);

  useGSAP(
    () => {
      // The gradient plate lives outside <main> so it can sit behind the
      // canvas; fade it in with the section rather than cutting to it.
      const plate = document.getElementById("skydive-bg");
      if (plate) {
        gsap.fromTo(
          plate,
          { opacity: 0 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          },
        );
        gsap.to(plate, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "bottom bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.current.querySelector("h2");
        if (!heading) return;
        const split = splitForSlam(heading);
        gsap.fromTo(split.lines, SLAM_FROM, {
          ...SLAM_IN,
          scrollTrigger: { trigger: root.current, start: "top 55%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[200vh]">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <View className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <SkydiveScene />
          </Suspense>
        </View>

        <div className="relative px-6 text-center">
          <h2 className="wordmark text-[clamp(3rem,12vw,9rem)] leading-[0.85] text-cream">
            Fall into it
          </h2>
          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-cream/70">
            Nothing to hold on to
          </p>
        </div>
      </div>
    </section>
  );
}
