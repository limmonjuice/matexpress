"use client";

// Labels that ride on the 3D scene. They are ordinary DOM in one overlay; the
// scene projects each label's 3D anchor to the screen every frame and moves it
// there (see placeLabels in journey-scene.tsx).

/** Sample sellers for the four stacks of the load, front to back. */
export const SUPPLIERS = [
  { seller: "Tibay Steel", item: "GI and uPVC pipe", price: "from ₱680" },
  { seller: "Kahoy Lumber", item: "Marine plywood", price: "from ₱1,150" },
  { seller: "Dalisay Hardware", item: "Portland cement", price: "from ₱252 a bag" },
  { seller: "Bakal Supply", item: "Deformed rebar", price: "from ₱232" },
];

/** Sample sellers on the night map (world x, z around the truck at the origin). */
export const SELLERS = [
  { name: "Dalisay Hardware", x: -8, z: -5 },
  { name: "Tibay Steel", x: -9.5, z: 3.5 },
  { name: "Kahoy Lumber", x: -2, z: 9 },
  { name: "Bakal Supply", x: 7.5, z: 8 },
  { name: "Liwanag Paints", x: 9.5, z: -2 },
  { name: "Bato Aggregates", x: 3, z: -9 },
];

/** The label elements, filled in as they mount; the scene reads them every frame. */
export const labelEls = {
  tags: [] as (HTMLDivElement | null)[],
  pins: [] as (HTMLDivElement | null)[],
  summary: null as HTMLDivElement | null,
  eta: null as HTMLDivElement | null,
};

export function SceneLabels() {
  return (
    <div className="scene-labels">
      {SUPPLIERS.map((s, i) => (
        <div
          key={s.seller}
          ref={(el) => {
            labelEls.tags[i] = el;
          }}
          className="tag"
        >
          <b>{s.seller}</b>
          <span>{s.item}</span>
          <em>{s.price}</em>
        </div>
      ))}
      <div
        ref={(el) => {
          labelEls.summary = el;
        }}
        className="chip"
      >
        <b>One order · 4 sellers · ₱86,420</b>
        <span>Delivery Thursday, 7–9 AM</span>
      </div>
      <div
        ref={(el) => {
          labelEls.eta = el;
        }}
        className="chip chip--live"
      >
        <b>Arriving 10:40 AM</b>
        <span>6.2 km away · Truck MX-204</span>
      </div>
      {SELLERS.map((s, i) => (
        <div
          key={s.name}
          ref={(el) => {
            labelEls.pins[i] = el;
          }}
          className="pin-tag"
        >
          {s.name}
        </div>
      ))}
    </div>
  );
}
