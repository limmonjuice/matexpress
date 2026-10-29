"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MATERIAL_ICONS, MaterialIcon } from "./material-icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const RAIN = Array.from({ length: 34 }, (_, i) => ({
  icon: MATERIAL_ICONS[(i * 7) % MATERIAL_ICONS.length],
  left: (i / 34) * 100 + ((i * 37) % 7) - 3,
  bottom: ((i * 53) % 5) * 14 - 18,
  size: 56 + ((i * 29) % 4) * 12,
  rot: ((i * 71) % 70) - 35,
}));

export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".rain-piece", {
        y: () => -window.innerHeight * 0.9,
        rotation: () => gsap.utils.random(-200, 200),
        opacity: 0,
        duration: 1.3,
        ease: "bounce.out",
        stagger: { each: 0.035, from: "random" },
        scrollTrigger: { trigger: root.current, start: "top 55%", once: true },
      });
      gsap.from(".footer-word span", {
        yPercent: 100,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.04,
        scrollTrigger: { trigger: ".footer-word", start: "top 95%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="closing" data-theme="dark" aria-labelledby="closing-title">
      <div className="frame closing-cta">
        <h2 id="closing-title" data-reveal>
          <span className="block">Order today.</span>
          <span className="block">Pour tomorrow.</span>
        </h2>
        <p data-reveal>
          Set up your site address once, and every bag, bar and block after that is a few taps away.
        </p>
        <div className="closing-actions" data-reveal>
          <a href="#materials" className="btn btn-yellow">
            Start an order
          </a>
          <a href="#estimator" className="link-arrow">
            Price a slab first <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className="rain" aria-hidden="true">
        {RAIN.map((p, i) => (
          <div
            key={i}
            className="rain-piece"
            style={{
              left: `${p.left}%`,
              bottom: `${p.bottom}px`,
              width: p.size,
              height: p.size,
              rotate: `${p.rot}deg`,
              zIndex: 10 - Math.round(p.bottom / 14),
            }}
          >
            <MaterialIcon name={p.icon} />
          </div>
        ))}
      </div>

      <footer className="footer">
        <div className="frame footer-grid">
          <div>
            <h2 className="footer-title">MatExpress</h2>
            <p>Construction materials, delivered to site. Antipolo · Valenzuela · Biñan.</p>
          </div>
          <nav aria-label="Footer">
            <h3>Shop</h3>
            <a href="#materials">Materials</a>
            <a href="#estimator">Slab estimator</a>
            <a href="#tracking">Delivery tracking</a>
          </nav>
          <nav aria-label="Company">
            <h3>Company</h3>
            <a href="#trade">Trade accounts</a>
            <a href="#faq">Questions</a>
            <a href="tel:+63289001234">(02) 8900 1234</a>
          </nav>
        </div>
        <p className="footer-word" aria-hidden="true">
          {"MatExpress".split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </p>
        <div className="frame footer-legal">
          <span>© 2026 MatExpress</span>
          <span>Prices include VAT. Stock and prices shown are samples.</span>
        </div>
      </footer>
    </section>
  );
}
