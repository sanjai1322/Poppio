"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { usePerfTier } from "@/lib/usePerfTier";

/**
 * Per-View lighting. Each drei <View> renders into its own scene, so this has
 * to be mounted inside every view rather than once at the canvas root.
 * The environment is built from lightformers — no HDR fetched from a CDN.
 */
export default function Lighting() {
  const { isMobile } = usePerfTier();

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />

      <Environment resolution={isMobile ? 64 : 128}>
        <Lightformer
          form="rect"
          intensity={5}
          position={[0, 2.5, 4]}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.5}
          position={[-5, 1, 1]}
          rotation-y={Math.PI / 2}
          scale={[6, 5, 1]}
        />
        <Lightformer
          form="ring"
          intensity={3}
          position={[4, 3, -2]}
          scale={4}
        />
      </Environment>
    </>
  );
}
