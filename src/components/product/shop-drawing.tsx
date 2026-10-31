import type { Drawing } from "@/lib/catalog/types";

// A shop drawing of the product: real sizes from the catalog, drawn the way the
// people buying it read them, with a 1.7 m person standing in for scale. It's a
// live drawing, so picking another size changes the picture. The photos show what
// it looks like; this shows how big it is.

const VIEW = 640;
const FIGURE_MM = 1700;

function DimH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g className="hm-sd-dim">
      <path d={`M${x1} ${y}H${x2}M${x1} ${y - 7}v14M${x2} ${y - 7}v14`} />
      <text x={(x1 + x2) / 2} y={y - 12} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function DimV({ y1, y2, x, label, side = "right" }: { y1: number; y2: number; x: number; label: string; side?: "left" | "right" }) {
  return (
    <g className="hm-sd-dim">
      <path d={`M${x} ${y1}V${y2}M${x - 7} ${y1}h14M${x - 7} ${y2}h14`} />
      <text x={side === "right" ? x + 12 : x - 12} y={(y1 + y2) / 2 + 6} textAnchor={side === "right" ? "start" : "end"}>
        {label}
      </text>
    </g>
  );
}

/** The drafter's scale figure. */
function Figure({ x, ground, height }: { x: number; ground: number; height: number }) {
  const s = height / 340;
  return (
    <g className="hm-sd-figure" transform={`translate(${x} ${ground - height}) scale(${s})`}>
      <circle cy="26" r="24" />
      <path d="M-30 60H30Q38 60 39 70L46 176Q46 182 40 182 34 182 33 176L27 102V200L32 340H6L2 214H-2L-6 340H-32L-27 200V102L-33 176Q-34 182-40 182-46 182-46 176L-39 70Q-38 60-30 60Z" />
    </g>
  );
}

const Ground = ({ y }: { y: number }) => <path className="hm-sd-ground" d={`M40 ${y}H600`} />;

const metres = (mm: number) => (mm >= 1000 ? `${Number((mm / 1000).toFixed(2))} m` : `${mm} mm`);

function Section({ drawing, cx, cy }: { drawing: Extract<Drawing, { kind: "bar" | "pipe" }>; cx: number; cy: number }) {
  const shape = drawing.kind === "bar" ? (drawing.section ?? "round") : "pipe";
  const d = drawing.diameterMm;
  if (shape === "round" || shape === "pipe") {
    const r = Math.min(74, Math.max(14, d * 2.8));
    return (
      <g>
        <circle className="hm-sd-solid" cx={cx} cy={cy} r={r} />
        {shape === "pipe" && <circle className="hm-sd-hole" cx={cx} cy={cy} r={r * 0.78} />}
        <text className="hm-sd-text" x={cx} y={cy + r + 28} textAnchor="middle">
          Ø {d} mm section
        </text>
      </g>
    );
  }
  const [a, b] = drawing.kind === "bar" && drawing.sectionMm ? drawing.sectionMm : [d, d];
  const scale = 110 / Math.max(a, b);
  const w = a * scale;
  const h = b * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const t = shape === "angle" ? Math.max(6, b * (120 / a) * 0.5) : 10;
  return (
    <g>
      {shape === "rect" && <rect className="hm-sd-solid" x={x} y={y} width={w} height={h} />}
      {shape === "angle" && <path className="hm-sd-solid" d={`M${cx - 55} ${cy - 55}h${t}V${cy + 55 - t}H${cx + 55}v${t}H${cx - 55}Z`} />}
      {shape === "c" && <path className="hm-sd-solid" d={`M${x + w} ${y}H${x}V${y + h}H${x + w}v-10H${x + 10}V${y + 10}H${x + w}Z`} />}
      <text className="hm-sd-text" x={cx} y={cy + Math.max(h, 110) / 2 + 28} textAnchor="middle">
        {a} × {b} mm section
      </text>
    </g>
  );
}

