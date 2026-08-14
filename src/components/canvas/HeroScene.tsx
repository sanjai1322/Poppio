"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import Bubbles from "./Bubbles";
import Lighting from "./Lighting";
import { usePerfTier } from "@/lib/usePerfTier";
import { pointer, usePointerTracking } from "@/lib/pointer";

type IdleCanProps = {
  flavor: number;
  /** Degrees off dead-on, so the pair reads as two cans rather than clones. */
  turn: number;
  sway: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/**
 * A can held facing the viewer, swaying gently around that pose.
 *
 * It deliberately does NOT spin continuously. A continuous spin has no rest
 * angle, so the wordmark — the whole point of the hero shot — faces the camera
 * only in passing and any given frame is a coin flip.
 */
function IdleCan({
  flavor,
  turn,
  sway,
  position,
  rotation,
  scale,
}: IdleCanProps) {
  const spinner = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  const { reducedMotion } = usePerfTier();
  const float = reducedMotion ? 0 : 1;
  const base = CAN_FRONT_Y + THREE.MathUtils.degToRad(turn);

  useFrame((state, delta) => {
    spinner.current.rotation.y =
      base +
      Math.sin(state.clock.elapsedTime * 0.45 + turn) *
        THREE.MathUtils.degToRad(sway) *
        float;

    // Lean toward the cursor, damped so it trails rather than snaps, and
    // unwinds to rest when the pointer leaves the window.
    const reach = pointer.active && !reducedMotion ? MAX_TILT : 0;
    tilt.current.rotation.y = THREE.MathUtils.damp(
      tilt.current.rotation.y,
      pointer.x * reach,
      4,
      delta,
    );
    tilt.current.rotation.x = THREE.MathUtils.damp(
      tilt.current.rotation.x,
      pointer.y * reach,
      4,
      delta,
    );
  });

  return (
    <Float
      speed={1.4 * float}
      rotationIntensity={0.12 * float}
      floatIntensity={0.5 * float}
    >
      <group position={position} rotation={rotation} scale={scale}>
        <group ref={tilt}>
          <group ref={spinner}>
            <Can flavor={flavor} position={[0, CAN_CENTER_Y, 0]} />
          </group>
        </group>
      </group>
    </Float>
  );
}

/** Roughly 8 degrees of lean at the edges of the viewport. */
const MAX_TILT = THREE.MathUtils.degToRad(8);

export default function HeroScene() {
  usePointerTracking();
  const viewport = useThree((state) => state.viewport);
  const { isMobile, reducedMotion } = usePerfTier();
  const idle = reducedMotion ? 0 : 1;

  // Lay the cans out relative to what the camera can actually see, so the
  // composition survives any aspect ratio instead of only the one it was
  // designed against. On a narrow portrait viewport two half-height cans
  // collide with the headline, so they shrink and move to opposite corners.
  const x = viewport.width * (isMobile ? 0.31 : 0.315);

  // Half-width a tilted can sweeps at scale 1: its own width plus what the
  // z-tilt adds. Sizing on height alone clips the cans off the sides as soon
  // as the viewport is squarer than the layout was drawn for.
  const TILTED_HALF_WIDTH = 0.46;
  const byHeight = (viewport.height * (isMobile ? 0.34 : 0.62)) / CAN_HEIGHT;
  const byWidth =
    (viewport.width * 0.5 - x - viewport.width * 0.02) / TILTED_HALF_WIDTH;
  const scale = Math.min(byHeight, byWidth);

  const y = isMobile ? viewport.height * 0.3 : viewport.height * -0.1;

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      {/* Soft bokeh particles drifting behind the cans — one draw call. */}
      <group position={[0, 0, -2.2]}>
        <Bubbles
          count={isMobile ? 16 : 35}
          area={[viewport.width * 1.4, viewport.height * 1.5, 2]}
          radius={0.18}
          rise={0.25 * idle}
          opacity={0.14}
          seed={3}
        />
      </group>

      <IdleCan
        flavor={0}
        turn={-20}
        sway={5}
        position={[-x, y, 0]}
        rotation={[0, 0, 0.2]}
        scale={scale}
      />
      <IdleCan
        flavor={3}
        turn={22}
        sway={6}
        position={[x, isMobile ? -y : viewport.height * -0.14, -0.6]}
        rotation={[0, 0, -0.28]}
        scale={scale * 0.9}
      />
    </>
  );
}
