"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CREAM, FLAVORS } from "@/lib/flavors";
import { usePerfTier } from "@/lib/usePerfTier";

/** Vertical half-span the smoke travels through, in world units. */
const SPAN = 9;

const between = (min: number, max: number) => min + Math.random() * (max - min);

type Puff = {
  x: number;
  y: number;
  z: number;
  scale: number;
  ember: boolean;
  plume: boolean;
};

/**
 * Camera-facing quads. Billboarding happens in the vertex shader rather than by
 * rotating each instance on the CPU: the instance matrix contributes only its
 * translation and scale, and the quad is expanded in view space so it always
 * faces the camera without a per-frame lookAt.
 *
 * Opacity is derived from world height here too, so a puff fades up out of the
 * bottom of frame and dissolves before the top without any per-frame attribute
 * upload.
 */
const vertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aKind;
  attribute vec3 aColor;

  uniform float uSpan;

  varying vec2 vUv;
  varying float vSeed;
  varying float vKind;
  varying vec3 vColor;
  varying float vFade;

  void main() {
    vUv = uv;
    vSeed = aSeed;
    vKind = aKind;
    vColor = aColor;

    float worldY = instanceMatrix[3].y;
    // In low, out high: smoke thins as it climbs instead of popping away.
    vFade =
      smoothstep(-uSpan, -uSpan * 0.45, worldY) *
      (1.0 - smoothstep(uSpan * 0.15, uSpan * 0.95, worldY));

    vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float sx = length(instanceMatrix[0].xyz);
    float sy = length(instanceMatrix[1].xyz);
    mv.xy += position.xy * vec2(sx, sy);

    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * Smoke is a soft radial mask multiplied by fbm, so the edge dissolves into
 * wisps instead of ending on the circle. Embers reuse the same quad as a hard
 * disc — that's what keeps the whole field to one draw call.
 */
const fragmentShader = /* glsl */ `
  uniform float uTime;

  varying vec2 vUv;
  varying float vSeed;
  varying float vKind;
  varying vec3 vColor;
  varying float vFade;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p) * 2.0;

    if (vKind > 1.5) {
      // Ambient haze: wide, weak, only there to give the frame depth.
      float n = fbm(p * 2.4 + vec2(vSeed * 5.1, vSeed - uTime * 0.03));
      float mask = smoothstep(1.05, 0.1, d);
      gl_FragColor = vec4(vColor, mask * mask * (0.2 + 0.8 * n) * vFade * 0.16);
    } else if (vKind > 0.5) {
      float alpha = smoothstep(1.0, 0.86, d) * vFade;
      float key = 0.6 + 0.4 * smoothstep(1.2, 0.0, length(p - vec2(-0.13, 0.15)) * 2.0);
      gl_FragColor = vec4(vColor * key, alpha);
    } else {
      // Drift the noise field downward over time so the smoke curls upward.
      float n = fbm(p * 3.6 + vec2(vSeed * 7.3, vSeed - uTime * 0.055));
      // Raising the noise to a power carves holes in it, which is the
      // difference between wisps and a uniform grey disc.
      float wisp = pow(n, 1.8);
      float mask = smoothstep(1.05, 0.12, d);
      gl_FragColor = vec4(vColor, mask * mask * wisp * vFade * 1.15);
    }

    if (gl_FragColor.a < 0.01) discard;
  }
`;

export default function SmokeField({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const material = useRef<THREE.ShaderMaterial>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { reducedMotion } = usePerfTier();

  const puffs = useMemo<Puff[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const ember = Math.random() < 0.16;
        // Most of the smoke hugs the flight line as a column; the rest is
        // ambient haze giving the frame depth.
        const plume = !ember && i % 3 !== 0;
        return {
          x: plume ? between(-2.4, 2.4) : between(-12, 12),
          y: between(-SPAN, SPAN),
          z: plume ? between(-4, 1) : between(-18, -6),
          // Small enough to stay separate. Oversized puffs overlap into a flat
          // milky wash and you lose both the plume and any sense of motion.
          scale: ember ? between(0.2, 0.36) : plume ? between(1.5, 3.4) : between(3, 6),
          ember,
          plume,
        };
      }),
    [count],
  );

  const attributes = useMemo(() => {
    const seed = new Float32Array(count);
    const kind = new Float32Array(count);
    const color = new Float32Array(count * 3);
    const tint = new THREE.Color();

    puffs.forEach((puff, i) => {
      seed[i] = Math.random() * 10;
      kind[i] = puff.ember ? 1 : puff.plume ? 0 : 2;
      tint.set(
        puff.ember
          ? FLAVORS[Math.floor(Math.random() * FLAVORS.length)].color
          : CREAM,
      );
      tint.toArray(color, i * 3);
    });

    return { seed, kind, color };
  }, [count, puffs]);

  useGSAP(
    () => {
      // Smoke rises. Each puff runs its own infinitely repeating climb, seeded
      // at a random progress so the column is already full on the first frame
      // and never visibly restarts.
      puffs.forEach((puff) => {
        const climb = gsap.fromTo(
          puff,
          { y: -SPAN },
          {
            y: SPAN,
            duration: puff.ember ? between(7, 13) : between(16, 30),
            ease: "none",
            repeat: -1,
            onRepeat: () => {
              puff.x = puff.ember
                ? between(-3, 3)
                : puff.x + between(-0.6, 0.6);
            },
          },
        );
        climb.progress(Math.random());

        gsap.to(puff, {
          x: `+=${between(-2.2, 2.2)}`,
          duration: between(9, 18),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        if (reducedMotion) climb.pause();
      });
    },
    { dependencies: [puffs, reducedMotion] },
  );

  useFrame((state) => {
    material.current.uniforms.uTime.value = state.clock.elapsedTime;

    puffs.forEach((puff, i) => {
      dummy.position.set(puff.x, puff.y, puff.z);
      // Smoke expands as it climbs, the way a plume thins out with height.
      const life = (puff.y + SPAN) / (SPAN * 2);
      dummy.scale.setScalar(puff.scale * (puff.ember ? 1 : 0.65 + life * 0.85));
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
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute
          attach="attributes-aSeed"
          args={[attributes.seed, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aKind"
          args={[attributes.kind, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aColor"
          args={[attributes.color, 3]}
        />
      </planeGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 }, uSpan: { value: SPAN } }}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
}
