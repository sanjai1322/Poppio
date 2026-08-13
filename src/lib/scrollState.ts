/**
 * Scroll progress shared from GSAP's scrub into the render loop.
 *
 * Deliberately a mutable ref rather than React state: this updates every frame,
 * and routing it through setState would re-render the tree at 60fps. Discrete
 * changes (which flavour is active) do go through state — those happen 3 times.
 */
export const flavorProgress = { current: 0 };
export const carbonationProgress = { current: 0 };

/** 0 = hero layout, 1 = cluster layout. Written by MeetAllFour's ScrollTrigger. */
export const clusterProgress = { current: 0 };

/**
 * Extra Y rotation, in radians, applied to the flavour-scroll can on top of its
 * front-facing rest pose. GSAP tweens this on each beat change; the render loop
 * reads it. Not scroll-linked any more — the spin is an event.
 */
export const canSpin = { current: 0 };

/**
 * Scroll progress through the pinned skydive range. Read by the can in the
 * canvas and by the DOM cloud field, which must move as one.
 */
export const skydiveProgress = { current: 0 };

/**
 * Camera distance offset for the flavour scroll, in world units, added to the
 * camera's resting Z. Negative is closer. Each beat change pulls back and eases
 * in, so every flavour arrives as its own shot rather than a texture swap on a
 * static frame.
 *
 * Mutated per frame, so it lives here rather than in React state — and moving
 * the camera directly does not touch R3F's `viewport`, so the can's scale stays
 * put and the push-in actually reads as a change in distance.
 */
export const cameraDolly = { current: 0 };
