"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import { FLAVORS } from "@/lib/flavors";
import { flavorProgress } from "@/lib/scrollState";
import { usePerfTier } from "@/lib/usePerfTier";

/** One full turn per flavour beat. */
const TURNS_PER_BEAT = 1;

/**
 * Rotation offset, in turns, that puts the printed front of the label toward
 * the camera at each beat's rest point.
 *
 * Not zero and not a half turn: the GLB's node carries a baked ~68 degree Y
 * rotation and the wrap art's front does not start at u=0, so `rotation.y = 0`
 * points somewhere along the side. Measured against the rendered frames.
 *
 * Beats swap texture on their boundaries and the copy settles mid-beat, so
 * landing the front mid-beat also puts every swap exactly half a turn away —
 * the label changes while the can is back-on and the change is never seen.
 */
const PHASE = 0.4;

export default function FlavorScrollScene({ flavor }: { flavor: number }) {
  const viewport = useThree((state) => state.viewport);
  const spinner = useRef<THREE.Group>(null!);
  const bob = useRef<THREE.Group>(null!);
  const { isMobile, reducedMotion } = usePerfTier();
  const idle = reducedMotion ? 0 : 1;

  useFrame((state) => {
    // Scroll-linked, so it stays on even under reduced motion — the user is
    // driving it. Only the autonomous idle below gets switched off.
    spinner.current.rotation.y =
      (flavorProgress.current * FLAVORS.length * TURNS_PER_BEAT + PHASE) *
      Math.PI *
      2;

    const t = state.clock.elapsedTime;
    bob.current.position.y = Math.sin(t * 0.8) * 0.03 * idle;
    bob.current.rotation.z = 0.05 + Math.sin(t * 0.5) * 0.015 * idle;
  });

  // Portrait has no room to offset the can beside the flavour name — centre it
  // above the copy instead of pushing it off the right edge.
  const scale = (viewport.height * (isMobile ? 0.36 : 0.52)) / CAN_HEIGHT;
  const x = isMobile ? 0 : viewport.width * 0.16;
  const y = viewport.height * (isMobile ? 0.2 : 0.12);

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      <group position={[x, y, 0]} scale={scale}>
        <group ref={bob}>
          <group ref={spinner}>
            <Can flavor={flavor} position={[0, CAN_CENTER_Y, 0]} />
          </group>
        </group>
      </group>
    </>
  );
}
