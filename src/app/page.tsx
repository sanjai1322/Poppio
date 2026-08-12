import Background from "@/components/Background";
import ViewCanvas from "@/components/canvas/ViewCanvas";
import FlavorBackdrop from "@/components/FlavorBackdrop";
import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/sections/Hero";
import FlavorScroll from "@/components/sections/FlavorScroll";
import Carbonation from "@/components/sections/Carbonation";
import FlavorGrid from "@/components/sections/FlavorGrid";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      {/* z-0 colour plate · z-10 shared canvas · z-20 content */}
      <SmoothScroll />
      <Background />
      <FlavorBackdrop />
      <ViewCanvas />
      <Nav />
      <main className="relative z-20">
        <Hero />
        <FlavorScroll />
        <Carbonation />
        <FlavorGrid />
        <Footer />
      </main>
    </>
  );
}
