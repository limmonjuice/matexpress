"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCartStore } from "@/stores/cart-store";
import { CATALOG, formatPeso, type CatalogGroup, type CatalogItem } from "./catalog";
import { MaterialIcon } from "./material-icons";
import { flyToCart } from "./fly-to-cart";

const FILTERS: ("All" | CatalogGroup)[] = ["All", "Structural", "Finishing", "Tools & safety"];

export function Products() {
  const root = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const items = filter === "All" ? CATALOG : CATALOG.filter((p) => p.group === filter);

  useGSAP(
    () => {
      gsap.from(".product-card", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.05,
        clearProps: "opacity,transform",
      });
    },
    { scope: root, dependencies: [filter], revertOnUpdate: true },
  );

  return (
    <section ref={root} id="materials" className="section products" data-theme="dark" aria-labelledby="materials-title">
      <div className="frame">
        <div className="products-head" data-reveal>
          <h2 id="materials-title">Stock for every stage of the build.</h2>
          <p>
            Live yard inventory with the price you pay. Bulk pricing applies on its own once your
            quantity crosses the line.
          </p>
        </div>
        <div className="filters" role="group" aria-label="Filter materials" data-reveal>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="chip"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="product-grid">
          {items.map((item, i) => (
            <ProductCard key={item.id} item={item} featured={filter === "All" && i === 0} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProductCard({ item, featured }: { item: CatalogItem; featured: boolean }) {
  const card = useRef<HTMLLIElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const add = useCartStore((s) => s.add);
  const unitPrice = item.bulk && qty >= item.bulk.minQty ? item.bulk.price : item.price;
  const lowStock = item.stock < 50;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = card.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card.current, { rotationY: px * 10, rotationX: -py * 10, duration: 0.5, ease: "power3.out" });
    gsap.to(art.current, { x: px * 18, y: py * 12 - 14, z: 60, scale: 1.08, duration: 0.5, ease: "power3.out" });
  };
  const onLeave = () => {
    gsap.to(card.current, { rotationY: 0, rotationX: 0, duration: 0.7, ease: "elastic.out(1, 0.6)" });
    gsap.to(art.current, { x: 0, y: 0, z: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.6)" });
  };

  const onAdd = () => {
    add({ id: item.id, name: item.name, unit: item.unit, price: unitPrice }, qty);
    flyToCart(art.current?.querySelector("svg") ?? null);
    gsap.fromTo(
      art.current,
      { y: -30, rotation: -8 },
      { y: 0, rotation: 0, duration: 0.7, ease: "bounce.out" },
    );
  };

  return (
    <li
      ref={card}
      className={featured ? "product-card is-featured" : "product-card"}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="product-art">
        <div ref={art} className="product-art-inner">
          <MaterialIcon name={item.icon} />
        </div>
        <span className={lowStock ? "stock is-low" : "stock"}>
          {lowStock ? `Only ${item.stock} left` : item.delivery}
        </span>
      </div>
      <div className="product-body">
        <h3>{item.name}</h3>
        <p className="product-spec">{item.spec}</p>
        <p className="product-price">
          <strong>{formatPeso(unitPrice)}</strong> / {item.unit}
        </p>
        <p className="product-bulk">
          {item.bulk
            ? qty >= item.bulk.minQty
              ? "Bulk price applied"
              : `${formatPeso(item.bulk.price)} from ${item.bulk.minQty.toLocaleString()}`
            : `${item.stock.toLocaleString()} in the yard`}
        </p>
        <div className="product-actions">
          <div className="stepper">
            <button
              type="button"
              aria-label={`Fewer ${item.name}`}
              onClick={() => setQty((q) => Math.max(1, q - (q > 10 ? 10 : 1)))}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={qty}
              aria-label={`Quantity of ${item.name}`}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            />
            <button
              type="button"
              aria-label={`More ${item.name}`}
              onClick={() => setQty((q) => q + (q >= 10 ? 10 : 1))}
            >
              +
            </button>
          </div>
          <button type="button" className="btn btn-yellow" onClick={onAdd}>
            Add to cart
          </button>
        </div>
      </div>
    </li>
  );
}
