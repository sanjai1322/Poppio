import type Lenis from "lenis";

/**
 * Handle on the live Lenis instance.
 *
 * Lenis owns the scroll position, so anything that wants to move the page —
 * the flavour grid jumping to a beat, for one — has to go through it.
 * `window.scrollTo` gets overridden and fought back to Lenis's own target.
 */
let instance: Lenis | null = null;

export function setLenis(next: Lenis | null) {
  instance = next;
}

export function getLenis() {
  return instance;
}

export function scrollToY(y: number, immediate = false) {
  const lenis = getLenis();

  if (lenis) {
    lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.4 });
    return;
  }

  // Reduced motion tears Lenis down; fall back to the native scroller.
  window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}
