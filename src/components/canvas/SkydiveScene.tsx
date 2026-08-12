"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import { CREAM, FLAVORS } from "@/lib/flavors";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const NEAR_Z = 5;
const FAR_Z = -30;

/**
 * The can's travel, as a fraction of what the camera can see. Scroll drives it
 * along this fixed diagonal — top-left and far, to bottom-right and near — so
 * the fall reads as one continuous line of motion instead of a drift.
 */
const PATH_START = new THREE.Vector3(-0.28, 0.42, -7);
const PATH_END = new THREE.Vector3(0.26, -0.44, 2.4);

type Cloud = {
  x: number;
  y: number;
  z: number;
  scale: number;
  spin: number;
  fruit: boolean;
};

const between = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * The field. Still one InstancedMesh and one draw call: GSAP owns a per-cloud
 * state object and the frame loop copies those into instance matrices, which is
 * how you get timeline control without one Object3D (and one draw call) each.
 */
function SkyField({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { reducedMotion } = usePerfTier();

  const clouds = useMemo<Cloud[]>(
    () =>
      Array.from({ length: count }, () => {
        const fruit = Math.random() < 0.35;
        return {
          x: between(-9, 9),
          y: between(-6, 6),
          z: FAR_Z,
          scale: fruit ? between(0.28, 0.55) : between(0.7, 1.9),
          spin: between(-0.6, 0.6),
          fruit,
        };
      }),
    [count],
  );

  const colors = useMemo(() => {
    const array = new Float32Array(count * 3);
    const color = new THREE.Color();
    clouds.forEach((cloud, i) => {
      color.set(
        cloud.fruit
          ? FLAVORS[Math.floor(Math.random() * FLAVORS.length)].color
          : CREAM,
      );
      color.toArray(array, i * 3);
    });
    return array;
  }, [count, clouds]);

  useGSAP(
    () => {
      // Each cloud runs its own infinitely repeating pass from the far plane to
      // the near one. Seeding each tween at a random progress spreads them
      // through the loop, so the field is already full on the first frame and
      // never visibly restarts.
      clouds.forEach((cloud) => {
        const travel = gsap.fromTo(
          cloud,
          { z: FAR_Z },
          {
            z: NEAR_Z,
            duration: between(9, 20),
            ease: "none",
            repeat: -1,
            onRepeat: () => {
              cloud.x = between(-9, 9);
              cloud.y = between(-6, 6);
            },
          },
        );
        travel.progress(Math.random());

        gsap.to(cloud, {
          x: `+=${between(-2.5, 2.5)}`,
          duration: between(6, 12),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        if (reducedMotion) {
          travel.pause();
        }
      });
    },
    { dependencies: [clouds, reducedMotion] },
  );

  useFrame((state) => {
    clouds.forEach((cloud, i) => {
      dummy.position.set(cloud.x, cloud.y, cloud.z);
      dummy.rotation.set(0, state.clock.elapsedTime * cloud.spin, 0);
      // Squashed spheres read as soft cloud puffs rather than balls.
      dummy.scale.set(
        cloud.scale * (cloud.fruit ? 1 : 1.7),
        cloud.scale * (cloud.fruit ? 1 : 0.85),
        cloud.scale,
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
  const can = useRef<THREE.Group>(null!);
  const { isMobile } = usePerfTier();

  const scale = (viewport.height * (isMobile ? 0.34 : 0.42)) / CAN_HEIGHT;

  useGSAP(
    () => {
      const section = document.getElementById("skydive");
      if (!section) return;

      // Path endpoints are resolved against the live viewport so the diagonal
      // spans the same proportion of the frame at any aspect ratio.
      const start = new THREE.Vector3(
        PATH_START.x * viewport.width,
        PATH_START.y * viewport.height,
        PATH_START.z,
      );
      const end = new THREE.Vector3(
        PATH_END.x * viewport.width,
        PATH_END.y * viewport.height,
        PATH_END.z,
      );

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      timeline
        .fromTo(
          can.current.position,
          { x: start.x, y: start.y, z: start.z },
          { x: end.x, y: end.y, z: end.z, ease: "none" },
          0,
        )
        .fromTo(
          can.current.rotation,
          { x: 0.55, y: CAN_FRONT_Y - Math.PI, z: -0.35 },
          {
            x: -0.35,
            y: CAN_FRONT_Y + Math.PI,
            z: 0.4,
            ease: "none",
          },
          0,
        );
    },
    { dependencies: [viewport.width, viewport.height] },
  );

  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[0, 0, 5]} />
      <Lighting />

      <SkyField count={isMobile ? 16 : 32} />

      <group ref={can} scale={scale}>
        <Can flavor={0} position={[0, CAN_CENTER_Y, 0]} />
      </group>
    </>
  );
}
