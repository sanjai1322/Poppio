export type FlavorId = "mango" | "guava" | "pineapple" | "dragon";

export type Flavor = {
  id: FlavorId;
  name: string;
  notes: string;
  tagline: string;
  color: string;
  wrap: string;
};

/** Source of truth for copy, colours and label art. Order drives the scroll beats. */
export const FLAVORS: Flavor[] = [
  {
    id: "mango",
    name: "Mango Passion",
    notes: "mango + passionfruit",
    tagline: "Sunset, carbonated.",
    color: "#F97316",
    wrap: "/wraps/poppio_mango.webp",
  },
  {
    id: "guava",
    name: "Guava Berry",
    notes: "guava + berries",
    tagline: "Sweet with a wild streak.",
    color: "#EC4899",
    wrap: "/wraps/poppio_guava.webp",
  },
  {
    id: "pineapple",
    name: "Pineapple Lime",
    notes: "pineapple + lime",
    tagline: "Sharp. Bright. Unbothered.",
    color: "#84CC16",
    wrap: "/wraps/poppio_pineapple.webp",
  },
  {
    id: "dragon",
    name: "Dragon Blue",
    notes: "dragonfruit + blueberry",
    tagline: "Looks unreal. Tastes better.",
    color: "#06B6D4",
    wrap: "/wraps/poppio_dragon.webp",
  },
];

export const CREAM = "#FFF4E0";
export const INK = "#1A1206";

export const WRAP_URLS = FLAVORS.map((f) => f.wrap);
