import { Hero } from "@/components/hero/hero";
import { Story, StoryFooter } from "@/components/story/story";
import { SmoothScroll } from "@/components/journey/smooth-scroll";
import { TruckStage } from "@/components/journey/truck-stage";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <main>
        <Hero />
        <Story />
      </main>
      <StoryFooter />
      <TruckStage />
    </>
  );
}
