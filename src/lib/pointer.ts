"use client";

import { useEffect } from "react";

/**
 * Normalised pointer position, -1..1 from the viewport centre.
 *
 * A module ref rather than state: the render loop reads it every frame, and
 * `active` decays the tilt back to rest when the pointer leaves the window.
 */
export const pointer = { x: 0, y: 0, active: false };

/**
 * The canvas is pointer-events:none so it never swallows clicks, which means
 * R3F's own pointer events never fire — tracking has to happen on the window.
 */
export function usePointerTracking() {
  useEffect(() => {
    const move = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    };

    const leave = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);

    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
}
