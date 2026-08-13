"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import Can, { CAN_CENTER_Y, CAN_FRONT_Y, CAN_HEIGHT } from "./Can";
import { clusterProgress, skydiveProgress } from "@/lib/scrollState";
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
 * Slots 0 and 1 are the hero pair, so they hold mango and dragon — the two the
 * hero composition is built around. Slot order is deliberately not flavour
 * order: the mobile tier renders the first three slots only, and keying the
 * hero pair to slots 0 and 1 means dropping a slot can never remove a can the
 * hero depends on.
 */
const FLAVOR_BY_SLOT = [0, 3, 1, 2];

/** Hero: the pair on stage, the other two parked off-frame at no size. */
const HERO: CanPose[] = [
  { pos: [-0.315, -0.1, 0], rot: [0, -0.35, 0.2], scale: 1 },
  { pos: [0.315, -0.14, -0.6], rot: [0, 0.38, -0.28], scale: 0.9 },
  { pos: [0.22, 1.0, -1.2], rot: [0, -0.2, 0.3], scale: 0.02 },
  { pos: [0.42, -1.0, -1.2], rot: [0, 0.2, -0.3], scale: 0.02 },
];

/**
 * Cluster: grouped right of centre, overlapping at four different depths and
 * four different angles. Pulled in from the original layout so all four cans
 * sit fully within the viewport with breathing room.
 */
const CLUSTER: CanPose[] = [
  { pos: [0.12, -0.01, 0.3],  rot: [0, -0.12, 0.05],  scale: 0.6 },
  { pos: [0.28,  0.08, -0.7], rot: [0.03, 0.28, -0.1], scale: 0.5 },
  { pos: [0.06,  0.1, -0.4],  rot: [-0.03, -0.24, 0.1],scale: 0.52 },
  { pos: [0.24, -0.14, 0.05], rot: [0.02, 0.16, -0.14], scale: 0.56 },
];

/**
 * Whole turns only. A fractional count — 1.5 or 2.5 — leaves the can a half
 * turn from where the layout says it should be, which lands the cluster with
 * barcodes to camera. Signs alternate so they don't spin in unison.
 */
const TUMBLE_TURNS = [2, -3, 3, -2];

/**
 * X tumble peaks mid-flight and returns to zero, rather than accumulating.
 * Half a turn of accumulated X would land the can upside down.
 *
 * Capped at roughly 15 degrees: at higher angles the flat metal lid dominates
 * the frame and the label becomes unreadable. The Y turns carry the sense of
 * being thrown; X only needs to break the axis.
 */
const TUMBLE_X_PEAK = [0.08, -0.07, 0.09, -0.08].map((t) => t * Math.PI);

/**
 * Slot 1 wears Dragon Blue, and it is the can that stays for the skydive.
 * Cyan holds up best against the pale sky, and keeping it as one object across
 * the two sections is what makes the handoff read as continuous rather than as
 * a cut to a different can.
 */
const SKYDIVE_SLOT = 1;
/** One full Y revolution per 0.20 of skydive progress. */
const SKY_Y_REVS = 1 / 0.2;
const SKY_X_RATE = SKY_Y_REVS / 3;
/** A wobble, not a revolution — a full X turn shows the flat lid as a disc. */
const SKY_X_WOBBLE = 0.32;

const MAX_TILT = THREE.MathUtils.degToRad(8);
const SWAY_PHASE = [-20, 22, 0, 0];
const SWAY_AMOUNT = [5, 6, 0, 0].map((d) => THREE.MathUtils.degToRad(d));
/** Half-width a tilted can sweeps at scale 1. */
const TILTED_HALF_WIDTH = 0.46;

/** GSAP power3.inOut, so the flight accelerates and settles. */
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * The four cans, mounted once and never remounted. Scroll interpolates every
 * can between its hero pose and its cluster pose; the tumble rides on top and
 * unwinds to exactly zero at the far end.
 */
