import gsap from "gsap";

/** Throws a copy of a product's drawing in an arc into the cart button. */
export function flyToCart(source: Element | null) {
  const target = document.getElementById("cart-button");
  if (!source || !target) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    zIndex: "200",
    pointerEvents: "none",
    margin: "0",
  });
  document.body.appendChild(clone);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const tl = gsap.timeline({ onComplete: () => clone.remove() });
  tl.to(clone, { x: dx, duration: 0.8, ease: "power1.inOut" }, 0)
    .to(
      clone,
      {
        keyframes: [
          { y: Math.min(dy, 0) - 120, duration: 0.35, ease: "power2.out" },
          { y: dy, duration: 0.45, ease: "power2.in" },
        ],
      },
      0,
    )
    .to(clone, { scale: 0.18, rotation: 200, duration: 0.8, ease: "power1.in" }, 0)
    .to(clone, { opacity: 0, duration: 0.12 }, 0.7);
}
