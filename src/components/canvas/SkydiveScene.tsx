"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import { skydiveProgress } from "@/lib/scrollState";
import { BEAT } from "@/lib/skydive";
import { usePerfTier } from "@/lib/usePerfTier";

/** One full Y revolution per 0.20 of progress. */
const Y_REVS = 1 / 0.2;
/** X oscillates at about a third of that rate. */
const X_RATE = Y_REVS / 3;
/**
 * A wobble, not a revolution. Rotating X all the way through points the can's
 * flat lid and base at the lens for long stretches, where it reads as a
 * featureless metal disc rather than a can.
 */
const X_WOBBLE = 0.32;

/**
 * Solo Dragon Blue can tumbling through a cloud field.
 *
 * Only one can: ClusterView hides itself the moment the skydive section enters
 * the viewport, and this scene takes over with Dragon Blue at centre frame.
 * No handoff from a cluster — that was duplicating section 2.
 */
export default function SkydiveScene() {
  const viewport = useThree((state) => state.viewport);
  const can = useRef<THREE.Group>(null!);
  const { isMobile } = usePerfTier();

  const baseScale = (viewport.height * (isMobile ? 0.4 : 0.52)) / CAN_HEIGHT;

  useFrame(() => {
    const p = skydiveProgress.current;
    if (!can.current) return;

    // Freefall drift — the can wanders laterally and bobs vertically.
    const drift = Math.sin(p * Math.PI * 3);
    const exit = THREE.MathUtils.smoothstep(p, BEAT.freefallEnd, BEAT.emptyEnd);
    const x = drift * viewport.width * 0.08;
    const y =
      Math.cos(p * Math.PI * 2.2) * viewport.height * 0.05 +
      exit * viewport.height * 1.4;
    const breathe = 0.96 + (Math.sin(p * Math.PI * 5) * 0.5 + 0.5) * 0.08;

    can.current.position.set(x, y, 0);
    can.current.scale.setScalar(baseScale * breathe);

    // Continuous tumble — exempt from the front-facing rule. The whole point
    // of the skydive is the can spinning freely through the air.
    //
    // X wobbles rather than revolving: taken all the way round it points the
    // flat lid and base at the lens for long stretches, where the can reads as
    // a featureless metal disc instead of a can.
    can.current.rotation.x = Math.sin(p * X_RATE * Math.PI * 2) * X_WOBBLE;
    can.current.rotation.y = p * Y_REVS * Math.PI * 2;
    can.current.rotation.z = Math.sin(p * Math.PI * 4) * 0.12;
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      <group
        ref={can}
      >
        <Can flavor={3} position={[0, CAN_CENTER_Y, 0]} />
      </group>
    </>
  );
}
