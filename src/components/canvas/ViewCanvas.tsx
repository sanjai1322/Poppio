"use client";

import { Canvas } from "@react-three/fiber";
import { View, Preload } from "@react-three/drei";
import { usePerfTier } from "@/lib/usePerfTier";

/**
 * The one and only WebGL context. Fixed behind the content layer; every
 * section places its 3D by rendering a <View>, which this port draws into.
 *
 * Nothing is mounted at the Canvas root on purpose: View takes over the render
 * loop, so root-level objects would never be drawn.
 */
export default function ViewCanvas() {
  const { isMobile } = usePerfTier();

  return (
    <Canvas
      // Retina phones will happily render 3x and melt; 1.5 is plenty here.
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      gl={{
        antialias: !isMobile,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100svh",
        zIndex: 10,
        pointerEvents: "none",
      }}
      camera={{ position: [0, 0, 5], fov: 30 }}
    >
      <View.Port />
      <Preload all />
    </Canvas>
  );
}
