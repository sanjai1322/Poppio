"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type BubblesProps = {
  count: number;
  /** Box the bubbles live in, in world units. */
  area: [number, number, number];
  /** Base sphere radius before per-bubble variation. */
  radius: number;
  rise: number;
  color?: string;
  opacity?: number;
  seed?: number;
  /** Live multiplier on opacity, read every frame. Lets a scroll-driven parent
   *  fade the field out without re-rendering React 60 times a second. */
  fade?: { current: number };
};

/** Deterministic PRNG so server and client agree and reloads look identical. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * One InstancedMesh, one draw call, matrices written straight into the buffer.
 * No React state and no per-bubble components — this runs every frame.
 */
export default function Bubbles({
  count,
  area,
  radius,
  rise,
  color = "#FFF4E0",
  opacity = 0.22,
  seed = 1,
  fade,
}: BubblesProps) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const material = useRef<THREE.MeshStandardMaterial>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const bubbles = useMemo(() => {
    const random = makeRandom(seed);
    const [ax, ay, az] = area;

    return Array.from({ length: count }, () => ({
      x: (random() - 0.5) * ax,
      y: (random() - 0.5) * ay,
      z: (random() - 0.5) * az,
      scale: 0.35 + random() * 0.8,
      speed: 0.35 + random() * 0.9,
      phase: random() * Math.PI * 2,
      sway: 0.04 + random() * 0.12,
    }));
  }, [count, area, seed]);

  useFrame((state, delta) => {
    const [, ay] = area;
    const time = state.clock.elapsedTime;
    // Clamp delta so a backgrounded tab doesn't teleport every bubble.
    const step = Math.min(delta, 0.05);

    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];

      bubble.y += step * bubble.speed * rise;
      if (bubble.y > ay / 2) bubble.y = -ay / 2;

      dummy.position.set(
        bubble.x + Math.sin(time * 0.6 + bubble.phase) * bubble.sway,
        bubble.y,
        bubble.z,
      );
      dummy.scale.setScalar(bubble.scale * radius);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }

    mesh.current.instanceMatrix.needsUpdate = true;

    if (fade) {
      material.current.opacity = opacity * fade.current;
      material.current.visible = material.current.opacity > 0.001;
    }
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 14, 12]} />
      <meshStandardMaterial
        ref={material}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        roughness={0.25}
        metalness={0}
      />
    </instancedMesh>
  );
}
