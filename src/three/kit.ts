/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { fbm2, rng } from './noise';
import { LAGOON_FRAG, LAGOON_VERT, PARTICLE_FRAG, PARTICLE_VERT, POOL_FRAG, POOL_VERT } from './shaders';

/**
 * Procedural "set pieces" shared by the hero scene and the island explorer.
 *
 * Everything is generated in code so the site ships with no model files, yet the
 * result stays cheap: geometry is merged per material (a handful of draw calls
 * for the whole resort) and palms are a single InstancedMesh.
 *
 * ── Swapping in real 3D assets later ────────────────────────────────────────
 * When you have a GLB of the resort, load it with GLTFLoader and add it to the
 * island group instead of calling `buildVilla()` / `buildPalms()`. The scenes
 * only rely on the group returned by `buildIsland()`, so nothing else changes.
 */

export const ISLAND_R = 10;
/** Height of the flat terrace the villa stands on. */
export const PAD_Y = 1.35;

/** Shared animated uniforms – one object so every material ticks together. */
export interface SharedUniforms {
  uTime: { value: number };
  uPR: { value: number };
}
export const createShared = (): SharedUniforms => ({ uTime: { value: 0 }, uPR: { value: 1 } });

/** Shoreline radius at angle `a`. MUST match `coast()` in shaders.ts (LAGOON_FRAG). */
export function coastRadius(a: number, R = ISLAND_R) {
  return R * (1 + 0.08 * Math.sin(3 * a + 1) + 0.05 * Math.sin(5 * a + 2) + 0.03 * Math.sin(9 * a));
}

const { smoothstep, lerp } = THREE.MathUtils;

/** Terrain height at island-local (x, z). 0 at the waterline, negative offshore. */
export function islandHeight(x: number, z: number, R = ISLAND_R): number {
  const r = Math.hypot(x, z);
  const u = r / coastRadius(Math.atan2(z, x), R);
  if (u > 1) return -(u - 1) * 3.2;
  const t = 1 - u; // 0 at the coast → 1 at the centre
  const dome = 1.75 * Math.pow(smoothstep(t, 0, 0.9), 1.1);
  const mask = 1 - smoothstep(u, 0.38, 0.62); // villa terrace
  const dunes = (fbm2(x * 0.28 + 3, z * 0.28 + 7, 3) - 0.5) * 1.1 * smoothstep(t, 0.05, 0.35) * (1 - mask);
  return lerp(dome, PAD_Y, mask) + dunes;
}

/** A point on the island at polar (θ, u = fraction of the way to the coast), lifted by `lift`. */
export function anchorAt(theta: number, u: number, lift = 0, R = ISLAND_R): THREE.Vector3 {
  const r = coastRadius(theta, R) * u;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;
  return new THREE.Vector3(x, islandHeight(x, z, R) + lift, z);
}

/* -------------------------------------------------------------------------- */
/*  Island terrain                                                             */
/* -------------------------------------------------------------------------- */

