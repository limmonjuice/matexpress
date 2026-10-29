// Line-art construction doodles, drawn once as an SVG sprite and reused with <use>.
// Ink outlines, white fills and one safety-yellow accent, so they read like stickers
// when they pile on top of each other.

const W = "#FBFAF5";
const Y = "#FFC929";

export const MATERIAL_ICONS = [
  "hardhat",
  "brick",
  "cement",
  "rebar",
  "hammer",
  "wrench",
  "trowel",
  "cone",
  "wheelbarrow",
  "shovel",
  "roller",
  "tape",
  "level",
  "chb",
  "screw",
  "nut",
  "pipe",
  "plank",
  "saw",
  "drill",
  "hook",
  "bucket",
  "rocks",
  "roof",
  "ladder",
  "truck",
  "coil",
] as const;

export type MaterialIconName = (typeof MATERIAL_ICONS)[number];

export function IconSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        <Sym id="hardhat">
          <path d="M10 42a22 22 0 0 1 44 0Z" fill={Y} />
          <path d="M28 20.4c-3 6-4.5 13-4.5 21.6M36 20.4c3 6 4.5 13 4.5 21.6" fill="none" />
          <rect x="29" y="16" width="6" height="6" rx="2" fill={W} />
          <path d="M5 42h54v4.5a3.5 3.5 0 0 1-3.5 3.5h-47A3.5 3.5 0 0 1 5 46.5Z" fill={W} />
        </Sym>
        <Sym id="brick">
          <path d="M8 30 20 18h36L44 30Z" fill={W} />
          <path d="M44 30 56 18v20L44 50Z" fill={Y} />
          <rect x="8" y="30" width="36" height="20" fill={W} />
          <ellipse cx="20" cy="24" rx="3.5" ry="1.8" fill={Y} />
          <ellipse cx="32" cy="24" rx="3.5" ry="1.8" fill={Y} />
          <ellipse cx="44" cy="24" rx="3.5" ry="1.8" fill={Y} />
        </Sym>
        <Sym id="cement">
          <path d="M14 14q18-4 36 0l4 38q-22 6-44 0Z" fill={W} />
          <path d="M12.6 27q19.4-4 38.8 0l1.3 13q-20.7 4-41.4 0Z" fill={Y} />
          <path d="M24 32.5h16M27 36.5h10M14 14l-3-4M50 14l3-4" fill="none" />
        </Sym>
        <Sym id="rebar">
          <g transform="rotate(-38 32 32)">
            <rect x="2" y="22" width="60" height="5" rx="2.5" fill={W} />
            <rect x="2" y="29.5" width="60" height="5" rx="2.5" fill={W} />
            <rect x="2" y="37" width="60" height="5" rx="2.5" fill={W} />
            <path d="M10 22v5M18 22v5M42 22v5M50 22v5M14 29.5v5M46 29.5v5M10 37v5M18 37v5M42 37v5M50 37v5" fill="none" />
            <rect x="27" y="19" width="10" height="26" rx="2" fill={Y} />
          </g>
        </Sym>
        <Sym id="hammer">
          <g transform="rotate(-32 32 32)">
            <rect x="28.5" y="22" width="7" height="38" rx="3.5" fill={Y} />
            <path d="M16 10h28a6 6 0 0 1 6 6v6H16Z" fill={W} />
            <path d="M16 10q-8 2-9 12l9-3Z" fill={W} />
          </g>
        </Sym>
        <Sym id="wrench">
          <g transform="rotate(40 32 32)">
            <path d="M27 6v9h10V6a11 11 0 1 1-10 0Z" fill={Y} />
            <rect x="28" y="25" width="8" height="35" rx="4" fill={W} />
            <circle cx="32" cy="53" r="2" fill="none" />
          </g>
        </Sym>
        <Sym id="trowel">
          <path d="M6 54 28 24l14 14Z" fill={W} />
          <path d="M35 31 42 18" fill="none" />
          <rect x="38" y="6" width="8" height="18" rx="4" transform="rotate(40 42 15)" fill={Y} />
        </Sym>
        <Sym id="cone">
          <path d="M26 10h12l10 40H16Z" fill={Y} />
          <path d="M23 22h18l2 8H21ZM19.5 36h25l1.5 6H18Z" fill={W} />
          <rect x="9" y="50" width="46" height="6" rx="2" fill={W} />
        </Sym>
        <Sym id="wheelbarrow">
          <path d="M18 38 14 48M38 38l4 14M40 38l18 6" fill="none" />
          <path d="M6 20h44l-8 18H14Z" fill={Y} />
          <circle cx="14" cy="48" r="7" fill={W} />
          <circle cx="14" cy="48" r="2" fill="none" />
        </Sym>
        <Sym id="shovel">
          <g transform="rotate(-30 32 32)">
            <rect x="29" y="6" width="6" height="28" rx="3" fill={W} />
            <rect x="24" y="2" width="16" height="7" rx="3.5" fill={Y} />
            <path d="M21 34h22v11q0 12-11 17-11-5-11-17Z" fill={W} />
          </g>
        </Sym>
        <Sym id="roller">
          <path d="M46 17h8v13H32v8" fill="none" />
          <rect x="6" y="10" width="40" height="15" rx="7.5" fill={Y} />
          <rect x="28" y="37" width="8" height="21" rx="4" fill={W} />
        </Sym>
        <Sym id="tape">
          <path d="M40 40h18v8H40" fill={W} />
          <path d="M45 40v3.5M50 40v3.5M55 40v3.5" fill="none" />
          <rect x="6" y="16" width="36" height="36" rx="11" fill={Y} />
          <circle cx="24" cy="34" r="8.5" fill={W} />
          <circle cx="24" cy="34" r="2" fill="none" />
        </Sym>
        <Sym id="level">
          <rect x="3" y="24" width="58" height="15" rx="3" fill={Y} />
          <rect x="25" y="27" width="14" height="9" rx="4" fill={W} />
          <circle cx="33" cy="31.5" r="2" fill="none" />
          <circle cx="11" cy="31.5" r="2.5" fill={W} />
          <circle cx="53" cy="31.5" r="2.5" fill={W} />
        </Sym>
        <Sym id="chb">
          <path d="M6 22 14 14h44l-8 8Z" fill={W} />
          <path d="M50 22l8-8v26l-8 8Z" fill={Y} />
          <rect x="6" y="22" width="44" height="26" fill={W} />
          <rect x="11" y="28" width="15" height="14" rx="2" fill={Y} />
          <rect x="30" y="28" width="15" height="14" rx="2" fill={Y} />
        </Sym>
        <Sym id="screw">
          <path d="M27 18h10v30l-5 11-5-11Z" fill={W} />
          <path d="M27 24l10 3M27 30l10 3M27 36l10 3M27 42l10 3" fill="none" />
          <path d="M19 9h26l-3.5 9h-19Z" fill={Y} />
          <path d="M28 13.5h8" fill="none" />
        </Sym>
        <Sym id="nut">
          <path d="M54 32 43 13H21L10 32l11 19h22Z" fill={Y} />
          <circle cx="32" cy="32" r="9" fill={W} />
          <circle cx="32" cy="32" r="4.5" fill="none" />
        </Sym>
        <Sym id="pipe">
          <path d="M10 20h20a14 14 0 0 1 14 14v20H32V34a2 2 0 0 0-2-2H10Z" fill={W} />
          <rect x="6" y="17" width="7" height="18" rx="1.5" fill={Y} />
          <rect x="29" y="51" width="18" height="7" rx="1.5" fill={Y} />
        </Sym>
        <Sym id="plank">
          <g transform="rotate(-24 32 32)">
            <rect x="2" y="24" width="54" height="16" rx="1" fill={W} />
            <path d="M8 29q9 4 18 0t18 0M10 35q10-3 20 0t16 0" fill="none" />
            <rect x="54" y="24" width="8" height="16" rx="1" fill={Y} />
            <path d="M58 28.5v7" fill="none" />
          </g>
        </Sym>
        <Sym id="saw">
          <path d="M4 44 42 18l6 12-40 22Z" fill={W} />
          <path d="M9 50l2-3.5 2 2.4 2-3.6 2 2.4 2-3.6 2 2.4 2-3.6 2 2.4 2-3.6 2 2.4 2-3.6 2 2.4 2-3.6 2 2.4 2-3.6" fill="none" />
          <path d="M40 14h14a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5h-6Z" fill={Y} />
          <rect x="46" y="21" width="8" height="10" rx="3" fill={W} />
        </Sym>
        <Sym id="drill">
          <path d="M52 26h9" fill="none" />
          <rect x="46" y="21" width="7" height="10" rx="1.5" fill={W} />
          <path d="M20 34h13l-2.5 18h-13Z" fill={W} />
          <path d="M8 16h33a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7H8Z" fill={Y} />
          <path d="M14 22v8M19 22v8" fill="none" />
          <rect x="12" y="50" width="24" height="8" rx="2.5" fill={Y} />
        </Sym>
        <Sym id="hook">
          <path d="M32 2v10" fill="none" />
          <rect x="22" y="12" width="20" height="13" rx="3" fill={Y} />
          <circle cx="32" cy="18.5" r="2.5" fill={W} />
          <path d="M32 25v12a10 10 0 1 1-10 10" fill="none" strokeWidth="7" />
          <path d="M32 25v12a10 10 0 1 1-10 10" fill="none" stroke={W} strokeWidth="2.6" />
        </Sym>
        <Sym id="bucket">
          <path d="M14 23q18-28 36 0" fill="none" />
          <path d="M13 23h38l-4.5 33h-29Z" fill={W} />
          <ellipse cx="32" cy="23" rx="19" ry="5" fill={Y} />
          <path d="M20 26v10a2.3 2.3 0 0 0 4.6 0v-8" fill={Y} />
        </Sym>
        <Sym id="rocks">
          <path d="M30 52q-3-17 10-19 12-1 15 8 3 8-3 11Z" fill={Y} />
          <path d="M5 52q0-14 11-15 9-1 12 7 2 6-1 8Z" fill={W} />
          <path d="M18 34q-1-12 9-14 10-1 12 7 1 5-3 8-9 3-18-1Z" fill={W} />
          <path d="M3 52h58" fill="none" />
        </Sym>
        <Sym id="roof">
          <path d="M5 24q5-6 10 0t10 0 10 0 10 0 10 0 10 0v20q-5-6-10 0t-10 0-10 0-10 0-10 0-10 0Z" fill={Y} />
          <path d="M10 21v20M20 21v20M30 21v20M40 21v20M50 21v20" fill="none" />
        </Sym>
        <Sym id="ladder">
          <path d="M18 4h5l-6 56h-5ZM41 4h5l6 56h-5Z" fill={W} />
          <path d="M21.9 12h20.2v4H21.5ZM20.6 25h22.8v4H20.2ZM19.4 38h25.2v4H19ZM18.1 51h27.8v4H17.7Z" fill={Y} />
        </Sym>
        <Sym id="truck">
          <rect x="3" y="14" width="36" height="28" rx="2.5" fill={Y} />
          <path d="M39 22h12l9 10v10H39Z" fill={W} />
          <path d="M43 26h7l5 6H43Z" fill="none" />
          <circle cx="15" cy="46" r="6.5" fill={W} />
          <circle cx="48" cy="46" r="6.5" fill={W} />
          <circle cx="15" cy="46" r="2" fill="none" />
          <circle cx="48" cy="46" r="2" fill="none" />
        </Sym>
        <Sym id="coil">
          <ellipse cx="30" cy="44" rx="22" ry="10" fill={W} />
          <ellipse cx="30" cy="37" rx="22" ry="10" fill={W} />
          <ellipse cx="30" cy="30" rx="22" ry="10" fill={W} />
          <ellipse cx="30" cy="30" rx="10" ry="4" fill="none" />
          <path d="M52 30q8 2 8 10" fill="none" />
          <rect x="44" y="8" width="14" height="10" rx="2" transform="rotate(14 51 13)" fill={Y} />
        </Sym>
      </defs>
    </svg>
  );
}

function Sym({ id, children }: { id: MaterialIconName; children: React.ReactNode }) {
  return (
    <symbol id={`mx-${id}`} viewBox="0 0 64 64">
      <g stroke="#16150F" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </symbol>
  );
}

export function MaterialIcon({
  name,
  className,
  title,
}: {
  name: MaterialIconName;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <use href={`#mx-${name}`} />
    </svg>
  );
}
