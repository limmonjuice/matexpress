"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MaterialIcon, type MaterialIconName } from "./material-icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const BENEFITS = [
  {
    title: "Pay on 30-day terms",
    text: "One credit line for the company, with a limit set to the size of your work.",
  },
  {
    title: "Lock prices for the whole build",
    text: "Quote a project once and hold steel and cement prices for up to 60 days.",
  },
  {
    title: "Your crew orders, you approve",
    text: "Foremen request from site. Owners approve from their phone before anything ships.",
  },
  {
    title: "One invoice per project",
    text: "Every delivery files under its job, ready for your accountant and your client.",
  },
];

// The stack that drops into place: heaviest at the bottom, as on a real pallet.
const STACK: { icon: MaterialIconName; x: number; rot: number }[] = [
  { icon: "chb", x: -70, rot: 0 },
  { icon: "chb", x: 10, rot: 2 },
  { icon: "cement", x: 84, rot: -4 },
  { icon: "brick", x: -40, rot: -3 },
  { icon: "cement", x: 40, rot: 6 },
  { icon: "plank", x: -6, rot: -8 },
  { icon: "bucket", x: -54, rot: 4 },
  { icon: "coil", x: 52, rot: -6 },
  { icon: "hardhat", x: 0, rot: 8 },
];

export function Trade() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".stack-piece", {
        y: -520,
        rotation: () => gsap.utils.random(-90, 90),
        opacity: 0,
        duration: 1,
        ease: "bounce.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".trade-stack", start: "top 75%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="trade" className="section trade" data-theme="dark" aria-labelledby="trade-title">
      <div className="frame trade-grid">
        <div>
          <h2 id="trade-title" data-reveal>
            Built for crews who buy every week.
          </h2>
          <ul className="trade-list">
            {BENEFITS.map((b) => (
              <li key={b.title} data-reveal>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="trade-side">
          <div className="trade-stack" aria-hidden="true">
            {STACK.map((piece, i) => (
              <div
                key={i}
                className="stack-piece"
                style={{
                  left: `calc(50% + ${piece.x}px)`,
                  bottom: `${Math.floor(i / 3) * 96 + (i % 3) * 6}px`,
                  rotate: `${piece.rot}deg`,
                }}
              >
                <MaterialIcon name={piece.icon} />
              </div>
            ))}
          </div>
          <div className="trade-apply" data-reveal>
            <p>
              Apply in about five minutes with your business registration. Most companies hear back
              within one working day.
            </p>
            <a
              className="btn btn-yellow btn-block"
              href="mailto:trade@matexpress.ph?subject=Trade%20account%20application&body=Company%20name%3A%0AMonthly%20materials%20spend%3A%0AProject%20locations%3A"
            >
              Apply for a trade account
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