export default function CanCluster() {
  usePointerTracking();

  const viewport = useThree((state) => state.viewport);
  const { isMobile, reducedMotion } = usePerfTier();

  const cans = useRef<THREE.Group[]>([]);
  const tilts = useRef<THREE.Group[]>([]);

  // Three cans below 768px: four is four draw calls, and the brief would
  // rather lose one can than shrink them all.
  const slotCount = isMobile ? 3 : 4;

  // Sizing on height alone clips the pair off the sides as soon as the
  // viewport is squarer than the layout was drawn against.
  const baseScale = useMemo(() => {
    const byHeight = (viewport.height * (isMobile ? 0.34 : 0.62)) / CAN_HEIGHT;
    const byWidth =
      (viewport.width * 0.5 - viewport.width * 0.315 - viewport.width * 0.02) /
      TILTED_HALF_WIDTH;
    return Math.min(byHeight, byWidth);
  }, [viewport.width, viewport.height, isMobile]);

  useFrame((state, delta) => {
    const p = clusterProgress.current;
    const eased = easeInOut(p);
    const time = state.clock.elapsedTime;
    const float = reducedMotion ? 0 : 1;

    for (let i = 0; i < slotCount; i++) {
      const can = cans.current[i];
      const tilt = tilts.current[i];
      if (!can || !tilt) continue;

      const hero = HERO[i];
      const cluster = CLUSTER[i];
      const isHeroPair = i < 2;

      can.position.set(
        THREE.MathUtils.lerp(
          hero.pos[0] * viewport.width,
          cluster.pos[0] * viewport.width,
          eased,
        ),
        THREE.MathUtils.lerp(
          hero.pos[1] * viewport.height,
          cluster.pos[1] * viewport.height,
          eased,
        ),
        THREE.MathUtils.lerp(hero.pos[2], cluster.pos[2], eased),
      );

      // The two extras grow in over the first 40% so the pair becomes a crowd
      // instead of two cans appearing at full size.
      const growth = isHeroPair
        ? eased
        : THREE.MathUtils.smoothstep(p, 0, 0.4);
      can.scale.setScalar(
        THREE.MathUtils.lerp(
          hero.scale * baseScale,
          cluster.scale * baseScale,
          growth,
        ),
      );

      let heroY = CAN_FRONT_Y + hero.rot[1];
      if (p < 0.01 && isHeroPair) {
        heroY +=
          Math.sin(time * 0.45 + SWAY_PHASE[i]) * SWAY_AMOUNT[i] * float;
      }

      can.rotation.set(
        THREE.MathUtils.lerp(hero.rot[0], cluster.rot[0], eased) +
          Math.sin(Math.PI * p) * TUMBLE_X_PEAK[i],
        THREE.MathUtils.lerp(heroY, CAN_FRONT_Y + cluster.rot[1], eased) +
          TUMBLE_TURNS[i] * Math.PI * 2 * eased,
        THREE.MathUtils.lerp(hero.rot[2], cluster.rot[2], eased),
      );

      // --- Skydive handoff -------------------------------------------------
      // The three others carry on up and out of frame; Dragon Blue stays and
      // becomes the falling can. Same mesh, same material, no cut.
      const sd = skydiveProgress.current;
      if (sd > 0) {
        const hand = THREE.MathUtils.smoothstep(sd, 0, BEAT.handoffEnd);

        if (i === SKYDIVE_SLOT) {
          const exitUp = THREE.MathUtils.smoothstep(
            sd,
            BEAT.freefallEnd,
            BEAT.emptyEnd,
          );
          const drift = Math.sin(sd * Math.PI * 3);
          const skyScale =
            (viewport.height * (isMobile ? 0.4 : 0.52)) / CAN_HEIGHT;
          const breathe =
            0.96 + (Math.sin(sd * Math.PI * 5) * 0.5 + 0.5) * 0.08;

          can.position.x = THREE.MathUtils.lerp(
            can.position.x,
            drift * viewport.width * 0.08,
            hand,
          );
          can.position.y = THREE.MathUtils.lerp(
            can.position.y,
            Math.cos(sd * Math.PI * 2.2) * viewport.height * 0.05,
            hand,
          );
          can.position.y += exitUp * viewport.height * 1.4;
          can.position.z = THREE.MathUtils.lerp(can.position.z, 0, hand);
          can.scale.setScalar(
            THREE.MathUtils.lerp(can.scale.x, skyScale * breathe, hand),
          );

          // Tumble accumulates on top of wherever the cluster left it, so the
          // spin starts from the resting pose instead of snapping to zero.
          can.rotation.y += sd * SKY_Y_REVS * Math.PI * 2;
          can.rotation.x += Math.sin(sd * SKY_X_RATE * Math.PI * 2) * SKY_X_WOBBLE;
          can.rotation.z += Math.sin(sd * Math.PI * 4) * 0.12;
        } else {
          can.position.x += hand * viewport.width * 0.95;
          can.position.y += hand * viewport.height * 1.15;
          can.scale.multiplyScalar(1 - hand);
        }
      }

      // Cursor lean belongs to the hero pose only; it fades out the moment
      // the cans start travelling.
      const fade = 1 - THREE.MathUtils.smoothstep(p, 0, 0.15);
      const reach =
        isHeroPair && fade > 0.001 && pointer.active && !reducedMotion
          ? MAX_TILT * fade
          : 0;

      tilt.rotation.y = THREE.MathUtils.damp(
        tilt.rotation.y,
        pointer.x * reach,
        4,
        delta,
      );
      tilt.rotation.x = THREE.MathUtils.damp(
        tilt.rotation.x,
        pointer.y * reach,
        4,
        delta,
      );
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
            {/* Can clones its label material per instance, so four cans wear
                four different wraps rather than fighting over one. */}
            <Can flavor={FLAVOR_BY_SLOT[i]} position={[0, CAN_CENTER_Y, 0]} />
          </group>
        </group>
      ))}
    </group>
  );
}
