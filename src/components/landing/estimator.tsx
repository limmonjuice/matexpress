"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCartStore, type CartLine } from "@/stores/cart-store";
import { catalogById, formatPeso } from "./catalog";
import { MaterialIcon } from "./material-icons";

const THICKNESS = [10, 12.5, 15, 20] as const;
const MIXES = {
  A: { label: "Class A · 1:2:4", note: "Slabs, beams, columns", cementPerM3: 9 },
  B: { label: "Class B · 1:2.5:5", note: "Walkways, light slabs", cementPerM3: 7.5 },
} as const;
const WASTE = 1.05;
const BAR_SPACING = 0.3; // 12 mm bars at 300 mm both ways
const KG_PER_TIE = 0.015;

function estimate(length: number, width: number, thicknessCm: number, mix: keyof typeof MIXES) {
  const volume = length * width * (thicknessCm / 100) * WASTE;
  const barsAlong = Math.floor(width / BAR_SPACING) + 1;
  const barsAcross = Math.floor(length / BAR_SPACING) + 1;
  const barMeters = barsAlong * length + barsAcross * width;

  const quantities = {
    "cement-opc-40": Math.ceil(volume * MIXES[mix].cementPerM3),
    "sand-washed": Math.ceil(volume * 0.5 * 2) / 2,
    "gravel-34": Math.ceil(volume * 1.0 * 2) / 2,
    "rebar-12-g40": Math.ceil((barMeters * 1.1) / 6),
    "tie-wire-16": Math.max(1, Math.ceil(barsAlong * barsAcross * KG_PER_TIE)),
  };

  const lines: CartLine[] = Object.entries(quantities).map(([id, quantity]) => {
    const item = catalogById[id];
    const price = item.bulk && quantity >= item.bulk.minQty ? item.bulk.price : item.price;
    return { id, name: item.name, unit: item.unit, price, quantity };
  });
  return { volume, lines, total: lines.reduce((s, l) => s + l.price * l.quantity, 0) };
}

function Counter({ value, format }: { value: number; format: (n: number) => string }) {
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  useEffect(() => {
    const state = { n: shown.current };
    const tween = gsap.to(state, {
      n: value,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => {
        shown.current = state.n;
        if (el.current) el.current.textContent = format(state.n);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, format]);
  return <span ref={el}>{format(value)}</span>;
}

const formatQty = (n: number) => (Math.round(n * 2) / 2).toLocaleString("en-PH");
const formatTotal = (n: number) => formatPeso(Math.round(n));
const plural = (unit: string, n: number) => (unit === "kg" || unit === "m³" || n === 1 ? unit : `${unit}s`);

export function Estimator() {
  const root = useRef<HTMLElement>(null);
  const slip = useRef<HTMLDivElement>(null);
  const [length, setLength] = useState(8);
  const [width, setWidth] = useState(6);
  const [thickness, setThickness] = useState<(typeof THICKNESS)[number]>(12.5);
  const [mix, setMix] = useState<keyof typeof MIXES>("A");
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const addMany = useCartStore((s) => s.addMany);
  const open = useCartStore((s) => s.open);

  const result = useMemo(() => estimate(length, width, thickness, mix), [length, width, thickness, mix]);
  const key = `${length}-${width}-${thickness}-${mix}`;
  const added = addedKey === key;

  const { contextSafe } = useGSAP({ scope: root });

  const addAll = contextSafe(() => {
    addMany(result.lines);
    setAddedKey(key);
    gsap.fromTo(
      ".slip-line",
      { x: 0 },
      { x: 18, duration: 0.18, yoyo: true, repeat: 1, stagger: 0.05, ease: "power2.out" },
    );
    window.setTimeout(() => open(), 450);
  });

  return (
    <section ref={root} id="estimator" className="section estimator" data-theme="yellow" aria-labelledby="estimator-title">
      <div className="frame estimator-grid">
        <div className="estimator-controls">
          <h2 id="estimator-title" data-reveal>
            Price your slab before you pour.
          </h2>
          <p className="estimator-lede" data-reveal>
            Set the size and the mix. We work out the cement, aggregates and steel, priced from the
            yard right now.
          </p>

          <div className="field" data-reveal>
            <label htmlFor="slab-length">
              Length <output htmlFor="slab-length">{length} m</output>
            </label>
            <input
              id="slab-length"
              type="range"
              min={2}
              max={30}
              step={0.5}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
            />
          </div>
          <div className="field" data-reveal>
            <label htmlFor="slab-width">
              Width <output htmlFor="slab-width">{width} m</output>
            </label>
            <input
              id="slab-width"
              type="range"
              min={2}
              max={20}
              step={0.5}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </div>
          <fieldset className="field" data-reveal>
            <legend>Thickness</legend>
            <div className="segmented">
              {THICKNESS.map((t) => (
                <button key={t} type="button" aria-pressed={thickness === t} onClick={() => setThickness(t)}>
                  {t} cm
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="field" data-reveal>
            <legend>Concrete mix</legend>
            <div className="segmented">
              {(Object.keys(MIXES) as (keyof typeof MIXES)[]).map((m) => (
                <button key={m} type="button" aria-pressed={mix === m} onClick={() => setMix(m)}>
                  {MIXES[m].label}
                  <small>{MIXES[m].note}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div ref={slip} className="slip" data-reveal aria-live="polite">
          <div className="slip-head">
            <h3>Materials for {(length * width).toLocaleString("en-PH")} m² slab</h3>
            <p>
              {result.volume.toFixed(2)} m³ of concrete, 5% allowance included. 12 mm bars at 300 mm
              both ways.
            </p>
          </div>
          <ul className="slip-lines">
            {result.lines.map((line) => (
              <li key={line.id} className="slip-line">
                <MaterialIcon name={catalogById[line.id].icon} className="slip-icon" />
                <span className="slip-name">
                  {line.name}
                  <small>
                    {formatPeso(line.price)} / {line.unit}
                  </small>
                </span>
                <span className="slip-qty">
                  <Counter value={line.quantity} format={formatQty} /> {plural(line.unit, line.quantity)}
                </span>
                <span className="slip-sub">
                  <Counter value={line.price * line.quantity} format={formatTotal} />
                </span>
              </li>
            ))}
          </ul>
          <div className="slip-total">
            <span>Estimated total</span>
            <strong>
              <Counter value={result.total} format={formatTotal} />
            </strong>
          </div>
          <button type="button" className="btn btn-ink btn-block" onClick={addAll}>
            {added ? "Added to cart" : "Add all to cart"}
          </button>
        </div>
      </div>
    </section>
  );
}
