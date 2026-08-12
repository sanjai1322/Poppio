"use client";

import { useEffect, useState } from "react";

export type PerfTier = {
  isMobile: boolean;
  reducedMotion: boolean;
};

const QUERIES = {
  isMobile: "(max-width: 767px)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

/**
 * Starts at the desktop/full-motion defaults and corrects after mount — the
 * server has no viewport to measure, so anything else would hydrate-mismatch.
 */
export function usePerfTier(): PerfTier {
  const [tier, setTier] = useState<PerfTier>({
    isMobile: false,
    reducedMotion: false,
  });

  useEffect(() => {
    const lists = {
      isMobile: window.matchMedia(QUERIES.isMobile),
      reducedMotion: window.matchMedia(QUERIES.reducedMotion),
    };

    const update = () =>
      setTier({
        isMobile: lists.isMobile.matches,
        reducedMotion: lists.reducedMotion.matches,
      });

    update();
    lists.isMobile.addEventListener("change", update);
    lists.reducedMotion.addEventListener("change", update);

    return () => {
      lists.isMobile.removeEventListener("change", update);
      lists.reducedMotion.removeEventListener("change", update);
    };
  }, []);

  return tier;
}
