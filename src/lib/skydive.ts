/**
 * One definition of the skydive's scroll window, shared by the pin, the DOM
 * layers, and the can's motion inside the canvas.
 *
 * These must agree exactly. If the pin releases on a different scroll offset
 * than the animation ends on, the can keeps travelling after the section has
 * let go — or freezes before it.
 */
export const SKYDIVE_ID = "skydive";
export const SKYDIVE_START = "top top";
/** Viewport heights of pinned scrolling. */
export const SKYDIVE_END = "+=400%";

/** Sky the section cross-fades to over the handoff beat. */
export const SKY_TOP = "#A9E2EC";
export const SKY_BOTTOM = "#E8FAFB";

/**
 * Beat boundaries, as scroll progress through the pinned range.
 * Named so the DOM layers and the 3D can read the same numbers.
 */
export const BEAT = {
  handoffEnd: 0.12,
  freefallEnd: 0.75,
  emptyEnd: 0.88,
} as const;
