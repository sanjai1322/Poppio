"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type BubblesProps = {
  count: number;
  /** Box the particles live in, in world units. */
  area: [number, number, number];
  /** Base radius before per-particle variation. */
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
 * Generate a soft radial gradient texture at runtime — a bright centre that
 * falls off to transparent at the edges. This reads as lens bokeh rather than
 * a hard geometric sphere.
 */
function createBokehTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  );
  // Soft bright core → gentle falloff → transparent edge
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.15, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.35)");
  gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.08)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Soft bokeh-style light particles. Uses instanced planes with a radial-
 * gradient alpha map and additive blending so overlapping dots glow rather
 * than stack opaque. Much smaller than the old sphere bubbles, with per-
 * instance opacity variation for natural depth.
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
  const material = useRef<THREE.MeshBasicMaterial>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const bokehMap = useMemo(() => createBokehTexture(), []);

  const particles = useMemo(() => {
    const random = makeRandom(seed);
    const [ax, ay, az] = area;

    return Array.from({ length: count }, () => ({
      x: (random() - 0.5) * ax,
      y: (random() - 0.5) * ay,
      z: (random() - 0.5) * az,
      // Wider size range: some tiny specks, a few larger spots
      scale: 0.15 + random() * 0.85,
      speed: 0.2 + random() * 0.8,
      phase: random() * Math.PI * 2,
      sway: 0.02 + random() * 0.08,
      // Per-particle opacity multiplier for depth variation
      alphaScale: 0.3 + random() * 0.7,
      // Individual pulse speed so they don't breathe in unison
      pulseSpeed: 0.3 + random() * 0.6,
      pulsePhase: random() * Math.PI * 2,
    }));
  }, [count, area, seed]);

  useFrame((state, delta) => {
    const [, ay] = area;
    const time = state.clock.elapsedTime;
    const step = Math.min(delta, 0.05);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.y += step * p.speed * rise;
      if (p.y > ay / 2) p.y = -ay / 2;

      // Gentle breathing scale
      const pulse = 1 + Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.15;

      dummy.position.set(
        p.x + Math.sin(time * 0.4 + p.phase) * p.sway,
        p.y,
        p.z,
      );
      dummy.scale.setScalar(p.scale * radius * pulse);
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
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        ref={material}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        alphaMap={bokehMap}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
