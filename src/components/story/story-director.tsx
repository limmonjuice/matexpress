"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import {
  CHAPTERS,
  ENTRY,
  HOLD,
  CHAPTER,
  KEYS,
  UNITS,
  chapterAt,
  chapterStart as S,
  resetRig,
  rig,
  type CameraKey,
} from "../journey/rig";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const T = CHAPTER - HOLD; // hand-over between chapters
const cam = (key: CameraKey) => ({ ...key });

/**
 * One scroll-scrubbed timeline for the whole story: the camera rig, the truck's
 * load, the road, the lights and the map all move on it. The chapter words are
 * not scrubbed: they play in and out as the scroll crosses into each chapter.
 */
export function StoryDirector() {
  useGSAP((_, contextSafe) => {
    const story = document.querySelector<HTMLElement>(".story");
    const sticky = document.querySelector<HTMLElement>(".story-sticky");
    const backdrop = document.querySelector<HTMLElement>(".story-backdrop");
    if (!story || !sticky || !backdrop) return;
    resetRig();

    const chapters = gsap.utils.toArray<HTMLElement>(".story-chapter");
    const railItems = gsap.utils.toArray<HTMLElement>(".story-rail li");
    const progress = sticky.querySelector<HTMLElement>(".story-progress i");
    const reveals: gsap.core.Timeline[] = [];
    let current = -1;

    gsap.set(chapters, { autoAlpha: 0 });

    const buildReveal = (i: number, lines: Element[]) => {
      const el = chapters[i];
      return gsap
        .timeline({ paused: true })
        .from(lines, { yPercent: 110, duration: 1, ease: "expo.out", stagger: 0.08 })
        .from(
          el.querySelectorAll("p, .story-link, .story-button"),
          { y: 26, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.07 },
          0.2,
        );
    };

    const show = (i: number) => {
      const el = chapters[i];
      gsap.killTweensOf(el);
      gsap.set(el, { autoAlpha: 1, y: 0 });
      reveals[i]?.restart();
    };
    const hide = (i: number) => {
      const el = chapters[i];
      gsap.to(el, {
        autoAlpha: 0,
        y: -18,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          reveals[i]?.pause(0);
        },
      });
    };

    const onUpdate = (self: ScrollTrigger) => {
      const units = self.progress * UNITS;
      const next = chapterAt(units);
      if (next !== current) {
        if (current >= 0) hide(current);
        if (next >= 0) show(next);
        current = next;
        sticky.dataset.tone = next >= 0 ? CHAPTERS[next].tone : "light";
        railItems.forEach((li, k) => li.classList.toggle("is-active", k === next));
      }
      if (progress) gsap.set(progress, { scaleX: gsap.utils.clamp(0, 1, (units - ENTRY) / (UNITS - ENTRY)) });
    };

    // Headings split into lines that rise out of masks; re-split when fonts or widths change.
    const split = contextSafe!(() => {
      chapters.forEach((el, i) => {
        SplitText.create(el.querySelector("h2"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            reveals[i] = buildReveal(i, self.lines);
            if (current === i) reveals[i].progress(1);
            return reveals[i];
          },
        });
      });
    });
    if (document.fonts) document.fonts.ready.then(split);
    else split();

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: story, start: "top bottom", end: "bottom bottom", scrub: 1, onUpdate },
    });
    tl.to({}, { duration: UNITS }, 0); // fixes the timeline's length to the scroll units

    const background = (key: CameraKey, at: number, duration: number) =>
      tl.to(backdrop, { backgroundColor: key.bg, duration, ease: "power1.inOut" }, at);

    // Lift-off: the camera lets go of the hero photo and rises over the load.
    tl.to(rig, { photo: 0, duration: ENTRY, ease: "power2.inOut" }, 0);
    tl.to(rig, { ...cam(KEYS.search), duration: ENTRY, ease: "power2.inOut" }, 0);

    // 1 · Search: the load comes apart, one stack per supplier.
    tl.to(rig, { explode: 1, duration: 45, ease: "power3.out" }, S(0) + 5);
    tl.to(rig, { az: KEYS.search.az + 0.2, duration: HOLD }, S(0));
    tl.to(rig, { ...cam(KEYS.order), duration: T, ease: "power2.inOut" }, S(0) + HOLD);
    tl.to(rig, { explode: 0, duration: T, ease: "power2.inOut" }, S(0) + HOLD);
    background(KEYS.order, S(0) + HOLD, T);

    // 2 · Order: packed as one load, one order.
    tl.to(rig, { summary: 1, duration: 15, ease: "power2.out" }, S(1) + 5);
    tl.to(rig, { az: KEYS.order.az + 0.2, duration: HOLD }, S(1));
    tl.to(rig, { summary: 0, duration: 12 }, S(1) + HOLD);
    tl.to(rig, { ...cam(KEYS.deliver), duration: T, ease: "power2.inOut" }, S(1) + HOLD);
    tl.to(rig, { dusk: 1, lights: 1, roadVis: 1, duration: T, ease: "power1.inOut" }, S(1) + HOLD);
    tl.to(rig, { road: 18, duration: T, ease: "power2.in" }, S(1) + HOLD);
    background(KEYS.deliver, S(1) + HOLD, T);

    // 3 · Deliver: on the road at blue hour.
    tl.to(rig, { eta: 1, duration: 15, ease: "power2.out" }, S(2) + 5);
    tl.to(rig, { az: KEYS.deliver.az + 0.12, r: KEYS.deliver.r - 0.9, duration: HOLD }, S(2));
    tl.to(rig, { road: 70, duration: HOLD }, S(2));
    tl.to(rig, { eta: 0, duration: 12 }, S(2) + HOLD);
    tl.to(rig, { ...cam(KEYS.sell), duration: T, ease: "power2.inOut" }, S(2) + HOLD);
    tl.to(rig, { road: 96, duration: T }, S(2) + HOLD);
    tl.to(rig, { mapVis: 1, duration: 25, ease: "power2.out" }, S(2) + HOLD + 15);
    background(KEYS.sell, S(2) + HOLD, T);

    // 4 · Sell: the sellers around the truck, routes drawing in.
    tl.to(rig, { mapDraw: 1, duration: 55, ease: "power1.inOut" }, S(3) + 5);
    tl.to(rig, { az: KEYS.sell.az + 0.1, r: KEYS.sell.r - 3, duration: HOLD }, S(3));
    tl.to(rig, { road: 150, duration: HOLD }, S(3));
    tl.to(rig, { mapVis: 0, mapDraw: 0, duration: 20 }, S(3) + HOLD);
    tl.to(rig, { ...cam(KEYS.build), duration: T, ease: "power2.inOut" }, S(3) + HOLD);
    tl.to(rig, { dusk: 0.15, lights: 0.7, roadVis: 0, duration: T, ease: "power1.inOut" }, S(3) + HOLD);
    tl.to(rig, { road: 162, duration: T, ease: "power3.out" }, S(3) + HOLD);
    background(KEYS.build, S(3) + HOLD, T);

    // 5 · Build: the truck rolls to a stop at sunrise.
    tl.to(rig, { az: KEYS.build.az + 0.15, r: KEYS.build.r - 0.7, duration: UNITS - S(4) }, S(4));

    return () => resetRig();
  });
  return null;
}
