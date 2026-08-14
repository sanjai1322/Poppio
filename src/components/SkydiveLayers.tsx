"use client";

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS } from "@/lib/flavors";
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
/** Cream-white at low opacity — atmospheric depth, not a competing headline. */
const WORD_COLOR = "rgba(255, 244, 224, 0.14)";

/** Deterministic jitter, so scrubbing back up retraces the same field. */
function hash(a: number, b: number) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothstep(x: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Placement alternates side to side as well as top to bottom. Centred words sat
 * directly behind a centred can and were almost entirely swallowed by it — the
 * occlusion is meant to be a depth cue on an edge, not the whole word.
 */
const WORDS = [
  { text: "Dive",   at: 0.22, top: "12%",  justify: "flex-start", pad: "8vw" },
  { text: "Into",   at: 0.40, top: "35%",  justify: "flex-end",   pad: "8vw" },
  { text: "Better", at: 0.58, top: "60%",  justify: "flex-start", pad: "5vw" },
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

      // Handoff trigger: smoothly cross-fades background to sky and fades clouds in
      ScrollTrigger.create({
        trigger: "#meet-all-four",
        start: "center center",
        endTrigger: "#" + SKYDIVE_ID,
        end: SKYDIVE_START,
        scrub: true,
        onToggle: (self) => {
          if (self.isActive) setActive(true);
        },
        onUpdate: (self) => {
          const h = self.progress;
          if (sky.current && skydiveProgress.current === 0) {
            sky.current.style.opacity = String(smoothstep(h, 0.25, 0.95));
          }
        },
      });

      ScrollTrigger.create({
        trigger: "#" + SKYDIVE_ID,
        start: SKYDIVE_START,
        end: SKYDIVE_END,
        onToggle: (self) => {
          setActive(self.isActive);
          if (!self.isActive && sky.current && self.progress > 0.5) sky.current.style.opacity = "0";
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
          sky.current.style.opacity = String(1 - handover);
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

      {/* Words — under the canvas so the can occludes them. That overlap is
          what stops the scene reading as a flat caption track. */}
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
              color: WORD_COLOR,
              justifyContent: word.justify,
              paddingLeft: word.justify === "flex-start" ? word.pad : undefined,
              paddingRight: word.justify === "flex-end" ? word.pad : undefined,
              letterSpacing: "0.04em",
              WebkitTextStroke: "1px rgba(255, 244, 224, 0.08)",
              textShadow: "0 0.04em 0.8em rgba(46, 107, 230, 0.18)",
            }}
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
    </div>
  );
}
