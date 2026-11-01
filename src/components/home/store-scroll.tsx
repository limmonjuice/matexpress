"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** The story page's smooth scrolling, without GSAP: most store pages have nothing else for it to do. */
export function StoreScroll() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, anchors: true, autoRaf: true });
    return () => lenis.destroy();
  }, []);
  return null;
}
