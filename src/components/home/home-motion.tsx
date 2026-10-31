"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Below this share of the screen an element hasn't been seen yet, so hiding it can't cause a flash. */
const FOLD = 0.92;

const belowFold = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * FOLD;

/**
 * The page's one scroll effect: headings rise out of a mask and each group of cards fades up, once.
 * Opacity, not visibility, so keyboard users can still tab to anything that hasn't revealed yet.
 */
export function HomeMotion() {
  useGSAP(() => {
    document.querySelectorAll<HTMLElement>(".hm [data-split]").forEach((heading) => {
      if (!belowFold(heading)) return;
      SplitText.create(heading, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: heading, start: "top 90%", once: true },
          }),
      });
    });

    document.querySelectorAll<HTMLElement>(".hm [data-reveal]").forEach((group) => {
      if (!belowFold(group)) return;
      gsap.from(group.children, {
        y: 26,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: group, start: "top 88%", once: true },
      });
    });
  });

  return null;
}
