"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external stores for the two facts several unrelated layers need to
 * agree on: which flavour is live, and whether the flavour section is on
 * screen at all.
 *
 * These can't be React state lifted into a parent. The backdrop and the nav
 * render *outside* <main>, because anything inside its z-20 stacking context
 * can never paint behind the fixed canvas at z-10. An external store lets
 * them subscribe without a provider wrapping the whole tree.
 */
function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const activeFlavorStore = createStore(0);
export const flavorSectionStore = createStore(false);

export function useActiveFlavor() {
  return useSyncExternalStore(
    activeFlavorStore.subscribe,
    activeFlavorStore.get,
    () => 0,
  );
}

export function useFlavorSectionActive() {
  return useSyncExternalStore(
    flavorSectionStore.subscribe,
    flavorSectionStore.get,
    () => false,
  );
}
