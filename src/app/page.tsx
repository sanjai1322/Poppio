import Background from "@/components/Background";
import ViewCanvas from "@/components/canvas/ViewCanvas";
import ClusterView from "@/components/canvas/ClusterView";
import FlavorBackdrop from "@/components/FlavorBackdrop";
import Nav from "@/components/Nav";
import Preloader from "@/components/Preloader";
import ScrollProgress from "@/components/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/sections/Hero";
import MeetAllFour from "@/components/sections/MeetAllFour";
import SkydiveLayers from "@/components/SkydiveLayers";
import Skydive from "@/components/sections/Skydive";
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
      <SkydiveLayers />
      <ViewCanvas />
      {/* Tracker for the persistent four-can group. Sits outside <main> so its
          rect is the full viewport across both the hero and cluster sections. */}
      <ClusterView />
      <Nav />
      <ScrollProgress />
      <Preloader />
      <main className="relative z-20">
        <Hero />
        <MeetAllFour />
        <Skydive />
        <FlavorScroll />
        <Carbonation />
        <FlavorGrid />
        <Footer />
      </main>
    </>
  );
}
