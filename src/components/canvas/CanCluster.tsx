"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import { clusterProgress, handoffProgress, skydiveProgress } from "@/lib/scrollState";
import { BEAT } from "@/lib/skydive";
import { usePerfTier } from "@/lib/usePerfTier";
import { pointer, usePointerTracking } from "@/lib/pointer";

type CanPose = {
  /** x and y are fractions of the visible viewport; z is world units. */
  pos: [number, number, number];
  /** Euler offsets applied on top of the front-facing base rotation. */
  rot: [number, number, number];
  scale: number;
};

/**
 * Which flavour each slot wears.
 *
 * Slots 0 and 1 are the hero pair (Mango and Dragon Blue).
 * Slots 2 and 3 are Guava and Pineapple.
 */
const FLAVOR_BY_SLOT = [0, 3, 1, 2];

/** Hero: Desktop pair on stage, the other two parked off-frame. */
const HERO: CanPose[] = [
  { pos: [-0.315, -0.1, 0], rot: [0, -0.05, 0.18], scale: 1 },
  { pos: [0.315, -0.14, -0.6], rot: [0, 0.05, -0.28], scale: 0.9 },
  { pos: [0.22, 1.0, -1.2], rot: [0, 0, 0.3], scale: 0.02 },
  { pos: [0.42, -1.0, -1.2], rot: [0, 0, -0.3], scale: 0.02 },
];

/** Hero: Mobile pair with tighter horizontal spacing to fit portrait screens cleanly. */
const HERO_MOBILE: CanPose[] = [
  { pos: [-0.12, -0.22, 0], rot: [0, -0.04, 0.16], scale: 0.88 },
  { pos: [0.15, -0.26, -0.6], rot: [0, 0.04, -0.22], scale: 0.78 },
  { pos: [0.2, 1.0, -1.2], rot: [0, 0, 0.3], scale: 0.02 },
  { pos: [0.42, -1.0, -1.2], rot: [0, 0, -0.3], scale: 0.02 },
];

/** Cluster: Desktop layout grouped right of centre. */
const CLUSTER: CanPose[] = [
  { pos: [0.12, -0.01, 0.3],  rot: [0, -0.04, 0.05],  scale: 0.6 },
  { pos: [0.28,  0.08, -0.7], rot: [0.03, 0.04, -0.1], scale: 0.5 },
  { pos: [0.06,  0.1, -0.4],  rot: [-0.03, -0.03, 0.1],scale: 0.52 },
  { pos: [0.24, -0.14, 0.05], rot: [0.02, 0.03, -0.14], scale: 0.56 },
];

/** Cluster: Mobile layout centered below headline for perfect vertical balance. */
const CLUSTER_MOBILE: CanPose[] = [
  { pos: [-0.10, -0.16, 0.3],  rot: [0, -0.03, 0.04],  scale: 0.52 },
  { pos: [0.14,  -0.12, -0.7], rot: [0.02, 0.03, -0.08], scale: 0.44 },
  { pos: [-0.20, -0.06, -0.4], rot: [-0.02, -0.02, 0.08],scale: 0.46 },
  { pos: [0.10, -0.22, 0.1], rot: [0.02, 0.03, -0.12], scale: 0.50 },
];

const TUMBLE_TURNS = [2, -3, 3, -2];
const TUMBLE_X_PEAK = [0.08, -0.07, 0.09, -0.08].map((t) => t * Math.PI);

/**
 * Slot 1 wears Dragon Blue, and it is the single can that stays for the skydive.
 */
const SKYDIVE_SLOT = 1;

const MAX_TILT = THREE.MathUtils.degToRad(8);
const SWAY_PHASE = [-20, 22, 0, 0];
const SWAY_AMOUNT = [5, 6, 0, 0].map((d) => THREE.MathUtils.degToRad(d));
const TILTED_HALF_WIDTH = 0.46;

