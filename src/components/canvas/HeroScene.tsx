"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import Bubbles from "./Bubbles";
import Lighting from "./Lighting";
import { usePerfTier } from "@/lib/usePerfTier";

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
  const { reducedMotion } = usePerfTier();
  const float = reducedMotion ? 0 : 1;
  const base = CAN_FRONT_Y + THREE.MathUtils.degToRad(turn);

  useFrame((state) => {
    spinner.current.rotation.y =
      base +
      Math.sin(state.clock.elapsedTime * 0.45 + turn) *
        THREE.MathUtils.degToRad(sway) *
        float;
  });

  return (
    <Float
      speed={1.4 * float}
      rotationIntensity={0.12 * float}
      floatIntensity={0.5 * float}
    >
      <group position={position} rotation={rotation} scale={scale}>
        <group ref={spinner}>
          <Can flavor={flavor} position={[0, CAN_CENTER_Y, 0]} />
        </group>
      </group>
    </Float>
  );
}

export default function HeroScene() {
  const viewport = useThree((state) => state.viewport);
  const { isMobile, reducedMotion } = usePerfTier();
  const idle = reducedMotion ? 0 : 1;

  // Lay the cans out relative to what the camera can actually see, so the
  // composition survives any aspect ratio instead of only 16:9. On a narrow
  // portrait viewport two half-height cans collide with the headline, so they
  // shrink and move to opposite corners, leaving the centre column readable.
  const scale =
    (viewport.height * (isMobile ? 0.3 : 0.44)) / CAN_HEIGHT;
  const x = viewport.width * (isMobile ? 0.3 : 0.3);
  const y = isMobile ? viewport.height * 0.3 : viewport.height * 0.04;

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      {/* Soft spheres drifting behind the cans — one draw call. */}
      <group position={[0, 0, -2.2]}>
        <Bubbles
          count={isMobile ? 12 : 26}
          area={[viewport.width * 1.4, viewport.height * 1.5, 2]}
          radius={0.28}
          rise={0.25 * idle}
          opacity={0.16}
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
        position={[x, isMobile ? -y : viewport.height * -0.07, -0.6]}
        rotation={[0, 0, -0.28]}
        scale={scale * 0.9}
      />
    </>
  );
}
