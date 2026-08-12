import type { FlavorId } from "@/lib/flavors";

/**
 * Flat vector fruit used as oversized background texture in the flavour
 * section. Silhouette-first: these render at 12-18% opacity behind a can, so
 * readable outlines matter and interior detail mostly doesn't.
 *
 * Everything fills with currentColor so a parent can tint the whole set.
 */
type ShapeProps = { className?: string };

const svg = (children: React.ReactNode) =>
  function Shape({ className }: ShapeProps) {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="currentColor"
        aria-hidden
        className={className}
      >
        {children}
      </svg>
    );
  };

export const Mango = svg(
  <>
    <path d="M58 18c26-4 48 16 48 42 0 26-22 44-48 44S12 86 12 60c0-24 20-38 46-42z" />
    <path d="M74 6c-12 3-21 11-25 22 13 4 25-1 30-12 3-7 1-12-5-10z" opacity="0.75" />
  </>,
);

export const Passionfruit = svg(
  <>
    <circle cx="60" cy="62" r="46" />
    <circle cx="60" cy="62" r="32" opacity="0.45" />
    <g opacity="0.7">
      <ellipse cx="52" cy="52" rx="4" ry="6" />
      <ellipse cx="68" cy="55" rx="4" ry="6" />
      <ellipse cx="58" cy="68" rx="4" ry="6" />
      <ellipse cx="72" cy="72" rx="4" ry="6" />
      <ellipse cx="46" cy="70" rx="4" ry="6" />
    </g>
  </>,
);

export const Guava = svg(
  <>
    <path d="M60 20c26 0 44 18 44 42s-18 42-44 42-44-18-44-42 18-42 44-42z" />
    <path d="M60 20c-4-10-2-18 6-20 4 8 2 16-6 20z" opacity="0.75" />
    <circle cx="60" cy="62" r="20" opacity="0.4" />
  </>,
);

export const Berries = svg(
  <>
    <circle cx="42" cy="70" r="28" />
    <circle cx="78" cy="66" r="24" opacity="0.8" />
    <circle cx="60" cy="38" r="20" opacity="0.65" />
    <path d="M58 20c2-8 8-13 16-14-2 9-7 14-16 14z" opacity="0.7" />
  </>,
);

export const Pineapple = svg(
  <>
    <path d="M60 30c22 0 34 16 34 38s-12 34-34 34-34-12-34-34 12-38 34-38z" />
    <path
      d="M60 4c6 8 6 16 2 24 8-4 16-2 22 4-8 4-14 6-20 4 6 6 6 14 2 20-6-4-10-10-10-16-2 8-8 12-16 14 0-8 2-14 8-18-8 0-14-4-18-10 8-2 16 0 22 4-4-8-2-16 8-26z"
      opacity="0.8"
    />
    <g opacity="0.35">
      <path d="M34 56l52 30M34 74l52 30M46 44l40 24M34 92l38 22" strokeWidth="3" stroke="currentColor" fill="none" />
    </g>
  </>,
);

export const Lime = svg(
  <>
    <circle cx="60" cy="60" r="48" />
    <g opacity="0.4">
      <path d="M60 60L60 14a46 46 0 0 1 40 23z" />
      <path d="M60 60l40-23a46 46 0 0 1 0 46z" />
      <path d="M60 60l40 23a46 46 0 0 1-40 23z" />
      <path d="M60 60v46a46 46 0 0 1-40-23z" />
      <path d="M60 60l-40 23a46 46 0 0 1 0-46z" />
      <path d="M60 60L20 37A46 46 0 0 1 60 14z" />
    </g>
  </>,
);

export const Dragonfruit = svg(
  <>
    <ellipse cx="60" cy="62" rx="34" ry="44" />
    <g opacity="0.7">
      <path d="M30 34c-12-6-22-4-26 4 10 8 20 8 28 2z" />
      <path d="M90 34c12-6 22-4 26 4-10 8-20 8-28 2z" />
      <path d="M26 74c-12 2-20 8-20 18 12 2 20-4 24-12z" />
      <path d="M94 74c12 2 20 8 20 18-12 2-20-4-24-12z" />
    </g>
    <g opacity="0.45">
      <circle cx="54" cy="52" r="3" />
      <circle cx="68" cy="58" r="3" />
      <circle cx="58" cy="70" r="3" />
      <circle cx="70" cy="80" r="3" />
      <circle cx="50" cy="84" r="3" />
    </g>
  </>,
);

export const Blueberry = svg(
  <>
    <circle cx="60" cy="66" r="42" />
    <path
      d="M60 24l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2z"
      opacity="0.45"
    />
  </>,
);

/** Two or three shapes per flavour, matching its stated fruit pairing. */
export const FRUIT_BY_FLAVOR: Record<
  FlavorId,
  Array<(props: ShapeProps) => JSX.Element>
> = {
  mango: [Mango, Passionfruit],
  guava: [Guava, Berries, Passionfruit],
  pineapple: [Pineapple, Lime],
  dragon: [Dragonfruit, Blueberry, Berries],
};
