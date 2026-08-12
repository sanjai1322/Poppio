const STATS = [
  { value: "3g", label: "Plant prebiotic fibre" },
  { value: "40", label: "Calories per can" },
  { value: "5g", label: "Sugar, and that's it" },
];

export default function Carbonation() {
  return (
    <section id="why" className="relative h-[200vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-cream/60">
              Why it works
            </p>
            <h2 className="wordmark mt-5 text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] text-cream">
              The fizz is fun.
              <br />
              The fibre is
              <br />
              the point.
            </h2>
            <p className="mt-7 max-w-md text-base leading-relaxed text-cream/80 md:text-lg">
              Every can carries 3g of plant prebiotics — the stuff that feeds the
              good bacteria already living in your gut. Nothing synthetic,
              nothing you need a chemistry degree to pronounce.
            </p>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-cream/20 pt-8">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="wordmark text-4xl text-cream md:text-5xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-2 text-[0.7rem] uppercase leading-relaxed tracking-[0.15em] text-cream/60">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right column is deliberately empty — the rising can occupies it. */}
          <div aria-hidden className="hidden md:block" />
        </div>
      </div>
    </section>
  );
}
