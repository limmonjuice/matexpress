"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MaterialIcon, type MaterialIconName } from "./material-icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const WORDS: [string, MaterialIconName][] = [
  ["Cement", "cement"],
  ["Steel", "rebar"],
  ["Aggregates", "rocks"],
  ["Masonry", "chb"],
  ["Lumber", "plank"],
  ["Roofing", "roof"],
  ["Plumbing", "pipe"],
  ["Paint", "bucket"],
  ["Tools", "drill"],
  ["Safety", "hardhat"],
];

/** Category names that run across the screen and speed up with the scroll. */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const loop = gsap.to(".marquee-track", { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 6);
          gsap.to(loop, { timeScale: self.direction * boost, duration: 0.2, overwrite: true });
          gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.2 });
        },
      });
    },
    { scope: root },
  );

  const row = WORDS.map(([word, icon]) => (
    <span key={word} className="marquee-item">
      {word}
      <MaterialIcon name={icon} className="marquee-icon" />
    </span>
  ));

  return (
    <div ref={root} className="marquee" data-theme="dark" aria-label="Categories: cement, steel, aggregates, masonry, lumber, roofing, plumbing, paint, tools and safety">
      <div className="marquee-track" aria-hidden="true">
        <span className="marquee-row">{row}</span>
        <span className="marquee-row">{row}</span>
      </div>
    </div>
  );
}
