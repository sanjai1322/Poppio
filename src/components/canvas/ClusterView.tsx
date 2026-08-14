"use client";

import { Suspense, useRef, useState } from "react";
import { View, PerspectiveCamera } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import CanCluster from "./CanCluster";
import Lighting from "./Lighting";
import Bubbles from "./Bubbles";
import { skydiveProgress } from "@/lib/scrollState";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Reads skydiveProgress every frame and writes to a fade ref that Bubbles
 * consumes without triggering React re-renders. Ramps to zero over the first
 * 12% of the skydive and back to 1 when scrolling above it.
 */
function BubbleFader({ fadeRef }: { fadeRef: React.MutableRefObject<number> }) {
  useFrame(() => {
    const sd = skydiveProgress.current;
    // Fade out quickly at the start of the skydive handoff
    fadeRef.current = 1 - THREE.MathUtils.smoothstep(sd, 0, 0.08);
  });
  return null;
}

/**
 * One View, spanning the hero and the cluster section.
 *
 * The cans cannot be mounted at the Canvas root: drei's <View> claims the
 * render loop with a useFrame priority, which switches off R3F's automatic
 * render of the root scene, so anything parked there is never drawn. They also
 * cannot live in two Views — each View owns a separate scene, and the whole
 * effect depends on these being the same objects throughout. So it is a single
 * full-viewport View that stays mounted across both sections.
 */
export default function ClusterView() {
  const root = useRef<HTMLDivElement>(null!);
  const [visible, setVisible] = useState(true);
  const { isMobile, reducedMotion } = usePerfTier();
  const idle = reducedMotion ? 0 : 1;
  const bubbleFade = useRef(1);

  useGSAP(() => {
    // Stays alive through the skydive: this group owns the falling can now, so
    // hiding it at the skydive boundary is exactly the cut we are removing.
    // Bound to enter/leaveBack rather than isActive, which would flip back on
    // again for every section after the flavour scroll.
    ScrollTrigger.create({
      trigger: "#flavours",
      start: "top bottom",
      onEnter: () => setVisible(false),
      onLeaveBack: () => setVisible(true),
    });
  }, []);

  return (
    <View
      ref={root}
      visible={visible}
      className="pointer-events-none fixed inset-0 z-[7]"
    >
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      {/* Fade particles to zero during the skydive section */}
      <BubbleFader fadeRef={bubbleFade} />

      {/* Same instanced field throughout — never unmounted between sections. */}
      <group position={[0, 0, -2.2]}>
        <Bubbles
          count={isMobile ? 16 : 35}
          area={[6, 5, 2]}
          radius={0.18}
          rise={0.25 * idle}
          opacity={0.14}
          seed={3}
          fade={bubbleFade}
        />
      </group>

      <Suspense fallback={null}>
        <CanCluster />
      </Suspense>
    </View>
  );
}
