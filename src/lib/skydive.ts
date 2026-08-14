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

/**
 * Sky the section cross-fades to over the handoff beat.
 *
 * A deep blue at altitude easing to haze at the horizon. The previous
 * near-white pair gave the cream clouds and the cyan can nothing to sit
 * against — everything washed into everything else.
 */
export const SKY_TOP = "#2E6BE6";
export const SKY_BOTTOM = "#BFE6F5";

/**
 * Beat boundaries, as scroll progress through the pinned range.
 * Named so the DOM layers and the 3D can read the same numbers.
 */
export const BEAT = {
  handoffEnd: 0.12,
  freefallEnd: 0.75,
  emptyEnd: 0.88,
} as const;