const DRAW: { [K in Drawing["kind"]]: (d: Extract<Drawing, { kind: K }>) => React.ReactNode } = {
  bar: (d) => {
    const ground = 500;
    const s = 460 / d.lengthMm;
    const figureH = Math.min(300, FIGURE_MM * s);
    const thick = Math.max(4, d.diameterMm * 0.42);
    return (
      <>
        <Section drawing={d} cx={430} cy={170} />
        <Ground y={ground} />
        <Figure x={100} ground={ground} height={figureH} />
        <path className="hm-sd-bar" style={{ strokeWidth: thick }} d={`M60 ${ground - 14}H${60 + d.lengthMm * s}`} />
        <DimH x1={60} x2={60 + d.lengthMm * s} y={ground + 42} label={metres(d.lengthMm)} />
      </>
    );
  },
  pipe: (d) => {
    const ground = 500;
    const s = 460 / d.lengthMm;
    const thick = Math.max(6, d.diameterMm * 0.26);
    return (
      <>
        <Section drawing={d} cx={430} cy={170} />
        <Ground y={ground} />
        <Figure x={100} ground={ground} height={Math.min(300, FIGURE_MM * s)} />
        <path className="hm-sd-bar" style={{ strokeWidth: thick }} d={`M60 ${ground - 16}H${60 + d.lengthMm * s}`} />
        <DimH x1={60} x2={60 + d.lengthMm * s} y={ground + 42} label={metres(d.lengthMm)} />
      </>
    );
  },
  sheet: (d) => {
    const ground = 540;
    const s = 420 / d.heightMm;
    const w = d.widthMm * s;
    const h = d.heightMm * s;
    const x = 240;
    const edge = Math.max(4, d.thicknessMm * 2.4);
    return (
      <>
        <Ground y={ground} />
        <Figure x={120} ground={ground} height={FIGURE_MM * s} />
        <rect className="hm-sd-face" x={x} y={ground - h} width={w} height={h} />
        <rect className="hm-sd-solid" x={x + w} y={ground - h} width={edge} height={h} />
        <DimV y1={ground - h} y2={ground} x={x + w + edge + 24} label={metres(d.heightMm)} />
        <DimH x1={x} x2={x + w} y={ground - h - 22} label={metres(d.widthMm)} />
        <text className="hm-sd-text" x={x + w / 2} y={ground - h / 2} textAnchor="middle">
          {d.thicknessMm} mm thick
        </text>
      </>
    );
  },
  roof: (d) => {
    const ground = 540;
    const s = 420 / d.lengthMm;
    const h = d.lengthMm * s;
    const w = d.widthMm * s;
    const x = 250;
    const waves = 8;
    const unit = 280 / waves;
    const profile = Array.from({ length: waves }, () => `q${unit / 4} -26 ${unit / 2} 0t${unit / 2} 0`).join("");
    return (
      <>
        <Ground y={ground} />
        <Figure x={130} ground={ground} height={Math.min(320, FIGURE_MM * s)} />
        <rect className="hm-sd-face" x={x} y={ground - h} width={w} height={h} />
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} className="hm-sd-rib" d={`M${x + ((i + 1) * w) / 7} ${ground - h}V${ground}`} />
        ))}
        <DimV y1={ground - h} y2={ground} x={x + w + 24} label={metres(d.lengthMm)} />
        <path className="hm-sd-bar hm-sd-bar--thin" d={`M330 ${d.lengthMm > 3100 ? 90 : 110}${profile}`} />
        <text className="hm-sd-text" x={470} y={d.lengthMm > 3100 ? 130 : 150} textAnchor="middle">
          {d.gaugeNote}
        </text>
      </>
    );
  },
  block: (d) => {
    const s = 400 / d.widthMm;
    const w = d.widthMm * s;
    const h = Math.max(36, d.heightMm * s);
    const depth = Math.max(36, d.depthMm * s);
    const x = 120;
    const top = 90;
    const planY = top + h + 110;
    const gap = w / (d.holes * 3 + 1);
    return (
      <>
        <text className="hm-sd-text" x={x} y={top - 44}>
          Front
        </text>
        <rect className="hm-sd-face" x={x} y={top} width={w} height={h} />
        <DimH x1={x} x2={x + w} y={top - 12} label={`${d.widthMm} mm`} />
        <DimV y1={top} y2={top + h} x={x + w + 24} label={`${d.heightMm} mm`} />

        <text className="hm-sd-text" x={x} y={planY - 22}>
          From above
        </text>
        <rect className="hm-sd-face" style={{ height: depth }} x={x} y={planY} width={w} />
        {Array.from({ length: d.holes }, (_, i) => (
          <rect key={i} className="hm-sd-hole" style={{ height: depth * 0.58 }} x={x + gap + i * gap * 3} y={planY + depth * 0.21} width={gap * 2} rx="4" />
        ))}
        <DimV y1={planY} y2={planY + depth} x={x + w + 24} label={`${d.depthMm} mm`} />
      </>
    );
  },
  bag: (d) => {
    const ground = 520;
    const s = 0.2;
    const scale = Math.cbrt(d.kg / 40);
    const w = 400 * scale * s * 2.4;
    const h = 620 * scale * s * 2.4;
    const x = 300;
    return (
      <>
        <Ground y={ground} />
        <Figure x={170} ground={ground} height={FIGURE_MM * s * 1.14} />
        <path
          className="hm-sd-face"
          style={{ transition: "none" }}
          d={`M${x} ${ground}q-10 -${h / 2} 4 -${h - 14}q${w / 2} -10 ${w - 8} 0q14 ${h / 2} 4 ${h - 14}q-${w / 2} 8 -${w} 0Z`}
        />
        <path className="hm-sd-rib" d={`M${x + 8} ${ground - h + 34}h${w - 16}`} />
        <DimV y1={ground - h + 6} y2={ground} x={x + w + 26} label={`${Math.round(620 * scale)} mm`} />
        <text className="hm-sd-text hm-sd-text--big" x={x + w / 2} y={ground - h / 2 + 10} textAnchor="middle">
          {d.kg} kg
        </text>
      </>
    );
  },
  can: (d) => {
    const ground = 540;
    const s = d.scaleFigure ? 380 / Math.max(FIGURE_MM, d.heightMm) : 300 / d.heightMm;
    const w = d.diameterMm * s;
    const h = d.heightMm * s;
    const x = d.scaleFigure ? 300 : 320 - w / 2;
    const ry = Math.max(10, w * 0.12);
    return (
      <>
        <Ground y={ground} />
        {d.scaleFigure && <Figure x={180} ground={ground} height={FIGURE_MM * s} />}
        <path className="hm-sd-face" d={`M${x} ${ground - h}V${ground - ry}a${w / 2} ${ry} 0 0 0 ${w} 0V${ground - h}`} />
        <ellipse className="hm-sd-face" cx={x + w / 2} cy={ground - h} rx={w / 2} ry={ry} />
        <DimH x1={x} x2={x + w} y={ground - h - ry - 18} label={`Ø ${d.diameterMm} mm`} />
        <DimV y1={ground - h} y2={ground} x={x + w + 24} label={`${d.heightMm} mm`} />
        <text className="hm-sd-text hm-sd-text--big" x={x + w / 2} y={ground - h / 2 + 12} textAnchor="middle">
          {d.litres} {d.litres === 20 ? "kg" : "L"}
        </text>
      </>
    );
  },
  pile: (d) => {
    const ground = 490;
    const m = 196;
    const skew = 60;
    const x = 250;
    return (
      <>
        <Ground y={ground} />
        <Figure x={150} ground={ground} height={m * 1.7} />
        {/* One cubic metre, with the heap it makes inside it. */}
        <path className="hm-sd-rib" d={`M${x} ${ground}V${ground - m}H${x + m}V${ground}M${x} ${ground - m}l${skew} -${skew}H${x + m + skew}l-${skew} ${skew}M${x + m + skew} ${ground - m - skew}V${ground - skew}L${x + m} ${ground}`} />
        <path className="hm-sd-heap" d={`M${x + 6} ${ground}Q${x + m * 0.32} ${ground - m * 0.46} ${x + m * 0.52} ${ground - m * 0.74}Q${x + m * 0.8} ${ground - m * 0.42} ${x + m + 34} ${ground}Z`} />
        <DimH x1={x} x2={x + m} y={ground + 42} label="1 m" />
        <DimV y1={ground - m} y2={ground} x={x + m + skew + 24} label="1 m" />
        <text className="hm-sd-text" x={320} y={ground + 92} textAnchor="middle">
          {d.note}
        </text>
      </>
    );
  },
  coil: (d) => {
    const cx = 300;
    const cy = 270;
    return (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} className="hm-sd-rib" cx={cx} cy={cy} r={110 + i * 12} />
        ))}
        <circle className="hm-sd-hole" cx={cx} cy={cy} r={100} />
        <text className="hm-sd-text hm-sd-text--big" x={cx} y={cy + 8} textAnchor="middle">
          {d.lengthM.toLocaleString("en-PH")} m
        </text>
        <text className="hm-sd-text" x={cx} y={cy + 240} textAnchor="middle">
          {d.note}
        </text>
      </>
    );
  },
  tile: (d) => {
    const size = 320;
    const x = 130;
    const y = 120;
    return (
      <>
        <rect className="hm-sd-face" x={x} y={y} width={size} height={size} />
        <rect className="hm-sd-solid" x={x} y={y + size} width={size} height={Math.max(6, d.thicknessMm)} />
        <DimH x1={x} x2={x + size} y={y - 22} label={`${d.sideMm} mm`} />
        <DimV y1={y} y2={y + size} x={x + size + 24} label={`${d.sideMm} mm`} />
        <text className="hm-sd-text" x={x + size / 2} y={y + size + 54} textAnchor="middle">
          {d.thicknessMm} mm thick. {d.note}
        </text>
      </>
    );
  },
};

export function ShopDrawing({ drawing, label }: { drawing: Drawing; label: string }) {
  const draw = DRAW[drawing.kind] as (d: Drawing) => React.ReactNode;
  return (
    <svg className="hm-sd" viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label={`Scale drawing: ${label}`}>
      {draw(drawing)}
    </svg>
  );
}
