import { FLAVORS } from "@/lib/flavors";

/**
 * Full-viewport colour plate sitting behind the shared canvas.
 * Scroll cross-fades this between flavour colours (see FlavorScroll).
 */
export default function Background() {
  return (
    <div
      id="bg"
      aria-hidden
      className="fixed inset-0 z-0"
      style={{ backgroundColor: FLAVORS[0].color }}
    />
  );
}
