export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center"
    >
      <p className="text-[0.7rem] uppercase tracking-[0.35em] text-cream/70">
        Prebiotic soda
      </p>

      <h1 className="wordmark mt-6 text-[clamp(3.25rem,13vw,11rem)] leading-[0.82] text-cream">
        Tropical
        <br />
        soda with
        <br />
        guts
      </h1>

      <p className="mt-8 max-w-md text-base leading-relaxed text-cream/80 md:text-lg">
        Four island flavours. 3g of plant prebiotic fibre. None of the usual
        nonsense.
      </p>

      <a
        href="#flavours"
        className="mt-10 rounded-full bg-cream px-8 py-4 text-xs uppercase tracking-[0.2em] text-ink transition-transform duration-300 hover:scale-105"
      >
        Meet the four
      </a>

      <span className="absolute bottom-8 text-[0.65rem] uppercase tracking-[0.3em] text-cream/50">
        Scroll
      </span>
    </section>
  );
}
