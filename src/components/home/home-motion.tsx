"use client";

import { useEffect } from "react";

/** Below this share of the screen an element hasn't been seen yet, so hiding it can't cause a flash. */
const FOLD = 0.92;

const belowFold = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * FOLD;

/** Gives the browser a turn, so a tap isn't kept waiting while the page sets up its motion. */
const breathe = () => new Promise((resolve) => setTimeout(resolve));

/**
 * The page's one scroll effect: headings rise out of a mask and each group of cards fades up, once.
 * Opacity, not visibility, so keyboard users can still tab to anything that hasn't revealed yet.
 *
 * GSAP is fetched once the page is up, and set up one element at a time. Nothing waits for it: what's
 * already on screen is left alone however late it arrives, and if it never does, the page simply stays visible.
 */
export function HomeMotion() {
  useEffect(() => {
    let left = false;
    let undo: (() => void) | undefined;

    const setUp = async () => {
      const [{ default: gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/SplitText")]);
      await breathe();
      if (left) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);

      const context = gsap.context(() => {});
      const refresh = () => ScrollTrigger.refresh();
      undo = () => {
        window.removeEventListener("load", refresh);
        context.revert();
      };

      for (const heading of document.querySelectorAll<HTMLElement>(".hm [data-split]")) {
        if (belowFold(heading)) {
          context.add(() => {
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
        }
        await breathe();
        if (left) return;
      }

      for (const group of document.querySelectorAll<HTMLElement>(".hm [data-reveal]")) {
        if (belowFold(group)) {
          context.add(() => {
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
        }
        await breathe();
        if (left) return;
      }

      // Fonts and images settle after first paint and shift the section tops. If they already have, there's nothing to measure again.
      if (document.fonts?.status === "loading") document.fonts.ready.then(refresh);
      if (document.readyState !== "complete") window.addEventListener("load", refresh, { once: true });
    };

    setUp().catch(() => {});

    return () => {
      left = true;
      undo?.();
    };
  }, []);

  return null;
}
