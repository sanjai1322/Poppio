"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_HEIGHT } from "./Can";
import Bubbles from "./Bubbles";
import Lighting from "./Lighting";
import { carbonationProgress } from "@/lib/scrollState";

export default function CarbonationScene() {
  const viewport = useThree((state) => state.viewport);
  const riser = useRef<THREE.Group>(null!);
  const spinner = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    const progress = carbonationProgress.current;

    // Rise from below the fold to just above centre as the section scrolls.
    riser.current.position.y = THREE.MathUtils.lerp(
      -viewport.height * 0.55,
      viewport.height * 0.3,
      progress,
    );
    spinner.current.rotation.y += delta * 0.25;
    riser.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
  });

  const scale = (viewport.height * 0.42) / CAN_HEIGHT;
  const x = viewport.width * 0.24;

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      <group position={[x, 0, 0]}>
        <Bubbles
          count={70}
          area={[viewport.width * 0.55, viewport.height * 1.6, 2.4]}
          radius={0.055}
          rise={1}
          opacity={0.3}
          seed={7}
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
