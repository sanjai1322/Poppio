"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import { FLAVORS } from "@/lib/flavors";
import { usePerfTier } from "@/lib/usePerfTier";

/**
 * The flavour panels, drawn in 3D:
 * - On Desktop: 4 vertical colour planes with 4 3D cans standing in front of them.
 * - On Mobile: 4 stacked horizontal colour cards with 4 3D cans floating on the right.
 */
const CAMERA_Z = 5;
const PLANE_Z = -0.5;
const PLANE_COMP = (CAMERA_Z - PLANE_Z) / CAMERA_Z;

export default function PanelStage({ open }: { open: number | null }) {
  const viewport = useThree((state) => state.viewport);
  const { isMobile, reducedMotion } = usePerfTier();

  const planes = useRef<THREE.Mesh[]>([]);
  const cans = useRef<THREE.Group[]>([]);

  /** Live grow values. This component owns them; the DOM follows. */
  const grow = useRef<number[]>(FLAVORS.map(() => 1));

  useFrame((state, delta) => {
    const buttons = document.querySelectorAll<HTMLElement>("[data-panel]");
    if (buttons.length === 0) return;

    let total = 0;
    for (let i = 0; i < grow.current.length; i++) {
      const target = isMobile
        ? open === i
          ? 2.2
          : open === null
          ? 1
          : 0.8
        : open === i
        ? 2.4
        : open === null
        ? 1
        : 0.75;

      grow.current[i] = THREE.MathUtils.damp(
        grow.current[i],
        target,
        7,
        delta,
      );
      total += grow.current[i];
    }

    let cursor = 0;
    for (let i = 0; i < grow.current.length; i++) {
      const plane = planes.current[i];
      const can = cans.current[i];
      const button = buttons[i];
      if (button) button.style.flexGrow = String(grow.current[i]);
      if (!plane || !can) continue;

      const frac = grow.current[i] / total;
      const fracCenter = cursor + frac / 2;
      cursor += frac;
      const isOpen = open === i;

      const idle = reducedMotion
        ? 0
        : Math.sin(state.clock.elapsedTime * 0.4 + i) * 0.08;

      if (isMobile) {
        // --- Mobile: Stacked horizontal panels with cans on the right ---
        const worldH = frac * viewport.height;
        const worldY = (0.5 - fracCenter) * viewport.height;

        plane.position.set(0, worldY * PLANE_COMP, PLANE_Z);
        plane.scale.set(viewport.width * PLANE_COMP, worldH * PLANE_COMP, 1);

        const fit = Math.min(viewport.width * 0.28, worldH * 0.72);
        can.position.set(viewport.width * 0.26, worldY, 0);
        can.scale.setScalar((fit / CAN_HEIGHT) * (isOpen ? 1.15 : 0.95));

        can.rotation.y = THREE.MathUtils.damp(
          can.rotation.y,
          CAN_FRONT_Y + (isOpen ? 0.25 : 0) + idle,
          4,
          delta,
        );
        can.rotation.z = isOpen ? -0.04 : 0.03;
      } else {
        // --- Desktop: Side-by-side vertical panels with cans in center ---
        const worldW = frac * viewport.width;
        const worldX = (fracCenter - 0.5) * viewport.width;

        plane.position.set(worldX * PLANE_COMP, 0, PLANE_Z);
        plane.scale.set(worldW * PLANE_COMP, viewport.height * PLANE_COMP, 1);

        const fit = Math.min(worldW * 0.78, viewport.height * 0.46);
        can.position.set(worldX, viewport.height * (isOpen ? 0.12 : 0.06), 0);
        can.scale.setScalar((fit / CAN_HEIGHT) * (isOpen ? 1.06 : 0.92));

        can.rotation.y = THREE.MathUtils.damp(
          can.rotation.y,
          CAN_FRONT_Y + (isOpen ? 0.22 : 0) + idle,
          4,
          delta,
        );
        can.rotation.z = isOpen ? -0.04 : 0.03;
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, CAMERA_Z]} />
      <Lighting />

      {FLAVORS.map((flavor, i) => (
        <group key={flavor.id}>
          <mesh
            ref={(el) => {
              if (el) planes.current[i] = el;
            }}
            position={[0, 0, PLANE_Z]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color={flavor.color} toneMapped={false} />
          </mesh>

          <group
            ref={(el) => {
              if (el) cans.current[i] = el;
            }}
          >
            <Can
              flavor={i}
              position={[0, CAN_CENTER_Y, 0]}
              scale={1}
            />
          </group>
        </group>
      ))}
    </>
  );
}
