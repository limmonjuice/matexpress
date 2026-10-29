"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { MaterialIcon } from "./material-icons";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);

const ROAD = "M100 0 C 100 90, 40 120, 40 210 S 160 330, 160 430 S 40 560, 40 660 S 150 790, 100 1000";

const STOPS = [
  {
    time: "8:02 AM",
    title: "Order placed",
    text: "You choose a delivery window. The yard confirms every line is in stock within minutes.",
  },
  {
    time: "9:15 AM",
    title: "Loaded and counted",
    text: "Each item is checked onto the truck and photographed before it leaves the gate.",
  },
  {
    time: "10:48 AM",
    title: "On the road",
    text: "Follow the truck live on the map. The driver's number is one tap away.",
  },
  {
    time: "11:41 AM",
    title: "Dropped on site",
    text: "Your foreman signs on their phone, with a photo of the drop. The invoice follows.",
  },
];

export function DeliveryRoute() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const progress = root.current!.querySelector<SVGPathElement>(".road-progress")!;
      const length = progress.getTotalLength();
      gsap.set(progress, { strokeDasharray: length, strokeDashoffset: length });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: ".route-road",
          start: "top 60%",
          end: "bottom 60%",
          scrub: reduce ? true : 0.6,
        },
      });
      tl.to(progress, { strokeDashoffset: 0 }, 0).to(
        ".route-truck",
        { motionPath: { path: ".road-base", align: ".road-base", alignOrigin: [0.5, 0.5] } },
        0,
      );

      gsap.utils.toArray<HTMLElement>(".route-stop").forEach((stop) => {
        ScrollTrigger.create({
          trigger: stop,
          start: "top 62%",
          end: "bottom 38%",
          toggleClass: "is-active",
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="tracking" className="section route" data-theme="light" aria-labelledby="tracking-title">
      <div className="frame route-grid">
        <div className="route-copy">
          <h2 id="tracking-title" data-reveal>
            Tracked from our yard to your gate.
          </h2>
          <p className="route-lede" data-reveal>
            One order on a Tuesday morning, Antipolo. This is everything your site team sees, as it
            happens.
          </p>
          <ol className="route-stops">
            {STOPS.map((stop) => (
              <li key={stop.title} className="route-stop">
                <h3>
                  {stop.title}
                  <time className="route-time">{stop.time}</time>
                </h3>
                <p>{stop.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="route-road" aria-hidden="true">
          <svg viewBox="0 0 200 1000" preserveAspectRatio="xMidYMid meet">
            <path className="road-base" d={ROAD} />
            <path className="road-line" d={ROAD} />
            <path className="road-progress" d={ROAD} />
            <g className="road-yard">
              <circle cx="100" cy="6" r="10" />
            </g>
            <g className="road-site">
              <circle cx="100" cy="992" r="12" />
            </g>
          </svg>
          <div className="route-truck">
            <MaterialIcon name="truck" />
          </div>
        </div>
      </div>
    </section>
  );
}
