"use client";

import { useLayoutEffect, useMemo, useRef, type Ref } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// A loaded cab-over flatbed, built from primitives. Units are metres; the
// origin sits on the ground under the middle of the truck and the cab faces +x.

const paint = new THREE.MeshPhysicalMaterial({ color: "#f3f2ee", roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
// Low specular: the low sun would otherwise glare off the flat windscreen.
const glass = new THREE.MeshPhysicalMaterial({ color: "#0f161c", roughness: 0.18, metalness: 0, specularIntensity: 0.12, envMapIntensity: 0.25 });
const blackTrim = new THREE.MeshStandardMaterial({ color: "#141517", roughness: 0.82 });
const chassisMat = new THREE.MeshStandardMaterial({ color: "#151516", roughness: 0.7 });
const rubber = new THREE.MeshStandardMaterial({ color: "#161616", roughness: 0.92 });
const chrome = new THREE.MeshStandardMaterial({ color: "#d9dcdf", roughness: 0.18, metalness: 1 });
const rimMat = new THREE.MeshStandardMaterial({ color: "#e4e6e8", roughness: 0.32, metalness: 0.35 });
const tankMat = new THREE.MeshStandardMaterial({ color: "#1d1f22", roughness: 0.85, metalness: 0 });
const lampMat = new THREE.MeshStandardMaterial({ color: "#fff4dc", emissive: "#ffe9c4", emissiveIntensity: 0.6, roughness: 0.1 });
const amberMat = new THREE.MeshStandardMaterial({ color: "#f29d1f", emissive: "#f08a00", emissiveIntensity: 0.3 });
const strapMat = new THREE.MeshStandardMaterial({ color: "#f2b31b", roughness: 0.6 });
const postMat = new THREE.MeshStandardMaterial({ color: "#efb21d", roughness: 0.45, metalness: 0.2 });
const plateMat = new THREE.MeshStandardMaterial({ color: "#f7f7f2", roughness: 0.5 });
const pipeMat = new THREE.MeshStandardMaterial({ color: "#a7adb2", roughness: 0.38, metalness: 0.55, side: THREE.DoubleSide });
const darkPipeMat = new THREE.MeshStandardMaterial({ color: "#4b5157", roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide });
const woodMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.82 });
const bagMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95 });

const CAB_X0 = 1.55;
const CAB_X1 = 3.3;
const DECK_X0 = -3.35;
const DECK_X1 = 1.4;
const DECK_TOP = 1.08;
const HALF_W = 1.1;

type Part = { p: [number, number, number]; r?: [number, number, number]; s?: [number, number, number]; c?: string };