/** GSAP power3.inOut */
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function CanCluster() {
  usePointerTracking();

  const viewport = useThree((state) => state.viewport);
  const { isMobile, reducedMotion } = usePerfTier();

  const cans = useRef<THREE.Group[]>([]);
  const tilts = useRef<THREE.Group[]>([]);

  const slotCount = isMobile ? 3 : 4;

  const baseScale = useMemo(() => {
    const byHeight = (viewport.height * (isMobile ? 0.36 : 0.62)) / CAN_HEIGHT;
    const byWidth =
      (viewport.width * (isMobile ? 0.8 : 0.5) - viewport.width * (isMobile ? 0.15 : 0.315)) /
      TILTED_HALF_WIDTH;
    return Math.min(byHeight, byWidth);
  }, [viewport.width, viewport.height, isMobile]);

  useFrame((state, delta) => {
    const p = clusterProgress.current;
    const h = handoffProgress.current;
    const sd = skydiveProgress.current;
    const easedP = easeInOut(p);
    const time = state.clock.elapsedTime;
    const float = reducedMotion ? 0 : 1;

    const skyScale = (viewport.height * (isMobile ? 0.42 : 0.52)) / CAN_HEIGHT;

    for (let i = 0; i < slotCount; i++) {
      const can = cans.current[i];
      const tilt = tilts.current[i];
      if (!can || !tilt) continue;

      const hero = isMobile && HERO_MOBILE[i] ? HERO_MOBILE[i] : HERO[i];
      const cluster = isMobile && CLUSTER_MOBILE[i] ? CLUSTER_MOBILE[i] : CLUSTER[i];
      const isHeroPair = i < 2;

      const clusterPosX = cluster.pos[0] * viewport.width;
      const clusterPosY = cluster.pos[1] * viewport.height;
      const clusterPosZ = cluster.pos[2];
      const clusterScale = cluster.scale * baseScale;

      if (h <= 0 && sd <= 0) {
        // --- Phase 1: Hero -> Cluster entrance ---
        can.visible = true;
        can.position.set(
          THREE.MathUtils.lerp(hero.pos[0] * viewport.width, clusterPosX, easedP),
          THREE.MathUtils.lerp(hero.pos[1] * viewport.height, clusterPosY, easedP),
          THREE.MathUtils.lerp(hero.pos[2], clusterPosZ, easedP),
        );

        const growth = isHeroPair ? easedP : THREE.MathUtils.smoothstep(p, 0, 0.4);
        can.scale.setScalar(
          THREE.MathUtils.lerp(hero.scale * baseScale, clusterScale, growth),
        );

        let heroY = CAN_FRONT_Y + hero.rot[1];
        if (p < 0.01 && isHeroPair) {
          heroY += Math.sin(time * 0.45 + SWAY_PHASE[i]) * SWAY_AMOUNT[i] * float;
        }

        can.rotation.set(
          THREE.MathUtils.lerp(hero.rot[0], cluster.rot[0], easedP) +
            Math.sin(Math.PI * p) * TUMBLE_X_PEAK[i],
          THREE.MathUtils.lerp(heroY, CAN_FRONT_Y + cluster.rot[1], easedP) +
            TUMBLE_TURNS[i] * Math.PI * 2 * easedP,
          THREE.MathUtils.lerp(hero.rot[2], cluster.rot[2], easedP),
        );
      } else if (h > 0 && sd <= 0) {
        // --- Phase 2: Section 2 Exit & Seamless Handoff ---
        if (i !== SKYDIVE_SLOT) {
          const scrollUp = h * 1.5 * viewport.height;
          can.position.set(clusterPosX, clusterPosY + scrollUp, clusterPosZ);
          can.scale.setScalar(clusterScale * Math.max(0, 1 - h * 0.6));
          can.rotation.set(cluster.rot[0], CAN_FRONT_Y + cluster.rot[1], cluster.rot[2]);
          can.visible = h < 1.0;
        } else {
          can.visible = true;
          const easedH = easeInOut(h);

          can.position.set(
            THREE.MathUtils.lerp(clusterPosX, 0, easedH),
            THREE.MathUtils.lerp(clusterPosY, 0, easedH),
            THREE.MathUtils.lerp(clusterPosZ, 0, easedH),
          );

          can.scale.setScalar(
            THREE.MathUtils.lerp(clusterScale, skyScale, easedH),
          );

          if (h < 0.35) {
            const subtleSway = Math.sin(time * 0.5) * 0.05 * float;
            can.rotation.set(
              cluster.rot[0],
              CAN_FRONT_Y + cluster.rot[1] + subtleSway,
              cluster.rot[2],
            );
          } else {
            const rotProgress = (h - 0.35) / 0.65;
            const targetRotY = CAN_FRONT_Y + Math.sin(time * 1.4) * 0.22;
            const targetRotX = 0.12 + Math.cos(time * 1.2) * 0.08;
            const targetRotZ = Math.sin(time * 1.4) * 0.15;

            can.rotation.set(
              THREE.MathUtils.lerp(cluster.rot[0], targetRotX, rotProgress),
              THREE.MathUtils.lerp(CAN_FRONT_Y + cluster.rot[1], targetRotY, rotProgress),
              THREE.MathUtils.lerp(cluster.rot[2], targetRotZ, rotProgress),
            );
          }
        }
      } else if (sd > 0) {
        // --- Phase 3: Pinned Skydive flight with dynamic 360° rolling tumble ---
        if (i !== SKYDIVE_SLOT) {
          can.visible = false;
          can.scale.setScalar(0);
        } else {
          can.visible = true;
          const exitUp = THREE.MathUtils.smoothstep(sd, BEAT.freefallEnd, BEAT.emptyEnd);
          const drift = Math.sin(sd * Math.PI * 3);
          const breathe = 0.96 + (Math.sin(sd * Math.PI * 5) * 0.5 + 0.5) * 0.08;

          can.position.set(
            drift * viewport.width * (isMobile ? 0.05 : 0.08),
            Math.cos(sd * Math.PI * 2.2) * viewport.height * 0.05 + exitUp * viewport.height * 1.4,
            0,
          );
          can.scale.setScalar(skyScale * breathe);

          // Rolling spin through the clouds: continuous 360° revolutions + dynamic wobble
          const targetRotY = CAN_FRONT_Y + cluster.rot[1] + sd * (1 / 0.20) * Math.PI * 2;
          const targetRotX = cluster.rot[0] + Math.sin(sd * (1 / 0.60) * Math.PI * 2) * 0.32;
          const targetRotZ = Math.sin(sd * Math.PI * 4) * 0.12 - drift * 0.22;

          can.rotation.set(targetRotX, targetRotY, targetRotZ);
        }
      }

      // Cursor lean belongs to the hero pose only
      const fade = 1 - THREE.MathUtils.smoothstep(p, 0, 0.15);
      const reach =
        isHeroPair && fade > 0.001 && pointer.active && !reducedMotion
          ? MAX_TILT * fade
          : 0;

      tilt.rotation.y = THREE.MathUtils.damp(tilt.rotation.y, pointer.x * reach, 4, delta);
      tilt.rotation.x = THREE.MathUtils.damp(tilt.rotation.x, pointer.y * reach, 4, delta);
    }
  });

  return (
    <group>
      {Array.from({ length: slotCount }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) cans.current[i] = el;
          }}
        >
          <group
            ref={(el) => {
              if (el) tilts.current[i] = el;
            }}
          >
            <Can flavor={FLAVOR_BY_SLOT[i]} position={[0, CAN_CENTER_Y, 0]} />
          </group>
        </group>
      ))}
    </group>
  );
}
