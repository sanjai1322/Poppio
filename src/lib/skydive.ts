/**
 * One definition of the skydive's scroll window, shared by the pin and by the
 * can's motion timeline inside the canvas.
 *
 * These must agree exactly. If the pin releases on a different scroll offset
 * than the animation ends on, the can keeps travelling after the section has
 * let go — or freezes before it.
 */
export const SKYDIVE_ID = "skydive";
export const SKYDIVE_START = "top top";
/** Viewport heights of pinned scrolling. */
export const SKYDIVE_END = "+=150%";