/** One draw call for many copies of the same part. */
function Parts({ geometry, material, parts }: { geometry: THREE.BufferGeometry; material: THREE.Material; parts: Part[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const color = new THREE.Color();
    parts.forEach((part, i) => {
      q.setFromEuler(new THREE.Euler(...(part.r ?? [0, 0, 0])));
      m.compose(new THREE.Vector3(...part.p), q, new THREE.Vector3(...(part.s ?? [1, 1, 1])));
      mesh.setMatrixAt(i, m);
      if (part.c) mesh.setColorAt(i, color.set(part.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [parts]);
  return <instancedMesh ref={ref} args={[geometry, material, parts.length]} castShadow receiveShadow />;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function Cab() {
  const sideZ = 1.0;
  return (
    <group>
      {/* Body above the wheel arch, and the panels in front of and behind it */}
      <RoundedBox args={[CAB_X1 - CAB_X0, 1.6, 2.0]} radius={0.12} smoothness={4} position={[(CAB_X0 + CAB_X1) / 2, 1.8, 0]} material={paint} castShadow receiveShadow />
      <RoundedBox args={[0.46, 0.55, 2.0]} radius={0.06} position={[CAB_X1 - 0.23, 0.78, 0]} material={paint} castShadow />
      <mesh position={[CAB_X0 + 0.16, 0.8, 0]} material={paint} castShadow>
        <boxGeometry args={[0.32, 0.5, 1.98]} />
      </mesh>

      {/* Windscreen and side windows */}
      <mesh position={[CAB_X1 + 0.005, 2.0, 0]} material={glass}>
        <boxGeometry args={[0.02, 0.78, 1.82]} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[2.62, 2.0, side * (sideZ + 0.003)]} material={glass}>
            <boxGeometry args={[0.92, 0.7, 0.02]} />
          </mesh>
          {/* Black strip at the front corner, mirror arm and mirror */}
          <mesh position={[3.19, 1.72, side * (sideZ + 0.006)]} material={blackTrim}>
            <boxGeometry args={[0.13, 1.36, 0.012]} />
          </mesh>
          <mesh position={[3.33, 2.16, side * 1.13]} rotation={[side * 0.5, 0, 0]} material={blackTrim}>
            <boxGeometry args={[0.05, 0.05, 0.32]} />
          </mesh>
          <RoundedBox args={[0.08, 0.46, 0.2]} radius={0.03} position={[3.36, 1.94, side * 1.28]} material={blackTrim} castShadow />
          {/* Door handle, steps and the arch trim over the front wheel */}
          <mesh position={[2.3, 1.36, side * (sideZ + 0.01)]} material={blackTrim}>
            <boxGeometry args={[0.18, 0.04, 0.02]} />
          </mesh>
          <mesh position={[1.86, 0.62, side * 0.97]} material={blackTrim} castShadow>
            <boxGeometry args={[0.42, 0.06, 0.16]} />
          </mesh>
          <mesh position={[2.36, 1.01, side * 0.99]} material={blackTrim}>
            <boxGeometry args={[1.02, 0.05, 0.06]} />
          </mesh>
          <mesh position={[3.27, 1.12, side * 1.0]} material={amberMat}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
          </mesh>
        </group>
      ))}

      {/* Grille band, badge, headlamps, bumper and plate */}
      <mesh position={[CAB_X1 + 0.012, 1.17, 0]} material={blackTrim}>
        <boxGeometry args={[0.03, 0.3, 1.36]} />
      </mesh>
      <mesh position={[CAB_X1 + 0.03, 1.17, 0]} rotation={[0, 0, Math.PI / 2]} material={chrome}>
        <cylinderGeometry args={[0.075, 0.075, 0.02, 24]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[CAB_X1 + 0.012, 1.17, side * 0.84]} material={lampMat}>
          <boxGeometry args={[0.03, 0.24, 0.3]} />
        </mesh>
      ))}
      <RoundedBox args={[0.18, 0.32, 2.06]} radius={0.04} position={[CAB_X1 + 0.04, 0.62, 0]} material={blackTrim} castShadow />
      <mesh position={[CAB_X1 + 0.135, 0.62, 0]} material={plateMat}>
        <boxGeometry args={[0.01, 0.13, 0.4]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[CAB_X1 + 0.135, 0.62, side * 0.78]} material={lampMat}>
          <boxGeometry args={[0.01, 0.08, 0.16]} />
        </mesh>
      ))}
    </group>
  );
}

function Chassis() {
  return (
    <group>
      {[0.45, -0.45].map((z) => (
        <mesh key={z} position={[-0.2, 0.74, z]} material={chassisMat} castShadow>
          <boxGeometry args={[6.2, 0.24, 0.12]} />
        </mesh>
      ))}
      {/* Fuel tank on the near side, between cab and bed */}
      <mesh position={[0.75, 0.62, 0.72]} rotation={[0, 0, Math.PI / 2]} material={tankMat} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 28]} />
      </mesh>
      {/* Underbed and mudguards over the rear axles */}
      <mesh position={[(DECK_X0 + DECK_X1) / 2, 0.91, 0]} material={chassisMat} castShadow>
        <boxGeometry args={[DECK_X1 - DECK_X0, 0.1, 2.0]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[-1.3, 0.88, side * 0.78]} material={chassisMat} castShadow>
          <boxGeometry args={[2.2, 0.05, 0.62]} />
        </mesh>
      ))}
    </group>
  );
}

