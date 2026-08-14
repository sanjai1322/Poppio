"use client";

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BEAT,
  SKYDIVE_END,
  SKYDIVE_ID,
  SKYDIVE_START,
  SKY_BOTTOM,
  SKY_TOP,
} from "@/lib/skydive";
import { FLAVORS } from "@/lib/flavors";
import { skydiveProgress } from "@/lib/scrollState";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Three depth layers with high travel factors so clouds actively rush past
 * the camera as the user scrolls, creating a true cinematic skydive.
 */
const LAYERS = [
  { key: "deep", count: 8, width: 28, blur: 6, opacity: 0.45, travel: 2.4 },
  { key: "mid", count: 10, width: 40, blur: 2, opacity: 0.75, travel: 3.8 },
  { key: "near", count: 6, width: 54, blur: 0, opacity: 0.85, travel: 5.6 },
] as const;

type Sprite = {
  layerIndex: number;
  /** Initial horizontal placement, in vw. */
  x: number;
  /** Starting Y within the repeating loop space, in vh. */
  baseY: number;
  scale: number;
  /** True for the occasional sunset-tinted cloud from the lower atmosphere. */
  pink: boolean;
};

const WORDS = [
  { text: "Dive", at: 0.15, top: "26%", justify: "flex-start", pad: "8vw" },
  { text: "Into", at: 0.35, top: "42%", justify: "center", pad: "0" },
  { text: "Better", at: 0.55, top: "58%", justify: "flex-end", pad: "8vw" },
] as const;

/** Cycle height in vh before a sprite wraps back to the top. */
const CYCLE = 160;

const CHAR_IN = 0.04;
const CHAR_OUT = 0.04;
const CHAR_STAGGER = 0.014;
const WORD_HOLD = 0.12;

const WORD_COLOR = "#FFF4E0";
/** All clouds are pure white for a clean cinematic sky. */

function hash(a: number, b: number): number {
  const sin = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return sin - Math.floor(sin);
}

function smoothstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

