import Background from "@/components/Background";
import ViewCanvas from "@/components/canvas/ViewCanvas";
import FlavorBackdrop from "@/components/FlavorBackdrop";
import Nav from "@/components/Nav";
import Preloader from "@/components/Preloader";
import ScrollProgress from "@/components/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/sections/Hero";
import FlavorScroll from "@/components/sections/FlavorScroll";
import Carbonation from "@/components/sections/Carbonation";
import Skydive from "@/components/sections/Skydive";
import FlavorGrid from "@/components/sections/FlavorGrid";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      {/* z-0 colour plate · z-10 shared canvas · z-20 content */}
      <SmoothScroll />
      <Background />
      <FlavorBackdrop />
      {/* Sky gradient for the skydive section: above the colour plate, below
          the canvas, so the falling field draws over it. */}
      <div
        id="skydive-bg"
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[6] opacity-0"
        style={{ background: "linear-gradient(180deg, #06B6D4 0%, #EC4899 100%)" }}
      />
      <ViewCanvas />
      <Nav />
      <ScrollProgress />
      <Preloader />
      <main className="relative z-20">
        <Hero />
        <FlavorScroll />
        <Carbonation />
        <Skydive />
        <FlavorGrid />
        <Footer />
      </main>
    </>
  );
}