function Bed() {
  const posts = [-2.95, -1.85, -0.75, 0.35];
  return (
    <group>
      <mesh position={[(DECK_X0 + DECK_X1) / 2, DECK_TOP - 0.06, 0]} material={chassisMat} receiveShadow castShadow>
        <boxGeometry args={[DECK_X1 - DECK_X0, 0.12, HALF_W * 2]} />
      </mesh>
      {/* Drop sides, tailgate and their yellow posts */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[(DECK_X0 + DECK_X1) / 2, DECK_TOP + 0.21, side * (HALF_W - 0.025)]} material={paint} castShadow receiveShadow>
            <boxGeometry args={[DECK_X1 - DECK_X0, 0.42, 0.05]} />
          </mesh>
          {posts.map((x) => (
            <mesh key={x} position={[x, DECK_TOP + 0.2, side * (HALF_W + 0.012)]} material={postMat} castShadow>
              <boxGeometry args={[0.07, 0.5, 0.04]} />
            </mesh>
          ))}
          <mesh position={[(DECK_X0 + DECK_X1) / 2, DECK_TOP + 0.43, side * (HALF_W - 0.02)]} material={chassisMat}>
            <boxGeometry args={[DECK_X1 - DECK_X0, 0.025, 0.06]} />
          </mesh>
        </group>
      ))}
      <mesh position={[DECK_X0 + 0.025, DECK_TOP + 0.21, 0]} material={paint} castShadow>
        <boxGeometry args={[0.05, 0.42, HALF_W * 2]} />
      </mesh>
      {/* Headboard rack behind the cab */}
      {[0.95, -0.95].map((z) => (
        <mesh key={z} position={[DECK_X1 + 0.03, 1.85, z]} material={paint} castShadow>
          <boxGeometry args={[0.08, 1.55, 0.08]} />
        </mesh>
      ))}
      {[1.5, 2.0, 2.55].map((y) => (
        <mesh key={y} position={[DECK_X1 + 0.03, y, 0]} material={paint} castShadow>
          <boxGeometry args={[0.07, 0.07, 1.98]} />
        </mesh>
      ))}
    </group>
  );
}

function Load() {
  const pipeGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 18, 1, true), []);
  const boardGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bagGeo = useMemo(() => new RoundedBoxGeometry(0.5, 0.22, 0.46, 3, 0.08), []);

  const { pipes, darkPipes, boards, bags } = useMemo(() => {
    const r = rng(9);
    const pipes: Part[] = [];
    // Conduit pipes against the headboard, ends facing the sides
    for (let layer = 0; layer < 7; layer++)
      for (let col = 0; col < 4; col++) {
        const rad = 0.105;
        pipes.push({
          p: [0.56 + col * 0.205 + (layer % 2) * 0.05, DECK_TOP + rad + layer * 0.2, 0],
          r: [Math.PI / 2, 0, 0],
          s: [rad, 2.08, rad],
        });
      }
    const darkPipes: Part[] = [];
    for (let layer = 0; layer < 4; layer++)
      for (let col = 0; col < 2; col++)
        darkPipes.push({ p: [-3.18 + col * 0.18, DECK_TOP + 0.085 + layer * 0.16, 0], r: [Math.PI / 2, 0, 0], s: [0.085, 2.06, 0.085] });

    // Lumber: boards run along the bed
    const boards: Part[] = [];
    const woods = ["#d6ae78", "#cfa26b", "#ddb784", "#c99a60", "#d9b37d"];
    for (let layer = 0; layer < 12; layer++)
      for (let k = 0; k < 7; k++)
        boards.push({
          p: [-0.16, DECK_TOP + 0.055 + layer * 0.112, -0.84 + k * 0.28],
          s: [1.18 + (r() - 0.5) * 0.04, 0.1, 0.26],
          c: woods[Math.floor(r() * woods.length)],
        });

    // Cement bags, stacked four high
    const bags: Part[] = [];
    const bagTones = ["#ece4d6", "#e6dccb", "#f0e9dd", "#e2d7c4"];
    for (let layer = 0; layer < 6; layer++)
      for (let cx = 0; cx < 4; cx++)
        for (let cz = 0; cz < 4; cz++)
          bags.push({
            p: [-2.62 + cx * 0.52 + (r() - 0.5) * 0.03, DECK_TOP + 0.115 + layer * 0.215, -0.75 + cz * 0.5 + (r() - 0.5) * 0.03],
            r: [(r() - 0.5) * 0.05, (r() - 0.5) * 0.12, (r() - 0.5) * 0.05],
            c: bagTones[Math.floor(r() * bagTones.length)],
          });
    return { pipes, darkPipes, boards, bags };
  }, []);

  // Each stack is its own named group, so the load can come apart by supplier.
  return (
    <group>
      <group name={CARGO_STACKS[0].name}>
        <Parts geometry={pipeGeo} material={pipeMat} parts={pipes} />
      </group>
      <group name={CARGO_STACKS[1].name}>
        <Parts geometry={boardGeo} material={woodMat} parts={boards} />
        <Strap x={-0.5} top={DECK_TOP + 1.35} />
        <Strap x={0.2} top={DECK_TOP + 1.35} />
      </group>
      <group name={CARGO_STACKS[2].name}>
        <Parts geometry={bagGeo} material={bagMat} parts={bags} />
        <Strap x={-2.35} top={DECK_TOP + 1.31} />
        <Strap x={-1.3} top={DECK_TOP + 1.31} />
      </group>
      <group name={CARGO_STACKS[3].name}>
        <Parts geometry={pipeGeo} material={darkPipeMat} parts={darkPipes} />
      </group>
    </group>
  );
}