export function buildIslandGeometry(R = ISLAND_R, ringsIn = 30, ringsOut = 8, segs = 84): THREE.BufferGeometry {
  const dry = new THREE.Color('#efdcae');
  const dune = new THREE.Color('#d8bf88');
  const wet = new THREE.Color('#a68c60');
  const grass = new THREE.Color('#8f9b58');
  const c = new THREE.Color();

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const push = (x: number, z: number) => {
    const h = islandHeight(x, z, R);
    positions.push(x, h, z);
    const u = Math.hypot(x, z) / coastRadius(Math.atan2(z, x), R);
    const t = 1 - u;
    c.copy(wet).lerp(dry, smoothstep(h, 0.0, 0.3));
    c.lerp(dune, smoothstep(fbm2(x * 0.5 + 40, z * 0.5, 3), 0.45, 0.7) * 0.6);
    const g = smoothstep(fbm2(x * 0.22 + 11, z * 0.22 + 5, 3), 0.55, 0.72) * smoothstep(t, 0.28, 0.5) * smoothstep(h, 0.4, 0.8);
    c.lerp(grass, g * 0.75);
    colors.push(c.r, c.g, c.b);
  };

  push(0, 0); // centre vertex = index 0
  const total = ringsIn + ringsOut;
  for (let i = 1; i <= total; i++) {
    const u = i <= ringsIn ? i / ringsIn : 1 + ((i - ringsIn) / ringsOut) * 0.4;
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const r = coastRadius(a, R) * u;
      push(Math.cos(a) * r, Math.sin(a) * r);
    }
  }

  const ring = (i: number, j: number) => 1 + (i - 1) * segs + (j % segs);
  for (let j = 0; j < segs; j++) indices.push(0, ring(1, j + 1), ring(1, j)); // fan, wound to face up
  for (let i = 1; i < total; i++) {
    for (let j = 0; j < segs; j++) {
      const a0 = ring(i, j), a1 = ring(i, j + 1), b0 = ring(i + 1, j), b1 = ring(i + 1, j + 1);
      indices.push(a0, a1, b0, a1, b1, b0);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/* -------------------------------------------------------------------------- */
/*  Materials (created once per scene; clipped by the sea plane)               */
/* -------------------------------------------------------------------------- */

export interface Mats {
  sand: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  palm: THREE.MeshStandardMaterial;
  cloth: THREE.MeshStandardMaterial;
  thatch: THREE.MeshStandardMaterial;
}

export function createMaterials(seaClip: THREE.Plane | null): Mats {
  const clip = seaClip ? [seaClip] : [];
  const std = (color: string, roughness = 0.9, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, clippingPlanes: clip, ...extra });
  return {
    sand: std('#ffffff', 1, { vertexColors: true }),
    wall: std('#f4ede0', 0.85),
    stone: std('#d6c7a6', 0.95),
    wood: std('#8a5a3a', 0.8),
    glass: std('#6c9db2', 0.12, { metalness: 0.5, emissive: new THREE.Color('#ffb865'), emissiveIntensity: 0 }),
    palm: std('#ffffff', 0.85, { vertexColors: true, side: THREE.DoubleSide }),
    cloth: std('#f5eedf', 0.9, { side: THREE.DoubleSide }),
    thatch: std('#b98d54', 1, { side: THREE.DoubleSide }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Villa                                                                      */
/* -------------------------------------------------------------------------- */

const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
};

export interface Villa {
  group: THREE.Group;
  pool: THREE.ShaderMaterial;
  lanterns: THREE.Points;
  lanternMat: THREE.ShaderMaterial;
}

/** A modernist beach villa: stacked volumes, deep eaves, glass, an infinity pool, loungers. */
export function buildVilla(mats: Mats, shared: SharedUniforms): Villa {
  const group = new THREE.Group();
  const y0 = 0.22; // podium top

  const walls = mergeGeometries([
    box(4.6, 1.5, 3.2, -1.9, y0 + 0.75, -0.4),
    box(2.8, 1.3, 2.4, -2.7, y0 + 1.5 + 0.14 + 0.65, -0.7),
  ])!;
  const stone = mergeGeometries([
    box(9.2, 0.22, 5.6, 0, 0.11, 0),
    box(3.9, 0.2, 2.1, 2.2, 0.32, 0.9), // pool rim
    box(1.0, 0.18, 0.5, -1.9, 0.09, 2.5), // steps
  ])!;
  const wood = mergeGeometries([
    box(5.8, 0.14, 4.3, -1.9, y0 + 1.5 + 0.07, -0.1), // lower eaves
    box(3.7, 0.12, 3.2, -2.7, y0 + 1.5 + 0.14 + 1.3 + 0.06, -0.4), // upper eaves
    // columns along the front
    ...[-4.5, -3.0, -1.5, 0.0, 0.6].map((x) => box(0.14, 1.5, 0.14, x, y0 + 0.75, 1.85)),
    // loungers
    box(0.55, 0.1, 1.15, 0.9, 0.3, -1.1),
    box(0.55, 0.1, 1.15, 2.0, 0.3, -1.1),
    box(0.55, 0.1, 1.15, 3.1, 0.3, -1.1),
  ])!;
  const glass = mergeGeometries([
    box(3.9, 1.0, 0.08, -1.9, y0 + 0.8, 1.22),
    box(2.3, 0.8, 0.08, -2.7, y0 + 1.5 + 0.14 + 0.6, 0.52),
  ])!;

  const mk = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  mk(walls, mats.wall);
  mk(stone, mats.stone);
  mk(wood, mats.wood);
  mk(glass, mats.glass).castShadow = false;

  // Umbrella: pole + canopy
  const pole = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6);
  pole.translate(4.0, 0.9, -1.1);
  const canopy = new THREE.ConeGeometry(0.9, 0.35, 10, 1, true);
  canopy.translate(4.0, 1.75, -1.1);
  mk(mergeGeometries([pole, canopy])!, mats.cloth);

  // Pool water
  const pool = new THREE.ShaderMaterial({
    vertexShader: POOL_VERT,
    fragmentShader: POOL_FRAG,
    uniforms: {
      uTime: shared.uTime,
      uA: { value: new THREE.Color('#12a7b8') },
      uB: { value: new THREE.Color('#6ff0e2') },
      uGlow: { value: 0 },
    },
    clippingPlanes: mats.wall.clippingPlanes,
  });
  const poolMesh = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.02, 1.7), pool);
  poolMesh.position.set(2.2, 0.41, 0.9);
  poolMesh.receiveShadow = true;
  group.add(poolMesh);

  // Lanterns: additive glow sprites that fade in at dusk.
  const lp: number[] = [];
  const ls: number[] = [];
  [-4.5, -3.0, -1.5, 0.0, 0.6].forEach((x, i) => { lp.push(x, y0 + 1.55, 1.95); ls.push(i / 5 + 0.1); });
  [0.4, 4.0].forEach((x, i) => { lp.push(x, 0.55, 2.7); ls.push(0.7 + i * 0.1); });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  lg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ls, 1));
  const lanternMat = new THREE.ShaderMaterial({
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    uniforms: {
      uTime: shared.uTime,
      uPR: shared.uPR,
      uSize: { value: 5.5 },
      uColor: { value: new THREE.Color('#ffb25c') },
      uAlpha: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lanterns = new THREE.Points(lg, lanternMat);
  lanterns.frustumCulled = false;
  group.add(lanterns);

  return { group, pool, lanterns, lanternMat };
}

/* -------------------------------------------------------------------------- */
/*  Palms (one draw call for all of them)                                      */
/* -------------------------------------------------------------------------- */

function palmGeometry(): THREE.BufferGeometry {
  const brown = new THREE.Color('#6b4a30');
  const leafBase = new THREE.Color('#2c6a3c');
  const leafTip = new THREE.Color('#7fae4e');
  const parts: THREE.BufferGeometry[] = [];

  // Trunk: tapered cylinder bent sideways.
  const H = 3.4;
  const trunk = new THREE.CylinderGeometry(0.07, 0.16, H, 6, 8, true);
  trunk.deleteAttribute('uv');
  trunk.translate(0, H / 2, 0);
  const tp = trunk.attributes.position;
  const tc: number[] = [];
  for (let i = 0; i < tp.count; i++) {
    const k = tp.getY(i) / H;
    tp.setX(i, tp.getX(i) + k * k * 0.9);
    tc.push(brown.r * (0.8 + k * 0.3), brown.g * (0.8 + k * 0.3), brown.b * (0.8 + k * 0.3));
  }
  trunk.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
  parts.push(trunk);

  // Fronds: tapered strips that rise then droop.
  const FR = 9;
  const L = 7;
  const len = 2.2;
  const col = new THREE.Color();
  for (let f = 0; f < FR; f++) {
    const pos: number[] = [];
    const cols: number[] = [];
    const idx: number[] = [];
    for (let s = 0; s <= L; s++) {
      const u = s / L;
      const w = (0.05 + 0.3 * Math.pow(Math.sin(Math.PI * Math.min(0.98, u * 0.92 + 0.04)), 0.8)) * (1 - u * 0.25);
      const x = u * len;
      const y = 0.55 * u - 1.05 * u * u;
      for (const side of [-1, 1]) {
        pos.push(x, y, side * w);
        col.copy(leafBase).lerp(leafTip, u);
        cols.push(col.r, col.g, col.b);
      }
      if (s < L) {
        const a = s * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const leaf = new THREE.BufferGeometry();
    leaf.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    leaf.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    leaf.setIndex(idx);
    leaf.rotateY((f / FR) * Math.PI * 2 + (f % 2) * 0.25);
    leaf.translate(0.9, H, 0); // crown sits on the bent trunk top
    leaf.computeVertexNormals();
    parts.push(leaf);
  }
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  return merged;
}

export function buildPalms(mats: Mats, count = 16, seed = 11, R = ISLAND_R): THREE.InstancedMesh {
  const geo = palmGeometry();
  const mesh = new THREE.InstancedMesh(geo, mats.palm, count);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  const rand = rng(seed);
  const dummy = new THREE.Object3D();
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < 400) {
    const a = rand() * Math.PI * 2;
    const u = 0.4 + rand() * 0.52;
    const r = coastRadius(a, R) * u;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 5.8 && Math.abs(z) < 4.2) continue; // villa footprint
    if (z > 0.5 && Math.abs(x) < 8.5) continue; // keep the facade (+z) unobstructed
    dummy.position.set(x, islandHeight(x, z, R) - 0.05, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    const s = 0.75 + rand() * 0.6;
    dummy.scale.set(s, s * (0.9 + rand() * 0.3), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed++, dummy.matrix);
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/* -------------------------------------------------------------------------- */
/*  Island assembly                                                            */
/* -------------------------------------------------------------------------- */

export interface Island {
  group: THREE.Group;
  villa: Villa | null;
  lagoon: THREE.Mesh;
  lagoonMat: THREE.ShaderMaterial;
  dispose(): void;
}

export interface IslandOptions {
  withVilla?: boolean;
  palms?: number;
  seed?: number;
  segs?: number;
}

export function buildIsland(mats: Mats, shared: SharedUniforms, opts: IslandOptions = {}): Island {
  const { withVilla = true, palms = 16, seed = 11, segs = 84 } = opts;
  const group = new THREE.Group();

  const terrain = new THREE.Mesh(buildIslandGeometry(ISLAND_R, 30, 8, segs), mats.sand);
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  group.add(terrain);

  let villa: Villa | null = null;
  if (withVilla) {
    villa = buildVilla(mats, shared);
    villa.group.position.set(0, PAD_Y, 0);
    villa.group.rotation.y = 0.2;
    group.add(villa.group);
  }
  if (palms > 0) group.add(buildPalms(mats, palms, seed));

  const lagoonGeo = new THREE.PlaneGeometry(ISLAND_R * 3.6, ISLAND_R * 3.6);
  lagoonGeo.rotateX(-Math.PI / 2);
  const lagoonMat = new THREE.ShaderMaterial({
    vertexShader: LAGOON_VERT,
    fragmentShader: LAGOON_FRAG,
    uniforms: {
      uR: { value: ISLAND_R },
      uTime: shared.uTime,
      uShallow: { value: new THREE.Color('#5fe0d2') },
      uFoam: { value: new THREE.Color('#ffffff') },
      uLight: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
  });
  const lagoon = new THREE.Mesh(lagoonGeo, lagoonMat);
  lagoon.position.y = 0.03;
  lagoon.renderOrder = 2;
  group.add(lagoon);

  return {
    group,
    villa,
    lagoon,
    lagoonMat,
    dispose() {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      lagoonMat.dispose();
      villa?.pool.dispose();
      villa?.lanternMat.dispose();
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Boat                                                                       */
/* -------------------------------------------------------------------------- */

export function buildBoat(mats: Mats): THREE.Group {
  const g = new THREE.Group();

  const hull = new THREE.CylinderGeometry(0.5, 0.32, 2.6, 8, 1);
  hull.rotateZ(Math.PI / 2);
  hull.scale(1, 0.6, 1);
  const mast = new THREE.CylinderGeometry(0.03, 0.04, 2.8, 5);
  mast.translate(0.1, 1.5, 0);
  const wood = new THREE.Mesh(mergeGeometries([hull, mast])!, mats.wood);
  wood.castShadow = true;
  g.add(wood);

  // Triangular sail
  const sail = new THREE.BufferGeometry();
  sail.setAttribute('position', new THREE.Float32BufferAttribute([0.18, 0.5, 0, 0.18, 2.8, 0, 1.3, 0.55, 0], 3));
  sail.setIndex([0, 1, 2]);
  sail.computeVertexNormals();
  const cloth = new THREE.Mesh(sail, mats.cloth);
  cloth.castShadow = true;
  g.add(cloth);

  g.position.y = 0.04;
  return g;
}
