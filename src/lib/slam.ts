import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * Headlines don't fade in, they get pushed into place from below.
 *
 * The mask is the whole trick: each line sits in an overflow-hidden wrapper, so
 * the glyphs are clipped to the line box and nothing ghosts above or below it
 * on the way in.
 */
export const SLAM_IN = {
  yPercent: 0,
  autoAlpha: 1,
  duration: 1.1,
  stagger: 0.08,
  ease: "power4.out",
} as const;

export const SLAM_FROM = { yPercent: 120, autoAlpha: 0 } as const;

/** Faster, tighter exit — the outgoing line shouldn't hold up the incoming. */
export const SLAM_OUT = {
  yPercent: -120,
  autoAlpha: 0,
  duration: 0.45,
  stagger: 0.04,
  ease: "power3.in",
} as const;

type SplitKind = "lines" | "words";

/**
 * Split an element into masked lines or words, ready to be slammed.
 * `autoSplit` re-splits on resize and after webfonts land, which matters here:
 * Archivo Black arrives late and would otherwise leave the split measuring the
 * fallback face's line breaks.
 */
export function splitForSlam(element: Element, type: SplitKind = "lines") {
  return new SplitText(element, {
    type,
    mask: type,
    autoSplit: true,
    linesClass: "slam-line",
    wordsClass: "slam-word",
  });
}
