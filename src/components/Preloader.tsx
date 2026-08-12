"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { FLAVORS } from "@/lib/flavors";

/**
 * Covers the page until the can and its wraps have decoded, so the 3D doesn't
 * pop in after the copy has already painted.
 *
 * `useProgress` reads three's loading manager, which is what useGLTF and
 * useTexture feed. The timeout is a hard guarantee: if WebGL is unavailable or
 * an asset 404s, progress never reaches 100 and the overlay must not trap the
 * page behind it.
 */
export default function Preloader() {
  const { progress } = useProgress();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (progress < 100) return;
    const timer = setTimeout(() => setDone(true), 400);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    const bail = setTimeout(() => setDone(true), 8000);
    return () => clearTimeout(bail);
  }, []);

  return (
    <div
      aria-hidden={done}
      role="status"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700"
      style={{
        backgroundColor: FLAVORS[0].color,
        opacity: done ? 0 : 1,
        pointerEvents: done ? "none" : "auto",
      }}
    >
      <p className="wordmark text-[clamp(3rem,14vw,10rem)] leading-none text-cream">
        POPPIO
      </p>
      <div className="mt-8 h-px w-40 overflow-hidden bg-cream/30">
        <div
          className="h-full origin-left bg-cream transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${Math.min(progress, 100) / 100})` }}
        />
      </div>
    </div>
  );
}
