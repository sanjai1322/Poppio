/**
 * Scroll progress shared from GSAP's scrub into the render loop.
 *
 * Deliberately a mutable ref rather than React state: this updates every frame,
 * and routing it through setState would re-render the tree at 60fps. Discrete
 * changes (which flavour is active) do go through state — those happen 3 times.
 */
export const flavorProgress = { current: 0 };
export const carbonationProgress = { current: 0 };

/**
 * Extra Y rotation, in radians, applied to the flavour-scroll can on top of its
 * front-facing rest pose. GSAP tweens this on each beat change; the render loop
 * reads it. Not scroll-linked any more — the spin is an event.
 */
export const canSpin = { current: 0 };
