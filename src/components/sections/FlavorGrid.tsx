import { FLAVORS } from "@/lib/flavors";

export default function FlavorGrid() {
  return (
    <section className="relative bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/60">
          All four
        </p>
        <h2 className="wordmark mt-5 max-w-2xl text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] text-cream">
          Pick a side
        </h2>

        <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FLAVORS.map((flavor, i) => (
            <li
              key={flavor.id}
              className="group flex aspect-[3/4] flex-col justify-between rounded-3xl p-7 transition-transform duration-500 ease-out hover:-translate-y-2"
              style={{ backgroundColor: flavor.color }}
            >
              <span className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/70">
                No. {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="wordmark text-3xl leading-[0.9] text-cream">
                  {flavor.name}
                </h3>
                <p className="mt-3 text-[0.7rem] uppercase tracking-[0.2em] text-cream/70">
                  {flavor.notes}
                </p>
                <p className="mt-4 text-base text-cream">{flavor.tagline}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
