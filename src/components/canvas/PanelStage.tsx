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
 * The flavour panels, drawn in 3D: a colour plane per flavour with its can
 * standing in front of it.
 *
 * The colour has to be rendered here rather than as a DOM background because
 * the shared canvas sits at z-10 and page content at z-20 — an opaque panel in
 * the content layer would paint straight over the can. Putting the colour in
 * the scene puts the can in front of it, and the DOM keeps only the type and
 * the hit areas, layered above.
 *
 * Plane geometry is a unit quad, scaled per frame. Rather than duplicating the
 * flex-grow maths and hoping two easing curves stay in step, each plane reads
 * its button's measured rect — so the colour can never drift out from under
 * its own label mid-transition.
 */
/** Camera distance, and how far behind the cans the colour planes sit. */
const CAMERA_Z = 5;
/** Far enough back that the can's own depth cannot intersect the plane. */
const PLANE_Z = -0.5;
/**
 * viewport.width/height describe the frustum at z=0. A plane parked behind
 * that sees a wider frustum, so it has to be scaled up by the distance ratio —
 * otherwise the colour band renders inset from the row it is meant to fill.
 */
const PLANE_COMP = (CAMERA_Z - PLANE_Z) / CAMERA_Z;

export default function PanelStage({ open }: { open: number | null }) {
  const viewport = useThree((state) => state.viewport);
  const { isMobile, reducedMotion } = usePerfTier();

  const planes = useRef<THREE.Mesh[]>([]);
  const cans = useRef<THREE.Group[]>([]);

  useFrame((state, delta) => {
    const row = document.querySelector("[data-panels]");
    if (!row) return;
    const rowRect = row.getBoundingClientRect();
    if (rowRect.width === 0) return;

    const buttons = document.querySelectorAll("[data-panel]");

    buttons.forEach((button, i) => {
      const plane = planes.current[i];
      const can = cans.current[i];
      if (!plane || !can) return;

      const rect = button.getBoundingClientRect();
      const fracW = rect.width / rowRect.width;
      const fracX = (rect.left + rect.width / 2 - rowRect.left) / rowRect.width;

      const worldW = fracW * viewport.width;
      const worldX = (fracX - 0.5) * viewport.width;

      plane.position.x = worldX * PLANE_COMP;
      plane.scale.set(
        worldW * PLANE_COMP,
        viewport.height * PLANE_COMP,
        1,
      );

      // Can is sized to whichever is tighter: the panel's width or the row's
      // height, so a narrowed panel shrinks its can instead of clipping it.
      const fit = Math.min(worldW * 0.78, viewport.height * 0.46);
      const isOpen = open === i;
      const target = (fit / CAN_HEIGHT) * (isOpen ? 1.06 : 0.92);

      can.position.x = worldX;
      // Sits above centre; the copy occupies the lower part of the panel.
      can.position.y = THREE.MathUtils.damp(
        can.position.y,
        viewport.height * (isOpen ? 0.12 : 0.06),
        5,
        delta,
      );
      can.scale.setScalar(THREE.MathUtils.damp(can.scale.x, target, 5, delta));

      // Faces front at rest; the chosen one turns a little towards the viewer.
      const idle = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.4 + i) * 0.08;
      can.rotation.y = THREE.MathUtils.damp(
        can.rotation.y,
        CAN_FRONT_Y + (isOpen ? 0.22 : 0) + idle,
        4,
        delta,
      );
      can.rotation.z = isOpen ? -0.04 : 0.03;
    });
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
            {/* Unlit: this is a flat brand colour, not a surface. */}
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
              scale={isMobile ? 0.9 : 1}
            />
          </group>
        </group>
      ))}
    </>
  );
}
