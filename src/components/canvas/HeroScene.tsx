"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_HEIGHT } from "./Can";
import Bubbles from "./Bubbles";
import Lighting from "./Lighting";

type IdleCanProps = {
  flavor: number;
  spin: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/** A can that turns slowly on its own axis, wrapped in a gentle float. */
function IdleCan({ flavor, spin, position, rotation, scale }: IdleCanProps) {
  const spinner = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    spinner.current.rotation.y += delta * spin;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
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

  // Lay the cans out relative to what the camera can actually see, so the
  // composition survives any aspect ratio instead of only 16:9.
  const scale = (viewport.height * 0.46) / CAN_HEIGHT;
  const x = viewport.width * 0.33;

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 5]} />
      <Lighting />

      {/* Soft spheres drifting behind the cans — one draw call. */}
      <group position={[0, 0, -2.2]}>
        <Bubbles
          count={26}
          area={[viewport.width * 1.4, viewport.height * 1.5, 2]}
          radius={0.28}
          rise={0.25}
          opacity={0.16}
          seed={3}
        />
      </group>

      <IdleCan
        flavor={0}
        spin={0.35}
        position={[-x, viewport.height * 0.04, 0]}
        rotation={[0, 0, 0.2]}
        scale={scale}
      />
      <IdleCan
        flavor={3}
        spin={-0.28}
        position={[x, viewport.height * -0.07, -0.6]}
        rotation={[0, 0, -0.28]}
        scale={scale * 0.9}
      />
    </>
  );
}
