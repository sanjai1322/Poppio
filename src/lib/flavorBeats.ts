import { FLAVORS } from "./flavors";
import { scrollToY } from "./lenisStore";

/**
 * Scroll position where a beat sits at rest — the middle of its slice, where
 * the can has settled front-on and the copy has landed.
 */
export function beatScrollY(index: number) {
  const section = document.getElementById("flavours");
  if (!section) return 0;

  const range = section.offsetHeight - window.innerHeight;
  return Math.round(
    section.offsetTop + range * ((index + 0.5) / FLAVORS.length),
  );
}

export function scrollToBeat(index: number) {
  scrollToY(beatScrollY(index));
}
