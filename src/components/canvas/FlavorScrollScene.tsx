"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import { cameraDolly, canSpin } from "@/lib/scrollState";
import { usePerfTier } from "@/lib/usePerfTier";

/** Resting camera distance; the dolly offsets from here. */
const CAMERA_Z = 5;

export default function FlavorScrollScene({ flavor }: { flavor: number }) {
  const viewport = useThree((state) => state.viewport);
  const camera = useRef<THREE.PerspectiveCamera>(null!);
  const spinner = useRef<THREE.Group>(null!);
  const bob = useRef<THREE.Group>(null!);
  const { isMobile, reducedMotion } = usePerfTier();
  const idle = reducedMotion ? 0 : 1;

  useFrame((state) => {
    // Rests front-on and is spun by the beat-change timeline, so the label
    // swap can be buried at the fastest part of the turn.
    spinner.current.rotation.y = CAN_FRONT_Y + canSpin.current;

    // Push-in. Driven from the same timeline as the spin, so the camera
    // settles exactly as the new label lands.
    if (camera.current) {
      camera.current.position.z = CAMERA_Z + cameraDolly.current;
    }

    const t = state.clock.elapsedTime;
    bob.current.position.y = Math.sin(t * 0.8) * 0.03 * idle;
    bob.current.rotation.z = 0.05 + Math.sin(t * 0.5) * 0.015 * idle;
  });

  // Portrait has no room to offset the can beside the flavour name — centre it
  // above the copy instead of pushing it off the right edge.
  const scale = (viewport.height * (isMobile ? 0.5 : 0.76)) / CAN_HEIGHT;
  const x = isMobile ? 0 : viewport.width * 0.22;
  const y = viewport.height * (isMobile ? 0.16 : 0.02);

  return (
    <>
      <PerspectiveCamera
        ref={camera}
        makeDefault
        fov={30}
        position={[0, 0, CAMERA_Z]}
      />
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
