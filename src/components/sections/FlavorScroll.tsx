import { FLAVORS } from "@/lib/flavors";

export default function FlavorScroll() {
  return (
    <section id="flavours" className="relative h-[400vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="relative mx-auto h-full max-w-7xl px-6 md:px-10">
          <p className="absolute right-6 top-28 text-[0.7rem] uppercase tracking-[0.3em] text-cream/60 md:right-10">
            The lineup
          </p>

          {FLAVORS.map((flavor, i) => (
            <article
              key={flavor.id}
              className="absolute inset-x-6 bottom-16 md:inset-x-10 md:bottom-24"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/60">
                {String(i + 1).padStart(2, "0")} / {String(FLAVORS.length).padStart(2, "0")}
              </p>
              <h2 className="wordmark mt-3 text-[clamp(2.5rem,9vw,7rem)] leading-[0.85] text-cream">
                {flavor.name}
              </h2>
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-cream/70">
                {flavor.notes}
              </p>
              <p className="mt-2 max-w-sm text-lg text-cream/90">
                {flavor.tagline}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
