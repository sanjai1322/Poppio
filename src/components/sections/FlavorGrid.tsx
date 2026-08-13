"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS, type FlavorId } from "@/lib/flavors";
import { scrollToBeat } from "@/lib/flavorBeats";
import { SLAM_FROM, SLAM_IN, splitForSlam } from "@/lib/slam";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Map each flavour to its PNG in public/fruits/. */
const FRUIT_PNG: Record<FlavorId, string> = {
  mango: "/fruits/mango.png",
  guava: "/fruits/guava.png",
  pineapple: "/fruits/pineapple.png",
  dragon: "/fruits/dragonfruit.png",
};

export default function FlavorGrid() {
  const root = useRef<HTMLElement>(null!);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const heading = root.current.querySelector("h2");
        if (heading) {
          const split = splitForSlam(heading);
          gsap.fromTo(split.lines, SLAM_FROM, {
            ...SLAM_IN,
            scrollTrigger: { trigger: heading, start: "top 85%" },
          });
        }

        gsap.from("[data-card]", {
          y: 60,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-cards]", start: "top 80%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-cream/40">
          All four
        </p>
        <h2 className="wordmark mt-5 max-w-2xl text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] text-cream">
          Pick a side
        </h2>

        <ul
          data-cards
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FLAVORS.map((flavor, i) => (
            <li key={flavor.id}>
              {/* Scrolls to the beat's rest point; the flavour section's own
                  trigger then fires the same spin as a scroll would. */}
              <button
                type="button"
                data-card
                onClick={() => scrollToBeat(i)}
                className="group relative flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-3xl p-7 text-left transition-transform duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02]"
                style={{ backgroundColor: flavor.color }}
              >
                {/* Colour bleeding past the card edge on hover. Sits behind
                    the card's own background, so it only shows as a halo. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.25rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                  style={{ backgroundColor: flavor.color }}
                />
                <span className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/70">
                  No. {String(i + 1).padStart(2, "0")}
                </span>

                {/* Fruit illustration filling the upper portion of the card.
                    Cream-tinted at low opacity, bleeding off the top edge. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FRUIT_PNG[flavor.id]}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[15%] opacity-[0.18] transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ height: "65%", width: "auto", filter: "brightness(2.5) saturate(0.2)" }}
                />
                <span>
                  <span className="wordmark block text-3xl leading-[0.9] text-cream">
                    {flavor.name}
                  </span>
                  <span className="mt-3 block text-[0.7rem] uppercase tracking-[0.2em] text-cream/70">
                    {flavor.notes}
                  </span>
                  <span className="mt-4 block text-base text-cream">
                    {flavor.tagline}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
