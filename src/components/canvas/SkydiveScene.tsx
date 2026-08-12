"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import Lighting from "./Lighting";
import SmokeField from "./SmokeField";
import { usePerfTier } from "@/lib/usePerfTier";
import { SKYDIVE_END, SKYDIVE_ID, SKYDIVE_START } from "@/lib/skydive";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The can's flight, as a fraction of what the camera can see. Scroll drives it
 * bottom to top on a near-vertical line, easing slightly toward the lens as it
 * climbs. Deliberately not a tumble: a rocket under power holds its attitude,
 * and the stillness is what makes the smoke read as speed.
 */
const PATH_START = new THREE.Vector3(0.04, -0.78, -4.5);
const PATH_END = new THREE.Vector3(-0.03, 0.8, 1.2);

export default function SkydiveScene() {
  const viewport = useThree((state) => state.viewport);
  const can = useRef<THREE.Group>(null!);
  const { isMobile } = usePerfTier();

  const scale = (viewport.height * (isMobile ? 0.34 : 0.42)) / CAN_HEIGHT;

  useGSAP(
    () => {
      const section = document.getElementById(SKYDIVE_ID);
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
          // Same window as the pin, from the same constants, so the can
          // cannot still be travelling after the section has let go.
          trigger: section,
          start: SKYDIVE_START,
          end: SKYDIVE_END,
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
          { x: 0.16, y: CAN_FRONT_Y - Math.PI * 0.55, z: 0.1 },
          {
            // One slow roll so the label comes around, and the nose settles
            // upright by the top of the climb.
            x: -0.05,
            y: CAN_FRONT_Y + Math.PI * 0.55,
            z: -0.04,
            ease: "none",
          },
          0,
        );

      // The pin relayouts the page. Any trigger built before it — this one is
      // created inside the canvas, after Suspense resolves — measured against
      // the old height and has to be recalculated.
      ScrollTrigger.refresh();
    },
    { dependencies: [viewport.width, viewport.height] },
  );

  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[0, 0, 5]} />
      <Lighting />

      <SmokeField count={isMobile ? 14 : 30} />

      <group ref={can} scale={scale}>
        <Can flavor={0} position={[0, CAN_CENTER_Y, 0]} />
      </group>
    </>
  );
}
