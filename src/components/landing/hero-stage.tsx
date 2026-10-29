"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MATERIAL_ICONS, MaterialIcon } from "./material-icons";
import { DesktopScreen, PopCards } from "./desktop-screen";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PIECES = 170;
const PIECES_MOBILE = 64;

// Deterministic so the server and the client render the same icon in each slot.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pieceIcons = (() => {
  const rand = mulberry32(7);
  return Array.from({ length: PIECES }, () => MATERIAL_ICONS[Math.floor(rand() * MATERIAL_ICONS.length)]);
})();

type Spot = { x: number; y: number; size: number; rot: number };

/** Where every piece comes to rest: two mounds either side of the desktop. */
function pileSpots(count: number, w: number, h: number, monitorW: number, mobile: boolean): Spot[] {
  const rand = mulberry32(42);
  const spots: Spot[] = [];
  const floor = h * 1.03;
  while (spots.length < count) {
    const x = rand() * w;
    const u = x / w;
    // Higher mounds near the desktop, lower at the edges.
    const mound = Math.exp(-((u - 0.17) ** 2) / 0.025) + Math.exp(-((u - 0.83) ** 2) / 0.025);
    const top = h * (mobile ? 0.78 : 0.7) - mound * h * (mobile ? 0.1 : 0.22);
    const behindMonitor = Math.abs(x - w / 2) < monitorW * 0.44;
    if (behindMonitor && rand() < 0.85) continue;
    // Packed toward the surface of the heap, where it is seen.
    const y = top + (floor - top) * Math.pow(rand(), 1.4);
    const size = mobile ? 34 + rand() * 22 : 50 + rand() * 38;
    spots.push({ x, y, size, rot: -40 + rand() * 80 });
  }
  return spots;
}

