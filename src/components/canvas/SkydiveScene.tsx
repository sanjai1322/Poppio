"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import { CREAM, FLAVORS } from "@/lib/flavors";
import { usePerfTier } from "@/lib/usePerfTier";

const NEAR_Z = 4;
const FAR_Z = -26;

type Item = {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  spin: number;
  fruit: boolean;
};

const between = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * The falling field. One InstancedMesh, one draw call: instances recycle from
 * the near plane back to the far one, so a fixed pool reads as infinite depth.
 *
 * Cloud blobs and fruit share the sphere geometry and are told apart by
 * per-instance colour and scale — a second geometry would mean a second draw
 * call, which is the one thing this is not allowed to cost.
 */
function SkyField({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { reducedMotion } = usePerfTier();

  const items = useMemo<Item[]>(
    () =>
      Array.from({ length: count }, () => {
        const fruit = Math.random() < 0.35;
        return {
          x: between(-9, 9),
          y: between(-6, 6),
          z: between(FAR_Z, NEAR_Z),
          scale: fruit ? between(0.28, 0.55) : between(0.7, 1.9),
          speed: between(1.4, 3.4),
          spin: between(-0.6, 0.6),
          fruit,
        };
      }),
    [count],
  );

  // Colour is per-instance and never changes, so it's written once at mount.
  const colors = useMemo(() => {
    const array = new Float32Array(count * 3);
    const color = new THREE.Color();
    items.forEach((item, i) => {
      color.set(
        item.fruit
          ? FLAVORS[Math.floor(Math.random() * FLAVORS.length)].color
          : CREAM,
      );
      color.toArray(array, i * 3);
    });
    return array;
  }, [count, items]);

  useFrame((state, delta) => {
    const step = reducedMotion ? 0 : delta;

    items.forEach((item, i) => {
      item.z += item.speed * step;

      if (item.z > NEAR_Z) {
        item.z = FAR_Z;
        item.x = between(-9, 9);
        item.y = between(-6, 6);
      }

      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(0, state.clock.elapsedTime * item.spin, 0);
      // Squashed spheres read as soft cloud puffs rather than balls.
      dummy.scale.set(
        item.scale * (item.fruit ? 1 : 1.7),
        item.scale * (item.fruit ? 1 : 0.85),
        item.scale,
      );
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.5, 12, 10]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereGeometry>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.55}
        roughness={1}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default function SkydiveScene() {
  const viewport = useThree((state) => state.viewport);
  const tumble = useRef<THREE.Group>(null!);
  const { isMobile, reducedMotion } = usePerfTier();

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    // Two axes at different rates so it never repeats a pose. X swings rather
    // than rotating through: a full X tumble points the flat base at the
    // camera half the time, which reads as a dark disc, not a falling can.
    tumble.current.rotation.x = Math.sin(t * 0.5) * 0.6;
    tumble.current.rotation.z = Math.cos(t * 0.37) * 0.25;
    tumble.current.rotation.y = CAN_FRONT_Y + t * 0.22;
  });

  const scale = (viewport.height * (isMobile ? 0.34 : 0.42)) / CAN_HEIGHT;

  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[0, 0, 5]} />
      <Lighting />

      <SkyField count={isMobile ? 16 : 32} />

      <group scale={scale}>
        <group ref={tumble}>
          <Can flavor={0} position={[0, CAN_CENTER_Y, 0]} />
        </group>
      </group>
    </>
  );
}