/** A lashing strap over a stack, down both sides to the deck. */
function Strap({ x, top }: { x: number; top: number }) {
  return (
    <group>
      <mesh position={[x, top + 0.01, 0]} material={strapMat}>
        <boxGeometry args={[0.05, 0.012, 2.04]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[x, (top + DECK_TOP) / 2, side * 1.02]} material={strapMat}>
          <boxGeometry args={[0.05, top - DECK_TOP, 0.012]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The four stacks on the bed, front to back, with the point just above each
 * (truck-local metres) where a label can sit.
 */
export const CARGO_STACKS = [
  { name: "cargo-pipes", top: [0.95, 2.55, 0] },
  { name: "cargo-lumber", top: [-0.16, 2.5, 0] },
  { name: "cargo-bags", top: [-1.84, 2.45, 0] },
  { name: "cargo-rebar", top: [-3.1, 1.8, 0] },
] as const;

function Wheel({ position, inner = false }: { position: [number, number, number]; inner?: boolean }) {
  const outward = Math.sign(position[2]) || 1;
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={rubber} castShadow receiveShadow>
        <cylinderGeometry args={[0.47, 0.47, 0.3, 40]} />
      </mesh>
      {!inner && (
        <>
          <mesh position={[0, 0, outward * 0.152]} rotation={[Math.PI / 2, 0, 0]} material={rimMat}>
            <cylinderGeometry args={[0.29, 0.29, 0.01, 36]} />
          </mesh>
          <mesh position={[0, 0, outward * 0.17]} rotation={[Math.PI / 2, 0, 0]} material={chrome}>
            <cylinderGeometry args={[0.11, 0.13, 0.05, 24]} />
          </mesh>
          {/* Wheel nuts, so the wheels are seen to turn */}
          {Array.from({ length: 6 }, (_, k) => {
            const a = (k / 6) * Math.PI * 2;
            return (
              <mesh
                key={k}
                position={[Math.cos(a) * 0.19, Math.sin(a) * 0.19, outward * 0.162]}
                rotation={[Math.PI / 2, 0, 0]}
                material={blackTrim}
              >
                <cylinderGeometry args={[0.022, 0.022, 0.03, 8]} />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}

export const WHEEL_RADIUS = 0.47;

/** The headlamp glass, so a scene can turn the lamps up after dark. */
export const headlampMaterial = lampMat;

/** Where the headlamps sit, truck-local (one per side). */
export const HEADLAMPS = [
  [CAB_X1 + 0.03, 1.17, 0.84],
  [CAB_X1 + 0.03, 1.17, -0.84],
] as const;

export type TruckHandles = {
  /** The whole truck: move and turn this to drive it. */
  body: Ref<THREE.Group>;
  /** Every wheel: spin these around z as the truck travels. */
  wheels: Ref<THREE.Group>;
};

export function Truck({ body, wheels, children, ...props }: Partial<TruckHandles> & ThreeElements["group"]) {
  const R = 0.47;
  return (
    <group ref={body} {...props}>
      {children}
      <Cab />
      <Chassis />
      <Bed />
      <Load />
      <group ref={wheels}>
        {[0.92, -0.92].map((z) => (
          <Wheel key={`f${z}`} position={[2.35, R, z]} />
        ))}
        {[-0.65, -1.95].flatMap((x) =>
          [0.92, -0.92].flatMap((z) => [
            <Wheel key={`o${x}${z}`} position={[x, R, z]} />,
            <Wheel key={`i${x}${z}`} position={[x, R, z * 0.66]} inner />,
          ]),
        )}
      </group>
    </group>
  );
}
