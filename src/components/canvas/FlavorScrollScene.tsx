"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import { FLAVORS } from "@/lib/flavors";
import { flavorProgress } from "@/lib/scrollState";

/** One full turn per flavour beat, so each can starts and ends facing front. */
const TURNS_PER_BEAT = 1;

export default function FlavorScrollScene({ flavor }: { flavor: number }) {
  const viewport = useThree((state) => state.viewport);
  const spinner = useRef<THREE.Group>(null!);
  const bob = useRef<THREE.Group>(null!);

  useFrame((state) => {
    spinner.current.rotation.y =
      flavorProgress.current * FLAVORS.length * TURNS_PER_BEAT * Math.PI * 2;

    // A little life so the can never sits perfectly still between beats.
    const t = state.clock.elapsedTime;
    bob.current.position.y = Math.sin(t * 0.8) * 0.03;
    bob.current.rotation.z = 0.05 + Math.sin(t * 0.5) * 0.015;
  });

  const scale = (viewport.height * 0.52) / CAN_HEIGHT;

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      <group
        position={[viewport.width * 0.16, viewport.height * 0.12, 0]}
        scale={scale}
      >
        <group ref={bob}>
          <group ref={spinner}>
            <Can flavor={flavor} position={[0, CAN_CENTER_Y, 0]} />
          </group>
        </group>
      </group>
    </>
  );
}
