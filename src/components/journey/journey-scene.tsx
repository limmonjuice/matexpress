"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { CARGO_STACKS, HEADLAMPS, Truck, WHEEL_RADIUS, headlampMaterial } from "../hero/truck-model";
import { HERO_CAMERA, TRUCK_YAW, rig } from "./rig";
import { SELLERS, labelEls } from "./labels";

// The hero camera matches the photo: horizon 85% down the photo, a 65 degree
// lens. Past the hero the camera rig in rig.ts takes over, blended in by rig.photo.
const PHOTO = { fov: 65, horizon: 0.851 };
const NEAR = 0.1;
const FAR = 400;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = THREE.MathUtils.lerp;
const wrap = (v: number, min: number, max: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};
/** Staggered 0..1 for item i of a group driven by one 0..1 value. */
const stagger = (v: number, i: number, step: number, span: number) => clamp01((v - i * step) / span);
/** Overshoots a little before settling, for things that pop into place. */
const backOut = (t: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

const UP = new THREE.Vector3(0, 1, 0);

const projected = new THREE.Vector3();
/** Moves an overlay label to where a world point lands on screen. */
function placeLabel(
  el: HTMLElement | null,
  world: THREE.Vector3,
  camera: THREE.Camera,
  size: { width: number; height: number },
  opacity: number,
  lift = 0,
) {
  if (!el) return;
  projected.copy(world).project(camera);
  const onScreen = projected.z < 1 && opacity > 0.001;
  el.style.opacity = onScreen ? String(opacity) : "0";
  if (!onScreen) return;
  const x = ((projected.x + 1) / 2) * size.width;
  const y = ((1 - projected.y) / 2) * size.height;
  el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) translateY(${lift}px)`;
}

// ---------------------------------------------------------------------------
// Camera rig
// ---------------------------------------------------------------------------

function CameraRig() {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const fog = useRef<THREE.Fog>(null);
  const gl = useThree((s) => s.gl);
  const work = useRef({
    eye: new THREE.Vector3(),
    target: new THREE.Vector3(),
    m: new THREE.Matrix4(),
    qRig: new THREE.Quaternion(),
    qPhoto: new THREE.Quaternion(),
    photoEye: new THREE.Vector3(...HERO_CAMERA),
    heroStage: null as HTMLElement | null,
    story: null as HTMLElement | null,
    layer: null as HTMLElement | null,
  });

  useLayoutEffect(() => {
    const w = work.current;
    w.heroStage = document.querySelector(".hx-stage");
    w.story = document.querySelector(".story");
    w.layer = gl.domElement.closest(".truck-stage");
  }, [gl]);

  useFrame((state) => {
    const cam = camera.current;
    if (!cam) return;
    const w = work.current;
    const vw = state.size.width;
    const vh = state.size.height;
    const tall = vw / vh < 0.9;

    // The free rig: orbit the target, framed off-centre for the words. Narrow
    // screens pull back so the truck still fits across them.
    const reach = tall ? Math.max(1, (1.6 / (vw / vh)) * 0.8) : 1;
    const r = rig.r * reach;
    const ce = Math.cos(rig.el);
    w.target.set(rig.tx, rig.ty, rig.tz);
    w.eye.set(rig.tx + Math.sin(rig.az) * ce * r, rig.ty + Math.sin(rig.el) * r, rig.tz + Math.cos(rig.az) * ce * r);
    w.m.lookAt(w.eye, w.target, UP);
    w.qRig.setFromRotationMatrix(w.m);
    const rigF = vh / 2 / Math.tan(THREE.MathUtils.degToRad(rig.fov / 2));
    const fx = tall ? 0.5 : rig.fx;
    const fy = tall ? (rig.el > 1 ? 0.36 : 0.33) : rig.fy;

    // The photo camera: off-centre lens pinned to the hero photo as it scrolls.
    const st = w.heroStage?.getBoundingClientRect();
    const photo = st
      ? {
          px: st.x + st.width / 2,
          py: st.y + PHOTO.horizon * st.height,
          f: (PHOTO.horizon * st.height) / Math.tan(THREE.MathUtils.degToRad(PHOTO.fov / 2)),
        }
      : { px: vw / 2, py: vh / 2, f: rigF };

    const k = smooth(clamp01(rig.photo));
    cam.position.lerpVectors(w.eye, w.photoEye, k);
    cam.quaternion.slerpQuaternions(w.qRig, w.qPhoto, k);
    const px = lerp(vw * fx, photo.px, k);
    const py = lerp(vh * fy, photo.py, k);
    const f = lerp(rigF, photo.f, k);
    cam.projectionMatrix.makePerspective((-px / f) * NEAR, ((vw - px) / f) * NEAR, (py / f) * NEAR, (-(vh - py) / f) * NEAR, NEAR, FAR);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    cam.updateMatrixWorld();

    // Fog takes the stage colour, so the ground melts into it.
    if (fog.current) {
      fog.current.color.set(rig.bg);
      fog.current.near = rig.fogNear * reach;
      fog.current.far = rig.fogFar * reach;
    }

    // Once the story's pinned stage lets go, carry the 3D layer up with it.
    if (w.layer && w.story) {
      const bottom = w.story.getBoundingClientRect().bottom;
      w.layer.style.transform = `translate3d(0, ${Math.min(0, bottom - vh)}px, 0)`;
    }
  });

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault manual near={NEAR} far={FAR} />
      <fog ref={fog} attach="fog" args={[rig.bg, rig.fogNear, rig.fogFar]} />
    </>
  );
}

// ---------------------------------------------------------------------------
// The truck: load that comes apart, headlamps, wheels, chips
// ---------------------------------------------------------------------------

/** Where each stack floats to (truck-local), and how it turns, when the load comes apart. */
const SPREAD = [
  { offset: [1.2, 2.4, 0.3], turn: [0, 0.3, 0.04] },
  { offset: [0.2, 1.45, 0.6], turn: [0, -0.22, 0] },
  { offset: [-0.6, 2.3, -0.2], turn: [0, 0.18, -0.04] },
  { offset: [-1.6, 1.0, 0.4], turn: [0, 0, 0.2] },
] as const;

const beamMaterial = new THREE.MeshBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  fog: false,
});

/** A soft cone of light ahead of a headlamp: bright at the glass, gone 10 m out. */
function Beam({ position }: { position: readonly [number, number, number] }) {
  const geometry = useMemo(() => {
    const g = new THREE.ConeGeometry(1.7, 10, 32, 8, true);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + 5) / 10; // 0 at the far end, 1 at the lamp
      const v = Math.pow(t, 2.2);
      colors.set([v, v * 0.92, v * 0.78], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  return (
    <mesh
      geometry={geometry}
      material={beamMaterial}
      position={[position[0] + 5, position[1] - 0.25, position[2]]}
      rotation={[0, 0, Math.PI / 2 + 0.05]}
    />
  );
}

function TruckActor() {
  const body = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group>(null);
  const spots = useRef<(THREE.SpotLight | null)[]>([]);
  const spotTargets = useRef<(THREE.Object3D | null)[]>([]);
  const state = useRef({ stacks: [] as THREE.Object3D[], lastRoad: 0, speed: 0, at: new THREE.Vector3() });

  useLayoutEffect(() => {
    const truck = body.current!;
    state.current.stacks = CARGO_STACKS.map((s) => truck.getObjectByName(s.name)).filter(
      (o): o is THREE.Object3D => Boolean(o),
    );
    spots.current.forEach((spot, i) => {
      const target = spotTargets.current[i];
      if (spot && target) spot.target = target;
    });
  }, []);

  useFrame((frame, dt) => {
    const truck = body.current;
    if (!truck) return;
    const st = state.current;
    const t = frame.clock.elapsedTime;
    truck.updateMatrixWorld();

    // The load: each stack lifts in turn, then bobs gently while apart.
    st.stacks.forEach((stack, i) => {
      const p = smooth(stagger(rig.explode, i, 0.1, 0.7));
      const { offset, turn } = SPREAD[i];
      const bob = Math.sin(t * 1.4 + i * 1.3) * 0.06 * p;
      stack.position.set(offset[0] * p, offset[1] * p + bob, offset[2] * p);
      stack.rotation.set(turn[0] * p, turn[1] * p + Math.sin(t * 0.7 + i) * 0.03 * p, turn[2] * p);
      const top = CARGO_STACKS[i].top;
      st.at.set(top[0] + offset[0] * p, top[1] + offset[1] * p + bob + 0.55, top[2] + offset[2] * p);
      const show = clamp01((p - 0.6) / 0.4);
      placeLabel(labelEls.tags[i], truck.localToWorld(st.at), frame.camera, frame.size, show, (1 - show) * 12);
    });
    placeLabel(labelEls.summary, truck.localToWorld(st.at.set(-0.6, 3.75, 0)), frame.camera, frame.size, rig.summary);
    placeLabel(labelEls.eta, truck.localToWorld(st.at.set(2.4, 3.35, 0)), frame.camera, frame.size, rig.eta);

    // Wheels turn with the road; the body rides a little with speed.
    const d = rig.road - st.lastRoad;
    st.lastRoad = rig.road;
    st.speed = lerp(st.speed, Math.abs(d) / Math.max(dt, 1e-3), 0.1);
    const ride = Math.min(1, st.speed / 8);
    wheels.current?.children.forEach((w) => (w.rotation.z -= d / WHEEL_RADIUS));
    truck.position.y = Math.sin(t * 17) * 0.012 * ride;
    truck.rotation.z = Math.sin(t * 9 + 1) * 0.004 * ride;

    // Headlamps.
    headlampMaterial.emissiveIntensity = 0.6 + rig.lights * 4;
    beamMaterial.opacity = rig.lights * 0.18 * clamp01(1 - rig.el);
    spots.current.forEach((spot) => {
      if (spot) spot.intensity = rig.lights * 320;
    });
  });

  return (
    <Truck body={body} wheels={wheels} rotation={[0, TRUCK_YAW, 0]}>
      {HEADLAMPS.map((lamp, i) => (
        <group key={i}>
          <spotLight
            ref={(el) => {
              spots.current[i] = el;
            }}
            position={lamp}
            intensity={0}
            distance={45}
            decay={2}
            angle={0.42}
            penumbra={0.7}
            color="#ffe6bd"
          />
          <object3D
            ref={(el) => {
              spotTargets.current[i] = el;
            }}
            position={[lamp[0] + 14, 0.1, lamp[2] * 2]}
          />
          <Beam position={lamp} />
        </group>
      ))}

    </Truck>
  );
}

// ---------------------------------------------------------------------------
// The road at blue hour: asphalt, markings, lamps, posts and far buildings
// ---------------------------------------------------------------------------

const ROAD_LENGTH = 260;
const asphalt = new THREE.MeshStandardMaterial({ color: "#2a2e34", roughness: 0.92, transparent: true, opacity: 0 });
const marking = new THREE.MeshStandardMaterial({
  color: "#ece6d8",
  roughness: 0.6,
  emissive: "#ece6d8",
  emissiveIntensity: 0.15,
  transparent: true,
  opacity: 0,
});
const poleMat = new THREE.MeshStandardMaterial({ color: "#5a6170", roughness: 0.6, metalness: 0.4, transparent: true, opacity: 0 });
const lampHeadMat = new THREE.MeshStandardMaterial({ color: "#fff1d6", emissive: "#ffcf87", emissiveIntensity: 0, transparent: true, opacity: 0 });
const buildingMat = new THREE.MeshStandardMaterial({ color: "#232b3a", roughness: 0.95, transparent: true, opacity: 0 });
const ROAD_MATERIALS = [asphalt, marking, poleMat, lampHeadMat, buildingMat];

const DASHES = 30;
const LAMPS = 12;

function RoadWorld() {
  const group = useRef<THREE.Group>(null);
  const dashes = useRef<THREE.InstancedMesh>(null);
  const poles = useRef<THREE.InstancedMesh>(null);
  const arms = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const buildings = useRef<THREE.InstancedMesh>(null);

  const geo = useMemo(
    () => ({ box: new THREE.BoxGeometry(1, 1, 1), pole: new THREE.CylinderGeometry(0.09, 0.12, 1, 10) }),
    [],
  );
  // Far buildings with fixed sizes, so they read as a skyline rather than noise.
  const blocks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        w: 14 + ((i * 37) % 11),
        h: 5 + ((i * 53) % 8),
        d: 8 + ((i * 29) % 7),
        z: -16 - ((i * 31) % 14),
      })),
    [],
  );
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3() }),
    [],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const vis = rig.roadVis;
    g.visible = vis > 0.005;
    ROAD_MATERIALS.forEach((mat) => (mat.opacity = vis));
    lampHeadMat.emissiveIntensity = 2.4 * rig.dusk;
    if (!g.visible) return;

    const half = ROAD_LENGTH / 2;
    const run = (mesh: THREE.InstancedMesh | null, n: number, spacing: number, fn: (mesh: THREE.InstancedMesh, x: number, i: number) => void) => {
      if (!mesh) return;
      for (let i = 0; i < n; i++) fn(mesh, wrap(i * spacing - rig.road, -half, half), i);
      mesh.instanceMatrix.needsUpdate = true;
    };
    const put = (mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      tmp.m.compose(tmp.v.set(x, y, z), tmp.q, tmp.s.set(sx, sy, sz));
      mesh.setMatrixAt(i, tmp.m);
    };

    run(dashes.current, DASHES, 9, (m, x, i) => put(m, i, x, 0.012, 2.25, 3, 0.02, 0.16));
    run(poles.current, LAMPS, 22, (m, x, i) => put(m, i, x, 3.5, -4.4, 1, 7, 1));
    run(arms.current, LAMPS, 22, (m, x, i) => put(m, i, x, 6.95, -3.6, 0.12, 0.12, 1.7));
    run(heads.current, LAMPS, 22, (m, x, i) => put(m, i, x, 6.85, -2.8, 0.7, 0.14, 0.32));
    run(buildings.current, blocks.length, 34, (m, x, i) => {
      const b = blocks[i];
      put(m, i, x, b.h / 2, b.z, b.w, b.h, b.d);
    });
  });

  return (
    <group ref={group} rotation={[0, TRUCK_YAW, 0]}>
      {/* Two lanes; the truck drives the right-hand one */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 2.25]} material={asphalt} receiveShadow>
        <planeGeometry args={[ROAD_LENGTH, 9]} />
      </mesh>
      {[-2.1, 6.6].map((z) => (
        <mesh key={z} position={[0, 0.006, z]} material={marking} geometry={geo.box} scale={[ROAD_LENGTH, 0.01, 0.12]} />
      ))}
      <instancedMesh ref={dashes} args={[geo.box, marking, DASHES]} />
      <instancedMesh ref={poles} args={[geo.pole, poleMat, LAMPS]} />
      <instancedMesh ref={arms} args={[geo.box, poleMat, LAMPS]} />
      <instancedMesh ref={heads} args={[geo.box, lampHeadMat, LAMPS]} />
      <instancedMesh ref={buildings} args={[geo.box, buildingMat, blocks.length]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// The night map: sellers around the truck, routes drawing in
// ---------------------------------------------------------------------------

const routeMat = new THREE.MeshBasicMaterial({ color: "#ff9a4d", transparent: true, opacity: 0, fog: false });
const pinMat = new THREE.MeshStandardMaterial({ color: "#ffb26b", emissive: "#ff7a1a", emissiveIntensity: 1.2, transparent: true, opacity: 0 });
const streetMat = new THREE.MeshBasicMaterial({ color: "#2a3549", transparent: true, opacity: 0 });
const TUBE_SEGMENTS = 64;
const TUBE_SIDES = 6;

function MapWorld() {
  const group = useRef<THREE.Group>(null);
  const pins = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const at = useRef(new THREE.Vector3());

  const routes = useMemo(
    () =>
      SELLERS.map((s, i) => {
        const start = new THREE.Vector3(s.x, 0.06, s.z);
        const end = new THREE.Vector3(0, 0.06, 0);
        const mid = start.clone().lerp(end, 0.5);
        const side = new THREE.Vector3(-(end.z - start.z), 0, end.x - start.x).normalize();
        mid.addScaledVector(side, (i % 2 ? 1 : -1) * start.length() * 0.22);
        return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start, mid, end), TUBE_SEGMENTS, 0.075, TUBE_SIDES);
      }),
    [],
  );
  const ringMats = useMemo(
    () =>
      SELLERS.map(
        () => new THREE.MeshBasicMaterial({ color: "#ff9a4d", transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false }),
      ),
    [],
  );
  const streets = [
    { x: -6, z: 2, len: 70, rot: 0.35 },
    { x: 4, z: -5, len: 70, rot: -0.9 },
    { x: 0, z: 9, len: 60, rot: 1.6 },
    { x: -9, z: -10, len: 50, rot: 2.3 },
    { x: 9, z: 4, len: 50, rot: 0.1 },
  ];
  const geo = useMemo(
    () => ({
      head: new THREE.SphereGeometry(0.55, 24, 16),
      stem: new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8),
      ring: new THREE.RingGeometry(0.7, 0.86, 48),
      box: new THREE.BoxGeometry(1, 1, 1),
    }),
    [],
  );

  useFrame((frame) => {
    const g = group.current;
    if (!g) return;
    g.visible = rig.mapVis > 0.005;
    if (!g.visible) {
      labelEls.pins.forEach((el) => el && (el.style.opacity = "0"));
      return;
    }
    const t = frame.clock.elapsedTime;
    streetMat.opacity = rig.mapVis * 0.85;
    pinMat.opacity = rig.mapVis;
    routeMat.opacity = rig.mapVis;

    SELLERS.forEach((_, i) => {
      const pop = stagger(rig.mapVis, i, 0.1, 0.5);
      pins.current[i]?.scale.setScalar(Math.max(0.0001, pop > 0 ? backOut(pop) : 0));
      const ring = rings.current[i];
      if (ring) {
        const k = (t * 0.6 + i * 0.37) % 1;
        ring.scale.setScalar(1 + k * 2.2);
        ringMats[i].opacity = (1 - k) * 0.8 * rig.mapVis;
      }
      const draw = stagger(rig.mapDraw, i, 0.08, 0.55);
      routes[i].setDrawRange(0, Math.floor(draw * TUBE_SEGMENTS) * TUBE_SIDES * 6);
      at.current.set(SELLERS[i].x, 3.3, SELLERS[i].z);
      placeLabel(labelEls.pins[i], at.current, frame.camera, frame.size, clamp01((pop - 0.5) * 2));
    });
  });

  return (
    <group ref={group}>
      {streets.map((s, i) => (
        <mesh key={i} geometry={geo.box} material={streetMat} position={[s.x, 0.004, s.z]} rotation={[0, s.rot, 0]} scale={[s.len, 0.01, 0.5]} />
      ))}
      {routes.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={routeMat} />
      ))}
      {SELLERS.map((s, i) => (
        <group key={s.name} position={[s.x, 0, s.z]}>
          <mesh
            ref={(el) => {
              rings.current[i] = el;
            }}
            geometry={geo.ring}
            material={ringMats[i]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.03, 0]}
          />
          <group
            ref={(el) => {
              pins.current[i] = el;
            }}
          >
            <mesh geometry={geo.stem} material={pinMat} position={[0, 0.8, 0]} />
            <mesh geometry={geo.head} material={pinMat} position={[0, 1.9, 0]} />
          </group>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Light: golden hour to blue hour
// ---------------------------------------------------------------------------

const GOLD = { sun: new THREE.Color("#ffd2a1"), sky: new THREE.Color("#cfe0f0"), ground: new THREE.Color("#8b7b6a") };
const BLUE = { sun: new THREE.Color("#7f95c9"), sky: new THREE.Color("#2a3550"), ground: new THREE.Color("#141820") };

function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const target = useRef<THREE.Object3D>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);

  useLayoutEffect(() => {
    sun.current!.target = target.current!;
  }, []);

  useFrame((state) => {
    const k = rig.dusk;
    const photo = smooth(clamp01(rig.photo));
    if (sun.current) {
      sun.current.position.set(16, lerp(15, 5, photo), lerp(-3, -5, photo));
      sun.current.intensity = lerp(3.2, 0.25, k);
      sun.current.color.lerpColors(GOLD.sun, BLUE.sun, k);
    }
    if (hemi.current) {
      hemi.current.intensity = lerp(0.9, 0.45, k);
      hemi.current.color.lerpColors(GOLD.sky, BLUE.sky, k);
      hemi.current.groundColor.lerpColors(GOLD.ground, BLUE.ground, k);
    }
    if (fill.current) fill.current.intensity = lerp(0.9, 0.2, k);
    state.scene.environmentIntensity = lerp(1, 0.25, k);
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#cfe0f0", "#8b7b6a", 0.9]} />
      <ambientLight intensity={0.15} color="#ffe2c4" />
      {/* Soft fill from the camera side, so the near flank is not lost in shade */}
      <directionalLight ref={fill} position={[-4, 3, 6]} intensity={0.9} color="#fff1e2" />
      {/* Low sun from the right, behind the truck, as in the hero photo */}
      <object3D ref={target} position={[0, 0, 0]} />
      <directionalLight
        ref={sun}
        position={[16, 5, -5]}
        intensity={3.2}
        color="#ffd2a1"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffcf98" position={[12, 2, -4]} rotation={[0, -Math.PI / 2, 0]} scale={[14, 5, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#cfe0f2" position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[30, 30, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#a89a8a" position={[0, -2, 8]} rotation={[0, Math.PI, 0]} scale={[30, 6, 1]} />
      </Environment>
    </>
  );
}

// ---------------------------------------------------------------------------
// The floor: invisible over the hero photo, then ground that melts into the stage colour
// ---------------------------------------------------------------------------

const floorMat = new THREE.MeshBasicMaterial({ color: "#e4ddd3", transparent: true, opacity: 0, depthWrite: false });
const shadowMat = new THREE.ShadowMaterial({ color: "#3a2a1c", transparent: true, opacity: 0.38 });

function StageFloor() {
  useFrame(() => {
    const photo = smooth(clamp01(rig.photo));
    floorMat.color.set(rig.bg).multiplyScalar(0.94);
    floorMat.opacity = 1 - photo;
    shadowMat.opacity = lerp(0.24, 0.38, photo);
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} material={floorMat} renderOrder={-1}>
        <circleGeometry args={[200, 64]} />
      </mesh>
      {/* The truck's shadow: on the hero photo's yard, then on the stage floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} material={shadowMat} receiveShadow>
        <planeGeometry args={[60, 60]} />
      </mesh>
    </>
  );
}

/** Compiles every shader once at load, while everything is still in the scene graph. */
function Precompile() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    gl.compileAsync(scene, camera).catch(() => gl.compile(scene, camera));
  }, [gl, scene, camera]);
  return null;
}

export default function JourneyScene() {
  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
      <CameraRig />
      <Lighting />
      <TruckActor />
      <RoadWorld />
      <MapWorld />
      <StageFloor />
      <Precompile />
      <ContactShadows
        position={[0, 0.002, 0]}
        rotation={[0, TRUCK_YAW, 0]}
        scale={[9, 4]}
        far={1.2}
        blur={2.2}
        opacity={0.75}
        resolution={512}
        color="#1d150e"
      />
    </Canvas>
  );
}
