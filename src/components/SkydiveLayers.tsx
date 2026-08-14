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
 * Three depth layers. Travel is the factor multiplied by the section's scroll
 * progress: higher numbers blow past the camera, lower ones drift behind.
 */
const LAYERS = [
  { key: "deep", count: 7, width: 22, blur: 6, opacity: 0.35, travel: 1.4 },
  { key: "mid", count: 8, width: 34, blur: 2, opacity: 0.7, travel: 2.3 },
  { key: "near", count: 6, width: 42, blur: 0, opacity: 0.8, travel: 3.8 },
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
  { text: "Dive", at: 0.16, top: "28%", justify: "flex-start", pad: "6vw" },
  { text: "Into", at: 0.36, top: "42%", justify: "center" },
  { text: "Better", at: 0.54, top: "56%", justify: "flex-end", pad: "6vw" },
] as const;

/** Cycle height in vh before a sprite wraps back to the top. */
const CYCLE = 140;

const CHAR_IN = 0.035;
const CHAR_OUT = 0.035;
const CHAR_STAGGER = 0.012;
const WORD_HOLD = 0.11;

const WORD_ORANGE = "#FFF4E0";
const DUSTY_PINK = "#F2B8B2";

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
  const sprites = useRef<HTMLDivElement[]>([]);
  const chars = useRef<HTMLSpanElement[][]>([]);
  const plate = useRef<HTMLElement | null>(null);
  const sky = useRef<HTMLDivElement>(null!);
  const [active, setActive] = useState(false);
  const { isMobile } = usePerfTier();

  // Mobile keeps the parallax but drops the middle layer and thins the pool.
  const layers = useMemo(
    () => (isMobile ? [LAYERS[0], LAYERS[2]] : LAYERS),
    [isMobile],
  );

  const field = useMemo<Sprite[]>(() => {
    const out: Sprite[] = [];
    layers.forEach((layer, layerIndex) => {
      const count = isMobile ? 4 : layer.count;
      for (let i = 0; i < count; i++) {
        out.push({
          layerIndex,
          x: hash(layerIndex + 1, i) * 90,
          baseY: (i / count) * CYCLE + hash(i, layerIndex + 3) * 26,
          scale: 0.75 + hash(i + 7, layerIndex) * 0.7,
          pink: hash(i + 11, layerIndex + 5) > 0.62,
        });
      }
    });
    return out;
  }, [layers, isMobile]);

  useGSAP(
    () => {
      plate.current = document.getElementById("bg");

      // 1. Handoff Trigger
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

      // 2. Skydive Pinned Section Trigger
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

          field.forEach((sprite, i) => {
            const el = sprites.current[i];
            if (!el) return;

            const layer = layers[sprite.layerIndex];
            const raw = sprite.baseY - p * layer.travel;
            const wrapped = ((raw % CYCLE) + CYCLE) % CYCLE;
            const wrapIndex = Math.floor(raw / CYCLE);
            const jitterX = (hash(i, wrapIndex) - 0.5) * 24;
            const jitterScale = 0.85 + hash(i + 3, wrapIndex) * 0.5;

            el.style.transform =
              "translate3d(" +
              jitterX +
              "vw," +
              (wrapped - 25) +
              "vh,0) scale(" +
              sprite.scale * jitterScale +
              ")";
          });

          WORDS.forEach((word, i) => {
            const letters = chars.current[i];
            if (!letters) return;

            letters.forEach((el, c) => {
              if (!el) return;
              const inAt = word.at + c * CHAR_STAGGER;
              const outAt = word.at + WORD_HOLD + c * CHAR_STAGGER * 0.6;

              const rising = smoothstep(p, inAt, inAt + CHAR_IN);
              const leaving = smoothstep(p, outAt, outAt + CHAR_OUT);

              const y = (1 - rising) * 115 - leaving * 115;
              const tilt = (1 - rising) * 9 - leaving * 7;

              el.style.transform =
                "translate3d(0," + y + "%,0) rotate(" + tilt + "deg)";
              el.style.opacity = String(rising * (1 - leaving));
            });
          });

          // Hand straight from sky to the first flavour's colour at the end of skydive
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
      {/* Sky. Pale and high-key on purpose — clouds and can carry the frame. */}
      <div
        ref={sky}
        id="skydive-sky"
        className="pointer-events-none fixed inset-0 z-[6]"
        style={{
          opacity: 0,
          background:
            "linear-gradient(180deg, " + SKY_TOP + " 0%, " + SKY_BOTTOM + " 100%)",
        }}
      />

      {/* Back clouds — under the canvas, so the can passes in front of them. */}
      <div
        className="pointer-events-none fixed inset-0 z-[8] overflow-hidden transition-opacity duration-500"
        style={{ opacity: shown }}
      >
        {field.map((sprite, i) =>
          layers[sprite.layerIndex].key === "near" ? null : (
            <div
              key={i}
              ref={(el) => {
                if (el) sprites.current[i] = el;
              }}
              className="cloud absolute aspect-[2/1]"
              style={{
                left: sprite.x + "%",
                width: layers[sprite.layerIndex].width + "vw",
                opacity: layers[sprite.layerIndex].opacity,
                filter: "blur(" + layers[sprite.layerIndex].blur + "px)",
                color: sprite.pink ? DUSTY_PINK : "#FFFFFF",
              }}
            />
          ),
        )}
      </div>

      {/* Words — under the canvas so the can occludes them. */}
      <div
        className="pointer-events-none fixed inset-0 z-[9] transition-opacity duration-500"
        style={{ opacity: shown }}
      >
        {WORDS.map((word, i) => (
          <span
            key={word.text}
            className="wordmark absolute inset-x-0 flex text-[clamp(5rem,20vw,17rem)] leading-[0.82]"
            style={{
              top: word.top,
              color: WORD_ORANGE,
              justifyContent: word.justify,
              paddingLeft: word.justify === "flex-start" ? word.pad : undefined,
              paddingRight: word.justify === "flex-end" ? word.pad : undefined,
              letterSpacing: "0.04em",
              WebkitTextStroke: "1px rgba(255, 244, 224, 0.08)",
              textShadow: "0 0.04em 0.8em rgba(46, 107, 230, 0.18)",
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

      {/* Near clouds — over the canvas, so they cross in front of the can. */}
      <div
        className="pointer-events-none fixed inset-0 z-[15] overflow-hidden transition-opacity duration-500"
        style={{ opacity: shown }}
      >
        {field.map((sprite, i) =>
          layers[sprite.layerIndex].key === "near" ? (
            <div
              key={i}
              ref={(el) => {
                if (el) sprites.current[i] = el;
              }}
              className="cloud absolute aspect-[2/1]"
              style={{
                left: sprite.x + "%",
                width: layers[sprite.layerIndex].width + "vw",
                opacity: layers[sprite.layerIndex].opacity * 0.45,
                filter: "blur(" + layers[sprite.layerIndex].blur + "px)",
                color: sprite.pink ? DUSTY_PINK : "#FFFFFF",
              }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
