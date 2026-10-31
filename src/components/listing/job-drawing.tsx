import type { Job } from "@/lib/catalog/types";

/** Each job as the section a site engineer would sketch it: steel and structure in orange, the rest in chalk. */
export function JobDrawing({ kind }: { kind: Job["drawing"] }) {
  return (
    <svg className="hm-job-drawing" viewBox="0 0 240 150" aria-hidden="true">
      {DRAWINGS[kind]}
    </svg>
  );
}

const hatch = (x1: number, x2: number, y: number) =>
  Array.from({ length: Math.floor((x2 - x1) / 14) }, (_, i) => <path key={i} d={`M${x1 + i * 14} ${y + 10}l10-10`} />);

const DRAWINGS: Record<Job["drawing"], React.ReactNode> = {
  slab: (
    <>
      <g className="hm-d-line">
        <path d="M20 66v28h200V66" />
        <path d="M14 66h212" />
        <path d="M14 94h212" />
        {hatch(20, 220, 96)}
        <path d="M20 66V40M220 66V40" />
      </g>
      <g className="hm-d-accent">
        <path d="M30 86h180" />
        <path d="M30 74h180" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={38 + i * 21} cy="80" r="3.2" />
        ))}
      </g>
      <g className="hm-d-text">
        <path d="M20 30h200M20 26v8M220 26v8" />
      </g>
    </>
  ),
  wall: (
    <>
      <g className="hm-d-line">
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={row}>
            <path d={`M34 ${122 - row * 22}h172`} />
            {Array.from({ length: 5 }, (_, i) => (
              <path key={i} d={`M${(row % 2 ? 56 : 34) + i * 43} ${100 - row * 22}v22`} />
            ))}
          </g>
        ))}
        <path d="M34 122V12M206 122V12" />
        <path d="M20 130h200" />
      </g>
      <g className="hm-d-accent">
        <path d="M77 138V18M163 138V18" />
        {[34, 78].map((y) => (
          <path key={y} d={`M34 ${y}h172`} strokeDasharray="5 4" />
        ))}
      </g>
    </>
  ),
  roof: (
    <>
      <g className="hm-d-line">
        <path d="M40 128V82h160v46" />
        <path d="M18 92 120 26l102 66" />
        <path d="M14 130h212" />
      </g>
      <g className="hm-d-accent">
        <path d="M40 82 120 34l80 48" />
        <path d="M120 34v48M80 58v24M160 58v24" />
        <path d="M80 82l40-24 40 24" />
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t) => (
          <g key={t}>
            <circle cx={18 + 102 * t} cy={92 - 66 * t} r="3" />
            <circle cx={222 - 102 * t} cy={92 - 66 * t} r="3" />
          </g>
        ))}
      </g>
    </>
  ),
  wiring: (
    <>
      <g className="hm-d-line">
        <path d="M24 22h192v110H24z" />
        <path d="M120 22v62M120 106v26M24 76h60M104 76h112" />
        <path d="M86 76a18 18 0 0 1 18 18" />
      </g>
      <g className="hm-d-accent">
        <circle cx="72" cy="48" r="6" />
        <path d="M67.8 43.8l8.4 8.4M76.2 43.8l-8.4 8.4" />
        <circle cx="168" cy="48" r="6" />
        <path d="M163.8 43.8l8.4 8.4M172.2 43.8l-8.4 8.4" />
        <circle cx="168" cy="106" r="6" />
        <path d="M163.8 101.8l8.4 8.4M172.2 101.8l-8.4 8.4" />
        <path d="M78 48q45-26 84 0" strokeDasharray="5 4" />
        <path d="M168 54q18 24 0 46" strokeDasharray="5 4" />
        <path d="M36 118h16v14H36z" />
        <path d="M52 124q40 4 56-26 8-16-30-44" strokeDasharray="5 4" />
      </g>
    </>
  ),
  plumbing: (
    <>
      <g className="hm-d-line">
        <rect x="150" y="14" width="44" height="52" rx="10" />
        <path d="M162 14v-4h20v4" />
        <path d="M14 128h212" />
        {hatch(14, 226, 130)}
        <path d="M48 112c0 10 26 10 26 0v-8H42v8Z" />
        <path d="M66 104V84h14v20" />
      </g>
      <g className="hm-d-accent">
        <path d="M172 66v22H96v18" />
        <path d="M58 120v26H210" />
        <path d="M172 88v58" />
        <path d="M96 112v34" />
        <circle cx="172" cy="88" r="3" />
        <circle cx="96" cy="146" r="3" />
        <circle cx="172" cy="146" r="3" />
      </g>
    </>
  ),
  finishing: (
    <>
      <g className="hm-d-line">
        <path d="M30 18h180v76H30z" />
        <path d="M30 94 8 136h224l-22-42" />
        <path d="M78 94 66 136M126 94l-6 42M174 94l6 42" />
        <path d="M21 112h198M14 124h212" />
      </g>
      <g className="hm-d-accent">
        <path d="M46 94V18M62 94V18M78 94V18M94 94V18M110 94V18" />
        <rect x="118" y="46" width="44" height="14" rx="4" />
        <path d="M162 53h10v18h-30v12" />
      </g>
    </>
  ),
};
