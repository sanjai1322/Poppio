"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_HEIGHT } from "./Can";
import Bubbles from "./Bubbles";
import Lighting from "./Lighting";
import { carbonationProgress } from "@/lib/scrollState";
import { usePerfTier } from "@/lib/usePerfTier";

export default function CarbonationScene() {
  const viewport = useThree((state) => state.viewport);
  const { isMobile, reducedMotion } = usePerfTier();
  const idle = reducedMotion ? 0 : 1;
  const riser = useRef<THREE.Group>(null!);
  const spinner = useRef<THREE.Group>(null!);
  const bubbleFade = useRef(1);

  useFrame((state, delta) => {
    const progress = carbonationProgress.current;

    // The colour plate turns to ink over the back half of this section, and
    // pale bubbles at low alpha go muddy against it — retire them instead.
    bubbleFade.current = 1 - THREE.MathUtils.smoothstep(progress, 0.6, 0.95);

    // Rise from below the fold as the section scrolls. On mobile the two-column
    // layout collapses, so the can stays in the empty lower third rather than
    // climbing through the copy.
    riser.current.position.y = THREE.MathUtils.lerp(
      -viewport.height * 0.6,
      viewport.height * (isMobile ? -0.32 : 0.3),
      progress,
    );
    spinner.current.rotation.y += delta * 0.25 * idle;
    riser.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.4) * 0.04 * idle;
  });

  const scale = (viewport.height * (isMobile ? 0.24 : 0.42)) / CAN_HEIGHT;
  const x = isMobile ? 0 : viewport.width * 0.24;

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      <group position={[x, 0, 0]}>
        <Bubbles
          count={isMobile ? 30 : 70}
          area={[
            viewport.width * (isMobile ? 1.1 : 0.55),
            viewport.height * 1.6,
            2.4,
          ]}
          radius={0.055}
          rise={idle}
          opacity={0.3}
          seed={7}
          fade={bubbleFade}
        />

        <group ref={riser} scale={scale}>
          <group ref={spinner}>
            <Can flavor={3} position={[0, CAN_CENTER_Y, 0]} />
          </group>
        </group>
      </group>
    </>
  );
}
