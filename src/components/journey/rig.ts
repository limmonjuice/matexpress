// The one object the scroll timeline animates and the 3D scene reads every frame.
//
// The truck stays at the world origin; a camera rig moves around it. The camera
// orbits a target point: `az` is the angle around it (0 = looking from +z),
// `el` the height angle, `r` the distance. `fx`/`fy` shift the lens so the
// target sits off-centre on screen, leaving room for the chapter's words.

/** The truck's heading, matched to the truck in the hero photo. */
export const TRUCK_YAW = -0.8;

/** Where the hero photo's camera stands relative to the truck. */
export const HERO_CAMERA = [-0.92, 0.55, 13.5] as const;

export type CameraKey = {
  az: number;
  el: number;
  r: number;
  tx: number;
  ty: number;
  tz: number;
  fov: number;
  fx: number;
  fy: number;
  bg: string;
  fogNear: number;
  fogFar: number;
};

/** Roughly the hero camera, as an orbit; only seen while the photo blend fades out. */
const START: CameraKey = {
  az: -0.07,
  el: -0.05,
  r: 13.5,
  tx: 0,
  ty: 1.2,
  tz: 0,
  fov: 30,
  fx: 0.5,
  fy: 0.5,
  bg: "#ece5dc",
  fogNear: 60,
  fogFar: 160,
};

export const KEYS = {
  /** 1 · Search: side-on and a little high, like an exploded diagram; the load comes apart by supplier. */
  search: { az: -0.62, el: 0.24, r: 22, tx: -0.8, ty: 2.3, tz: 0, fov: 30, fx: 0.66, fy: 0.5, bg: "#ece5dc", fogNear: 34, fogFar: 100 },
  /** 2 · Order: swung round the nose to the front-right; the load flies back as one. */
  order: { az: 1.9, el: 0.2, r: 17, tx: 0, ty: 1.45, tz: 0, fov: 30, fx: 0.32, fy: 0.52, bg: "#e4e9ee", fogNear: 32, fogFar: 95 },
  /** 3 · Deliver: round the back to a low tracking shot on the left, at blue hour. */
  deliver: { az: 5.93, el: 0.05, r: 16.5, tx: 0.5, ty: 1.15, tz: 0.5, fov: 32, fx: 0.69, fy: 0.6, bg: "#1a2130", fogNear: 20, fogFar: 70 },
  /** 4 · Sell: craned up to a top-down night map of the sellers around the truck. */
  sell: { az: 6.03, el: 1.42, r: 44, tx: 0, ty: 0, tz: 0, fov: 34, fx: 0.34, fy: 0.5, bg: "#131925", fogNear: 50, fogFar: 130 },
  /** 5 · Build: down to a low front three-quarter view at sunrise, headlamps still on. */
  build: { az: 7.53, el: 0.07, r: 16, tx: 0.3, ty: 1.2, tz: 0.3, fov: 30, fx: 0.68, fy: 0.55, bg: "#efe5d8", fogNear: 30, fogFar: 90 },
} satisfies Record<string, CameraKey>;

export const rig = {
  /** 1 = the camera is locked to the hero photo, 0 = the free camera rig. */
  photo: 1,
  ...START,
  /** How far the load has come apart (0 packed, 1 apart). */
  explode: 0,
  /** "One order" chip over the truck. */
  summary: 0,
  /** Arrival chip over the cab. */
  eta: 0,
  /** Metres driven; the road, lamps and wheels follow it. */
  road: 0,
  roadVis: 0,
  lights: 0,
  /** 0 golden hour, 1 blue hour. */
  dusk: 0,
  mapVis: 0,
  mapDraw: 0,
};

export type Rig = typeof rig;

export function resetRig() {
  Object.assign(rig, {
    photo: 1,
    ...START,
    explode: 0,
    summary: 0,
    eta: 0,
    road: 0,
    roadVis: 0,
    lights: 0,
    dusk: 0,
    mapVis: 0,
    mapDraw: 0,
  });
}

/** Chapters, in order, with the scroll units where each one's words take over. */
export const CHAPTERS = [
  { id: "how-it-works", label: "Search", tone: "light" },
  { id: "ordering", label: "Order", tone: "light" },
  { id: "for-your-project", label: "Deliver", tone: "dark" },
  { id: "sell", label: "Sell", tone: "dark" },
  { id: "get-started", label: "Build", tone: "light" },
] as const;

// Scroll units: the story is 700 viewport-heights from the moment it enters the
// screen to the end. The first 100 bring it up under the hero; then each
// chapter holds for 80 and hands over to the next in 40.
export const UNITS = 700;
export const ENTRY = 100;
export const CHAPTER = 120;
export const HOLD = 80;
export const chapterStart = (i: number) => ENTRY + CHAPTER * i;
/** Which chapter's words are showing at a given unit (-1 = none yet). */
export function chapterAt(units: number) {
  if (units < ENTRY - 30) return -1;
  for (let i = 0; i < CHAPTERS.length - 1; i++) if (units < chapterStart(i) + HOLD + 20) return i;
  return CHAPTERS.length - 1;
}
