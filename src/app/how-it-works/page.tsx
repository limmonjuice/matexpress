import type { Metadata } from "next";
import { Hero } from "@/components/hero/hero";
import { Story, StoryFooter } from "@/components/story/story";
import { SmoothScroll } from "@/components/smooth-scroll";
import { TruckStage } from "@/components/journey/truck-stage";

export const metadata: Metadata = {
  title: "How it works | MatExpress",
  description:
    "Compare hardware stores, check out once, and follow one delivery to your project site.",
};

export default function HowItWorks() {
  return (
    <>
      <SmoothScroll />
      <main id="main">
        <Hero />
        <Story />
      </main>
      <StoryFooter />
      <TruckStage />
    </>
  );
}
