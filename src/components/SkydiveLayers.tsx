"use client";

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INK } from "@/lib/flavors";
import { skydiveProgress } from "@/lib/scrollState";
import {
  BEAT,
  SKYDIVE_END,
  SKYDIVE_ID,
  SKYDIVE_START,
  SKY_BOTTOM,
  SKY_TOP,
} from "@/lib/skydive";
import { usePerfTier } from "@/lib/usePerfTier";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Depth layers. `travel` is how far a sprite climbs across the section, in
 * viewport heights — the near layer covers 2.5x the far layer's distance, and
 * that spread is the entire sense of depth. Narrow it and the frame flattens.
 */
const LAYERS = [
  { key: "far", count: 5, width: 22, opacity: 0.45, blur: 12, travel: 100 },
  { key: "mid", count: 5, width: 34, opacity: 0.62, blur: 20, travel: 175 },
  { key: "near", count: 4, width: 64, opacity: 0.8, blur: 36, travel: 250 },
] as const;

const CYCLE = 150;
const DUSTY_PINK = "#F2D4DC";
const WORD_ORANGE = "#F97316";

/** Deterministic jitter, so scrubbing back up retraces the same field. */
function hash(a: number, b: number) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothstep(x: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const WORDS = [
  { text: "Dive", at: 0.22, top: "20%" },
  { text: "Into", at: 0.4, top: "22%" },
  { text: "Better", at: 0.58, top: "60%" },
];

/**
 * Letter-by-letter timing, in scroll progress rather than seconds — the words
 * are scrubbed, so a letter that has entered must un-enter if you scroll back.
 */
const CHAR_STAGGER = 0.011;
const CHAR_IN = 0.055;
const CHAR_OUT = 0.045;
/** How long a word holds after its last letter lands. */
const WORD_HOLD = 0.13;

type Sprite = {
  layerIndex: number;
  x: number;
  baseY: number;
  scale: number;
  pink: boolean;
};

/**
 * Everything in the skydive that is not the can: sky, clouds, words and the
 * exit sweep.
 *
 * It lives outside <main> because the pieces have to straddle the canvas —
 * words and the back clouds paint under it so the can occludes them, the near
 * clouds paint over it so they cross in front of the can.
 */
export default function SkydiveLayers() {
  const sprites = useRef<HTMLDivElement[]>([]);
  const chars = useRef<HTMLSpanElement[][]>([]);
  const exit = useRef<HTMLDivElement>(null!);
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
      ScrollTrigger.create({
        trigger: "#" + SKYDIVE_ID,
        start: SKYDIVE_START,
        end: SKYDIVE_END,
        onToggle: (self) => {
          setActive(self.isActive);
          // onUpdate stops firing the moment the section deactivates, so the
          // sky has to be cleared here or it stays painted over every section
          // that follows.
          if (!self.isActive && sky.current) sky.current.style.opacity = "0";
        },
        onUpdate: (self) => {
          const p = self.progress;
          skydiveProgress.current = p;

          field.forEach((sprite, i) => {
            const el = sprites.current[i];
            if (!el) return;

            const layer = layers[sprite.layerIndex];
            const raw = sprite.baseY - p * layer.travel;
            // Modulo recycling rather than a snap-back branch: it wraps in
            // both directions, so scrubbing back retraces the same field.
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

          // One word at a time, each cascading out as the next arrives. The
          // letters carry the motion rather than the word block: each rises
          // out of its own mask on a stagger, so the type reads as set rather
          // than as a caption fading up.
          WORDS.forEach((word, i) => {
            const letters = chars.current[i];
            if (!letters) return;

            letters.forEach((el, c) => {
              if (!el) return;
              const inAt = word.at + c * CHAR_STAGGER;
              const outAt = word.at + WORD_HOLD + c * CHAR_STAGGER * 0.6;

              const rising = smoothstep(p, inAt, inAt + CHAR_IN);
              const leaving = smoothstep(p, outAt, outAt + CHAR_OUT);

              // Clipped by the mask, so nothing shows outside the line box.
              const y = (1 - rising) * 115 - leaving * 115;
              const tilt = (1 - rising) * 9 - leaving * 7;

              el.style.transform =
                "translate3d(0," + y + "%,0) rotate(" + tilt + "deg)";
              el.style.opacity = String(rising * (1 - leaving));
            });
          });

          // Sky arrives across the handoff beat rather than snapping on.
          sky.current.style.opacity = String(
            smoothstep(p, 0, BEAT.handoffEnd),
          );

          // The next section sweeping up behind a curved edge.
          const rise = smoothstep(p, BEAT.emptyEnd, 1);
          exit.current.style.transform =
            "translate3d(0," + (105 - rise * 105) + "%,0)";
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

      {/* Words — under the canvas so the can occludes them. That overlap is
          what stops the scene reading as a flat caption track. */}
      <div
        className="pointer-events-none fixed inset-0 z-[9] transition-opacity duration-500"
        style={{ opacity: shown }}
      >
        {WORDS.map((word, i) => (
          <span
            key={word.text}
            className="wordmark absolute inset-x-0 flex justify-center text-[clamp(3.5rem,15vw,12rem)] leading-none"
            style={{ top: word.top, color: WORD_ORANGE }}
          >
            {word.text.split("").map((letter, c) => (
              // overflow-hidden per letter: the mask is what makes the rise
              // read as type being set, with no ghosting above the line box.
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
                opacity: layers[sprite.layerIndex].opacity,
                filter: "blur(" + layers[sprite.layerIndex].blur + "px)",
                color: sprite.pink ? DUSTY_PINK : "#FFFFFF",
              }}
            />
          ) : null,
        )}
      </div>

      {/* The next section arriving as a curved sweep rather than a straight
          edge — it should read as liquid, not as a slide. */}
      <div
        ref={exit}
        id="skydive-exit"
        className="pointer-events-none fixed bottom-0 left-[-20%] z-[16] h-[130vh] w-[140%]"
        style={{
          backgroundColor: INK,
          borderRadius: "50% 50% 0 0 / 18vh 18vh 0 0",
          transform: "translate3d(0,105%,0)",
          opacity: shown,
        }}
      />
    </div>
  );
}