export function HeroStage() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mm = gsap.matchMedia();

      // Headline lines rise out of their masks, then the support copy follows.
      gsap.from(q(".hero-line > span"), {
        yPercent: 110,
        duration: reduce ? 0 : 1.1,
        ease: "expo.out",
        stagger: 0.09,
        delay: 0.1,
      });
      gsap.from(q(".hero-sub, .hero-actions, .hero-note"), {
        y: 24,
        opacity: 0,
        duration: reduce ? 0 : 0.9,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.35,
      });

      mm.add(
        { desktop: "(min-width: 900px)", mobile: "(max-width: 899px)" },
        (ctx) => {
          const mobile = Boolean(ctx.conditions?.mobile);
          const stage = q(".stage-sticky")[0] as HTMLElement;
          const monitorWrap = q(".monitor-wrap")[0] as HTMLElement;
          const w = stage.clientWidth;
          const h = stage.clientHeight;
          const monW = monitorWrap.offsetWidth;
          const monH = monitorWrap.offsetHeight;
          const monTop = monitorWrap.offsetTop;

          const count = mobile ? PIECES_MOBILE : PIECES;
          const pieces = q(".piece").slice(0, count) as HTMLElement[];
          const spots = pileSpots(count, w, h, monW, mobile);
          const ox = w / 2;
          const oy = monTop + monH * 0.28;

          // --- The burst: everything leaves the screen and lands in the pile ------
          const burst = gsap.timeline({ delay: reduce ? 0 : 0.55 });
          pieces.forEach((piece, i) => {
            const s = spots[i];
            piece.style.width = `${s.size}px`;
            piece.style.height = `${s.size}px`;
            piece.style.zIndex = String(Math.round(s.y));
            if (reduce) {
              gsap.set(piece, { x: s.x, y: s.y, rotation: s.rot, xPercent: -50, yPercent: -50, opacity: 1 });
              return;
            }
            const r = mulberry32(i + 99);
            const d = 1.5 + r() * 0.7;
            const at = Math.pow(r(), 1.6) * 1.1;
            const apexY = Math.min(oy, s.y) - h * (0.22 + r() * 0.4);
            gsap.set(piece, { x: ox, y: oy, xPercent: -50, yPercent: -50, scale: 0.15, opacity: 0 });
            burst
              .to(piece, { opacity: 1, duration: 0.12 }, at)
              .to(piece, { x: s.x, duration: d, ease: "power1.out" }, at)
              .to(piece, { scale: 1, duration: d * 0.45, ease: "back.out(2)" }, at)
              .to(
                piece,
                {
                  rotation: s.rot + (r() > 0.5 ? 360 : -360),
                  rotationX: 0,
                  rotationY: 0,
                  startAt: { rotationX: -180 + r() * 360, rotationY: -180 + r() * 360 },
                  duration: d,
                  ease: "power2.out",
                },
                at,
              )
              .to(
                piece,
                {
                  keyframes: [
                    { y: apexY, duration: d * 0.4, ease: "power2.out" },
                    { y: s.y, duration: d * 0.48, ease: "power2.in" },
                    { y: s.y - 10, duration: d * 0.06, ease: "power1.out" },
                    { y: s.y, duration: d * 0.06, ease: "power1.in" },
                  ],
                },
                at,
              );
          });

          // A piece hops when the pointer touches it.
          const hop = contextSafe!((e: Event) => {
            const t = e.currentTarget as HTMLElement;
            if (gsap.isTweening(t) && burst.isActive()) return;
            gsap.to(t.firstElementChild, {
              keyframes: [
                { y: -26, rotation: 18, duration: 0.22, ease: "power2.out" },
                { y: 0, rotation: 0, duration: 0.5, ease: "bounce.out" },
              ],
            });
          });
          pieces.forEach((p) => p.addEventListener("pointerenter", hop));

          // --- The scroll story -----------------------------------------------
          const centerY = h * (mobile ? 0.33 : 0.5) - (monTop + monH / 2);
          const story = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "bottom bottom",
              scrub: reduce ? true : 0.9,
              onUpdate: (self) => {
                const theme = self.progress > 0.26 ? "stage-dark" : "stage-light";
                if (el.dataset.theme !== theme) {
                  el.dataset.theme = theme;
                  window.dispatchEvent(new Event("mx-theme"));
                }
              },
            },
          });

          story
            .to(q(".hero-copy"), { y: -h * 0.4, autoAlpha: 0, duration: 1.6 }, 0)
            .to(q(".burst"), { y: -h * 1.3, duration: 2 }, 0)
            .to(monitorWrap, { y: centerY, scale: mobile ? 1 : 0.94, duration: 2, ease: "power1.inOut" }, 0)
            .to(el, { "--stage-bg": "#3B3A26", duration: 1 }, 1.4)
            .to(el, { "--stage-bg": "#12120D", "--stage-ink": "#F2F0E6", duration: 1 }, 2.4)
            .to(
              monitorWrap,
              mobile
                ? { scale: 0.96, duration: 1.4, ease: "power2.inOut" }
                : { x: w * 0.22, scale: 0.64, rotationY: -16, rotationX: 4, duration: 1.6, ease: "power2.inOut" },
              2,
            );

          const steps = q(".story-step");
          const cards = q(".pop-card");
          const screens = q(".ui-page");
          const pop = mobile
            ? { autoAlpha: 1, scale: 1, z: 60, y: 0, duration: 0.8, ease: "back.out(1.7)" }
            : { autoAlpha: 1, scale: 1, z: 180, x: 0, rotationY: 14, duration: 0.8, ease: "back.out(1.7)" };
          gsap.set(cards, { autoAlpha: 0, scale: 0.5, z: 0, x: mobile ? 0 : 120, y: mobile ? 40 : 0 });
          gsap.set(steps, { autoAlpha: 0, y: 40 });
          gsap.set(screens.slice(1), { autoAlpha: 0 });

          const beats = [3.2, 5.6, 8];
          beats.forEach((t, i) => {
            if (i > 0) {
              story
                .to(steps[i - 1], { autoAlpha: 0, y: -40, duration: 0.5 }, t - 0.6)
                .to(cards[i - 1], { autoAlpha: 0, scale: 0.5, z: 0, duration: 0.5 }, t - 0.6)
                .to(screens[i], { autoAlpha: 1, duration: 0.4 }, t - 0.4)
                .set(screens[i - 1], { autoAlpha: 0 }, t);
            }
            story
              .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, t)
              .to(cards[i], pop, t + 0.1)
              .to(q(".story-dot")[i], { autoAlpha: 1, duration: 0.4 }, t);
          });
          story.to({}, { duration: 1.2 });

          return () => {
            pieces.forEach((p) => p.removeEventListener("pointerenter", hop));
          };
        },
      );

      // A gentle tilt toward the pointer on the desktop (not on touch screens).
      if (!reduce && window.matchMedia("(pointer: fine)").matches) {
        const tilt = q(".monitor-tilt")[0];
        const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.8, ease: "power3.out" });
        const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.8, ease: "power3.out" });
        const move = contextSafe!((e: PointerEvent) => {
          rx((0.5 - e.clientY / window.innerHeight) * 6);
          ry((e.clientX / window.innerWidth - 0.5) * 8);
        });
        window.addEventListener("pointermove", move);
        return () => window.removeEventListener("pointermove", move);
      }
    },
    { scope: root },
  );

  return (
    <section ref={root} className="stage" data-theme="stage-light" aria-labelledby="hero-title">
      <div className="stage-sticky">
        <div className="hero-copy">
          <h1 id="hero-title" className="hero-title">
            <span className="hero-line">
              <span>The whole build,</span>
            </span>
            <span className="hero-line">
              <span>one order away.</span>
            </span>
          </h1>
          <p className="hero-sub">
            Cement, steel, aggregates and lumber at yard prices. Order in minutes and track every
            truck to your gate.
          </p>
          <div className="hero-actions">
            <a href="#materials" className="btn btn-ink">
              Start an order
            </a>
            <a href="#trade" className="link-arrow">
              Open a trade account <span aria-hidden="true">→</span>
            </a>
          </div>
          <p className="hero-note">Same-day dispatch on orders placed before 2 PM.</p>
        </div>

        <div className="burst" aria-hidden="true">
          {pieceIcons.map((icon, i) => (
            <div key={i} className="piece" data-index={i}>
              <MaterialIcon name={icon} />
            </div>
          ))}
        </div>

        <div className="monitor-wrap">
          <div className="monitor-tilt">
            <div className="monitor">
              <div className="monitor-screen">
                <DesktopScreen />
              </div>
              <div className="monitor-chin" />
            </div>
            <div className="monitor-neck" />
            <div className="monitor-foot" />
            <PopCards />
          </div>
        </div>

        <div className="story">
          <div className="story-step">
            <h2>Track every truck, live.</h2>
            <p>
              Live GPS from the moment your order leaves the yard. You get the driver&apos;s name, a
              real arrival time, and a photo when the load is dropped on site.
            </p>
            <a href="#tracking" className="link-arrow">
              How tracking works <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="story-step">
            <h2>Order by the truckload.</h2>
            <p>
              Search the yard&apos;s live stock, watch bulk prices apply as you add, and book a
              delivery window that fits the pour. Minutes, not phone calls.
            </p>
            <a href="#materials" className="link-arrow">
              Browse materials <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="story-step">
            <h2>Pay later on trade terms.</h2>
            <p>
              Open a trade account for your company. Every line shows your trade price, invoices
              group by project, and you settle on 30-day terms.
            </p>
            <a href="#trade" className="link-arrow">
              See trade accounts <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="story-dots" aria-hidden="true">
            <i className="story-dot" />
            <i className="story-dot" />
            <i className="story-dot" />
          </div>
        </div>
      </div>
    </section>
  );
}
