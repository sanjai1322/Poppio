"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

      // The pin inserts a spacer and changes the page height. Anything measured
      // before that — including this section's own layer trigger — is now
      // pointing at the wrong offsets, so re-measure once everything exists.
      // This used to live in the skydive's 3D scene, which no longer exists.
      ScrollTrigger.refresh();
    },
    { scope: root },
  );

  return (
    <section id={SKYDIVE_ID} ref={root} className="relative">
      <div
        ref={stage}
        className="relative flex h-[100svh] items-center justify-center overflow-hidden"
      >
        {/* The falling can is the cluster's Dragon Blue, carried over by
            CanCluster — mounting a second one here would break continuity. */}
      </div>
    </section>
  );
}
