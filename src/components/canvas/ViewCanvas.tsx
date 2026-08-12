"use client";

import { Canvas } from "@react-three/fiber";
import { View, Preload } from "@react-three/drei";

/**
 * The one and only WebGL context. Fixed behind the content layer; every
 * section places its 3D by rendering a <View>, which this port draws into.
 */
export default function ViewCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
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
