"use client";

import { Suspense, useRef } from "react";
import { View } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SkydiveScene from "@/components/canvas/SkydiveScene";

import { SKYDIVE_END, SKYDIVE_ID, SKYDIVE_START } from "@/lib/skydive";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Skydive() {
  const root = useRef<HTMLElement>(null!);
  const stage = useRef<HTMLDivElement>(null!);

  useGSAP(
    () => {
      // A real pin rather than position:sticky. ScrollTrigger inserts its own
      // spacer, so the section needs no hand-computed height — the pinned
      // duration below is the single source of the section's scroll length.
      ScrollTrigger.create({
        trigger: root.current,
        start: SKYDIVE_START,
        end: SKYDIVE_END,
        pin: stage.current,
        anticipatePin: 1,
        // Pins must be measured before anything that depends on their layout.
        refreshPriority: 1,
      });

      // The sky plate's opacity is owned by SkydiveLayers, which ramps it
      // across the handoff beat. It used to be tweened here as well, and the
      // two writers overwrote each other every frame.

    },
    { scope: root },
  );

  return (
    <section id={SKYDIVE_ID} ref={root} className="relative">
      <div
        ref={stage}
        className="relative flex h-[100svh] items-center justify-center overflow-hidden"
      >
        <View className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <SkydiveScene />
          </Suspense>
        </View>
      </div>
    </section>
  );
}