export default function SkydiveLayers() {
  const sprites = useRef<(HTMLDivElement | null)[]>([]);
  const chars = useRef<HTMLSpanElement[][]>([]);
  const plate = useRef<HTMLElement | null>(null);
  const sky = useRef<HTMLDivElement>(null!);
  const [active, setActive] = useState(false);
  const { isMobile } = usePerfTier();

  const layers = useMemo(
    () => (isMobile ? [LAYERS[0], LAYERS[2]] : LAYERS),
    [isMobile],
  );

  const field = useMemo<Sprite[]>(() => {
    const out: Sprite[] = [];
    layers.forEach((layer, layerIndex) => {
      const count = isMobile ? 5 : layer.count;
      for (let i = 0; i < count; i++) {
        out.push({
          layerIndex,
          x: hash(layerIndex + 1, i) * 88,
          baseY: (i / count) * CYCLE + hash(i, layerIndex + 3) * 30,
          scale: 0.75 + hash(i + 7, layerIndex) * 0.75,
          pink: false,
        });
      }
    });
    return out;
  }, [layers, isMobile]);

  useGSAP(
    () => {
      plate.current = document.getElementById("bg");

      // Initial positions for all clouds
      field.forEach((sprite, i) => {
        const el = sprites.current[i];
        if (!el) return;
        const raw = sprite.baseY;
        const wrapped = ((raw % CYCLE) + CYCLE) % CYCLE;
        el.style.transform = `translate3d(0vw, ${wrapped - 30}vh, 0) scale(${sprite.scale})`;
      });

      // 1. Handoff Trigger: from Meet All Four center to Skydive start
      ScrollTrigger.create({
        trigger: "#meet-all-four",
        start: "center center",
        endTrigger: "#" + SKYDIVE_ID,
        end: SKYDIVE_START,
        scrub: true,
        onLeaveBack: () => {
          setActive(false);
          if (sky.current) sky.current.style.opacity = "0";
          skydiveProgress.current = 0;
        },
        onUpdate: (self) => {
          if (skydiveProgress.current === 0) {
            const h = self.progress;
            if (sky.current) {
              sky.current.style.opacity = String(smoothstep(h, 0.35, 0.95));
            }
          }
        },
      });

      // 2. Main Skydive Pinned Section Trigger
      ScrollTrigger.create({
        trigger: "#" + SKYDIVE_ID,
        start: SKYDIVE_START,
        end: SKYDIVE_END,
        onToggle: (self) => {
          setActive(self.isActive);
          if (!self.isActive && sky.current && self.progress > 0.5) {
            sky.current.style.opacity = "0";
          }
        },
        onLeaveBack: () => {
          setActive(false);
          if (sky.current) sky.current.style.opacity = "0";
          skydiveProgress.current = 0;
        },
        onUpdate: (self) => {
          const p = self.progress;
          skydiveProgress.current = p;

          // Animate clouds streaming upward with intense parallax motion
          field.forEach((sprite, i) => {
            const el = sprites.current[i];
            if (!el) return;

            const layer = layers[sprite.layerIndex];
            const raw = sprite.baseY - p * layer.travel * 140;
            const wrapped = ((raw % CYCLE) + CYCLE) % CYCLE;
            const wrapIndex = Math.floor(raw / CYCLE);
            const jitterX = (hash(i, wrapIndex) - 0.5) * 24;
            const jitterScale = 0.85 + hash(i + 3, wrapIndex) * 0.45;

            el.style.transform = `translate3d(${jitterX}vw, ${wrapped - 30}vh, 0) scale(${sprite.scale * jitterScale})`;
          });

          // Words rising and tumbling out in sequence
          WORDS.forEach((word, i) => {
            const letters = chars.current[i];
            if (!letters) return;

            letters.forEach((el, c) => {
              if (!el) return;
              const inAt = word.at + c * CHAR_STAGGER;
              const outAt = word.at + WORD_HOLD + c * CHAR_STAGGER * 0.6;

              const rising = smoothstep(p, inAt, inAt + CHAR_IN);
              const leaving = smoothstep(p, outAt, outAt + CHAR_OUT);

              const y = (1 - rising) * 120 - leaving * 120;
              const tilt = (1 - rising) * 10 - leaving * 8;

              el.style.transform = `translate3d(0, ${y}%, 0) rotate(${tilt}deg)`;
              el.style.opacity = String(rising * (1 - leaving));
            });
          });

          // Smooth handover to flavor section background at the end of skydive
          const handover = smoothstep(p, BEAT.emptyEnd, 1);
          if (sky.current) {
            sky.current.style.opacity = String(1 - handover);
          }
          if (plate.current) {
            plate.current.style.background = FLAVORS[3].gradient;
          }
        },
      });
    },
    { dependencies: [field, layers] },
  );

  const shown = active ? 1 : 0;

  return (
    <div aria-hidden>
      {/* Sky background */}
      <div
        ref={sky}
        id="skydive-sky"
        className="pointer-events-none fixed inset-0 z-[6]"
        style={{
          opacity: 0,
          background: `linear-gradient(180deg, ${SKY_TOP} 0%, ${SKY_BOTTOM} 100%)`,
        }}
      />

      {/* Back atmospheric clouds (behind the 3D can) */}
      <div
        className="pointer-events-none fixed inset-0 z-[8] overflow-hidden transition-opacity duration-500"
        style={{ opacity: shown }}
      >
        {field.map((sprite, i) =>
          layers[sprite.layerIndex].key === "near" ? null : (
            <div
              key={i}
              ref={(el) => {
                sprites.current[i] = el;
              }}
              className="cloud absolute aspect-[2/1] will-change-transform"
              style={{
                left: sprite.x + "%",
                width: layers[sprite.layerIndex].width + "vw",
                opacity: layers[sprite.layerIndex].opacity,
                filter: "blur(" + layers[sprite.layerIndex].blur + "px)",
                color: "#FFFFFF",
              }}
            />
          ),
        )}
      </div>

      {/* Typography block */}
      <div
        className="pointer-events-none fixed inset-0 z-[9] transition-opacity duration-500"
        style={{ opacity: shown }}
      >
        {WORDS.map((word, i) => (
          <span
            key={word.text}
            className="wordmark absolute inset-x-0 flex text-[clamp(3rem,15vw,15rem)] md:text-[clamp(4.5rem,18vw,15rem)] leading-[0.85] font-black uppercase tracking-wider"
            style={{
              top: word.top,
              color: WORD_COLOR,
              justifyContent: word.justify,
              paddingLeft: word.justify === "flex-start" ? word.pad : undefined,
              paddingRight: word.justify === "flex-end" ? word.pad : undefined,
              letterSpacing: "0.04em",
              WebkitTextStroke: "1px rgba(255, 244, 224, 0.15)",
              textShadow: "0 0.05em 0.6em rgba(20, 50, 120, 0.28)",
            }}
          >
            {word.text.split("").map((letter, c) => (
              <span key={c} className="inline-block overflow-hidden py-[0.08em]">
                <span
                  ref={(el) => {
                    if (!el) return;
                    if (!chars.current[i]) chars.current[i] = [];
                    chars.current[i][c] = el;
                  }}
                  className="inline-block will-change-transform"
                  style={{ opacity: 0 }}
                >
                  {letter}
                </span>
              </span>
            ))}
          </span>
        ))}
      </div>

      {/* Near clouds (cross in front of canvas with natural gentle transparency) */}
      <div
        className="pointer-events-none fixed inset-0 z-[15] overflow-hidden transition-opacity duration-500"
        style={{ opacity: shown }}
      >
        {field.map((sprite, i) =>
          layers[sprite.layerIndex].key === "near" ? (
            <div
              key={i}
              ref={(el) => {
                sprites.current[i] = el;
              }}
              className="cloud absolute aspect-[2/1] will-change-transform"
              style={{
                left: sprite.x + "%",
                width: layers[sprite.layerIndex].width + "vw",
                opacity: layers[sprite.layerIndex].opacity * 0.6,
                filter: "blur(" + layers[sprite.layerIndex].blur + "px)",
                color: "#FFFFFF",
              }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
