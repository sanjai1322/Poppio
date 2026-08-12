"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Lenis owns the scroll position; ScrollTrigger reads it. Without handing
 * ScrollTrigger.update to Lenis and driving Lenis off the GSAP ticker, the two
 * run on separate clocks and pinned sections judder against the smoothing.
 */
export default function SmoothScroll() {
  useGSAP(() => {
    // `anchors` routes in-page links through Lenis; a native jump would fight
    // the smoothing and desync every scrubbed ScrollTrigger on the way past.
    const lenis = new Lenis({ lerp: 0.1, anchors: true });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
