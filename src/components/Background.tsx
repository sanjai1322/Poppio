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
      className="fixed inset-0 z-0 transition-all duration-700 ease-in-out"
      style={{
        background: FLAVORS[0].gradient,
      }}
    />
  );
}
