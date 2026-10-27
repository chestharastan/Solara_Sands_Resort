/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { DeviceProfile } from '../lib/device';
import { HOTSPOTS } from '../content/island';
import { Governor } from './governor';
import { ISLAND_R, anchorAt, buildBoat, buildIsland, createMaterials, createShared, type Mats } from './kit';
import { PUCK_FRAG, PUCK_VERT } from './shaders';

/**
 * THE ISLAND EXPLORER (inspired by Bruno Simon's explorable 3D world)
 * ───────────────────────────────────────────────────────────────────
 * A small, self-contained diorama the visitor can grab and spin. Hotspot
 * markers are ordinary DOM buttons whose positions are projected from 3D every
 * frame – so they stay crisp, focusable and screen-reader friendly.
 *
 *  • drag horizontally  → rotate (with inertia)      • drag vertically → tilt
 *  • choose a hotspot   → the island turns to face it and the camera eases in
 *  • idle               → slow turntable
 *
 * The page keeps scrolling normally on touch devices: the container uses
 * `touch-action: pan-y`, so only horizontal swipes are captured.
 */

export interface IslandSceneOptions {
  container: HTMLElement;
  profile: DeviceProfile;
}

export interface IslandScene {
  ready: Promise<void>;
  /** Register the DOM element that follows a hotspot. */
  registerMarker(id: string, el: HTMLElement | null): void;
  focus(id: string | null): void;
  dispose(): void;
}

const { clamp, lerp } = THREE.MathUtils;

/** Shortest signed angle from a to b. */
const wrap = (a: number, b: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/** Thatched beach hut / spa sala. */
function buildHut(mats: Mats, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const deck = new THREE.CylinderGeometry(1.25, 1.25, 0.14, 12);
  deck.translate(0, 0.07, 0);
  const posts = [0, 1, 2, 3].map((i) => {
    const p = new THREE.CylinderGeometry(0.05, 0.05, 1.3, 5);
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    p.translate(Math.cos(a) * 0.95, 0.75, Math.sin(a) * 0.95);
    return p;
  });
  const bar = new THREE.BoxGeometry(0.9, 0.5, 0.3);
  bar.translate(0, 0.4, -0.55);
  const wood = new THREE.Mesh(mergeGeometries([deck, ...posts, bar])!, mats.wood);
  wood.castShadow = wood.receiveShadow = true;
  const roofGeo = new THREE.ConeGeometry(1.65, 1.0, 12, 1, true);
  roofGeo.translate(0, 1.85, 0);
  const roof = new THREE.Mesh(roofGeo, mats.thatch);
  roof.castShadow = true;
  g.add(wood, roof);
  g.scale.setScalar(scale);
  return g;
}

/** Wooden pier reaching out over the water. */
function buildPier(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  const parts: THREE.BufferGeometry[] = [];
  const deck = new THREE.BoxGeometry(4.6, 0.12, 1.3);
  deck.translate(2.3, 0.55, 0);
  parts.push(deck);
  for (let i = 0; i < 5; i++) {
    for (const s of [-1, 1]) {
      const p = new THREE.CylinderGeometry(0.07, 0.07, 1.6, 5);
      p.translate(0.5 + i * 0.95, 0.0, s * 0.6);
      parts.push(p);
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts)!, mats.wood);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}

function buildPuck(R: number, uTime: { value: number }) {
  const geo = new THREE.CylinderGeometry(R, R, 1.8, 96, 1);
  geo.translate(0, -0.9, 0);
  // Vertical gradient on the side wall (teal → deep blue), via vertex colours.
  const pos = geo.attributes.position;
  const col: number[] = [];
  const top = new THREE.Color('#2fb4b8');
  const bot = new THREE.Color('#06222e');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(bot).lerp(top, clamp((pos.getY(i) + 1.8) / 1.8, 0, 1));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));

  const top_ = new THREE.ShaderMaterial({
    vertexShader: PUCK_VERT,
    fragmentShader: PUCK_FRAG,
    uniforms: {
      uTime,
      uR: { value: R },
      uDeep: { value: new THREE.Color('#0b6a80') },
      uShallow: { value: new THREE.Color('#58e2d6') },
    },
  });
  const side = new THREE.MeshBasicMaterial({ vertexColors: true });
  const bottom = new THREE.MeshBasicMaterial({ color: '#06222e' });
  const mesh = new THREE.Mesh(geo, [side, top_, bottom]);
  mesh.receiveShadow = true;
  return { mesh, dispose: () => { geo.dispose(); top_.dispose(); side.dispose(); bottom.dispose(); } };
}

export function createIslandScene({ container, profile }: IslandSceneOptions): IslandScene {
  const { tier, reducedMotion } = profile;
  const animated = !reducedMotion;
  const shadows = tier === 'high';

  const canvas = document.createElement('canvas');
  canvas.className = 'island-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier !== 'low', alpha: true, stencil: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  const shared = createShared();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 200);

  /* ---- Lights: a fixed golden-hour rig --------------------------------------- */
  const hemi = new THREE.HemisphereLight('#cfe8ff', '#a38a62', 0.85);
  const sun = new THREE.DirectionalLight('#ffd7a1', 3.1);
  sun.position.set(-14, 18, 12);
  const rim = new THREE.DirectionalLight('#7fd6ff', 0.7);
  rim.position.set(14, 8, -16);
  scene.add(hemi, sun, rim);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.left = sc.bottom = -15;
    sc.right = sc.top = 15;
    sc.near = 1;
    sc.far = 70;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
  }

  /* ---- World ----------------------------------------------------------------------- */
  const mats = createMaterials(null);
  mats.glass.emissiveIntensity = 0.9; // lit windows – it's always "golden hour" here
  const pivot = new THREE.Group();
  scene.add(pivot);

  const puck = buildPuck(ISLAND_R * 1.55, shared.uTime);
  pivot.add(puck.mesh);

  const island = buildIsland(mats, shared, { palms: tier === 'low' ? 8 : 15, segs: tier === 'low' ? 56 : 80 });
  island.villa!.lanternMat.uniforms.uAlpha.value = 0.75;
  island.villa!.pool.uniforms.uGlow.value = 0.35;
  pivot.add(island.group);

  // Extras that only exist in the diorama.
  const pier = buildPier(mats);
  const pierTheta = HOTSPOTS.find((h) => h.id === 'pier')!.anchor;
  const pt = pierTheta.kind === 'polar' ? pierTheta.theta : 2.55;
  const pierStart = anchorAt(pt, 0.97);
  pier.position.set(pierStart.x, 0, pierStart.z);
  pier.rotation.y = -pt; // +x of the pier points along the polar angle
  pivot.add(pier);

  const beachSpec = HOTSPOTS.find((h) => h.id === 'beach')!.anchor;
  const bt = beachSpec.kind === 'polar' ? beachSpec : { theta: 0.95, u: 0.8, lift: 0 };
  const hut = buildHut(mats, 1);
  const hp = anchorAt(bt.theta, bt.u);
  hut.position.copy(hp);
  pivot.add(hut);

  const spaSpec = HOTSPOTS.find((h) => h.id === 'spa')!.anchor;
  const st = spaSpec.kind === 'polar' ? spaSpec : { theta: -2.3, u: 0.6, lift: 0 };
  const spa = buildHut(mats, 0.85);
  spa.position.copy(anchorAt(st.theta, st.u));
  pivot.add(spa);

  const boat = buildBoat(mats);
  boat.position.set(11.5, 0.04, 8);
  boat.rotation.y = 0.7;
  boat.scale.setScalar(0.8);
  pivot.add(boat);

  /* ---- Hotspot anchors ---------------------------------------------------------------- */
  const anchors = HOTSPOTS.map((h) =>
    h.anchor.kind === 'local' ? new THREE.Vector3(h.anchor.x, h.anchor.y, h.anchor.z) : anchorAt(h.anchor.theta, h.anchor.u, h.anchor.lift),
  );
  // Angle that should face the camera when focused; markers near the island's centre never hide.
  const anchorTheta = anchors.map((a, i) => HOTSPOTS[i].view ?? Math.atan2(a.z, a.x));
  const alwaysVisible = anchors.map((a) => Math.hypot(a.x, a.z) < 4.5);
  const markers = new Map<string, HTMLElement>();

  /* ---- Camera / interaction state ---------------------------------------------------------- */
  const state = {
    rot: 0.5,
    rotTarget: 0.5,
    vel: 0,
    pitch: 0.5, // radians above the horizon
    pitchTarget: 0.5,
    dist: 56,
    distTarget: 56,
    focusId: null as string | null,
    dragging: false,
    lastX: 0,
    lastY: 0,
    idle: 0,
  };
  const BASE_DIST = 56;
  const FOCUS_DIST = 38;

  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-hotspot]')) return;
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.idle = 0;
    container.setPointerCapture?.(e.pointerId);
    container.classList.add('is-dragging');
  };
  const onMove = (e: PointerEvent) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.rotTarget += dx * 0.009;
    state.vel = dx * 0.009;
    state.pitchTarget = clamp(state.pitchTarget + dy * 0.004, 0.22, 1.0);
    state.focusId = state.focusId && Math.abs(dx) > 6 ? null : state.focusId;
    if (!state.focusId) state.distTarget = BASE_DIST;
    state.idle = 0;
  };
  const onUp = (e: PointerEvent) => {
    if (!state.dragging) return;
    state.dragging = false;
    container.releasePointerCapture?.(e.pointerId);
    container.classList.remove('is-dragging');
    state.rotTarget += state.vel * 10; // fling
  };
  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerup', onUp);
  container.addEventListener('pointercancel', onUp);

  /* ---- Sizing + governor --------------------------------------------------------------------- */
  let width = 0;
  let height = 0;
  let distScale = 1;
  let dpr = profile.maxDpr;
  const governor = new Governor({
    dpr,
    minDpr: 0.75,
    maxDpr: profile.maxDpr,
    onDpr: (d) => { dpr = d; width = 0; applySize(); },
    onDegrade: () => { sun.castShadow = false; },
  });

  function applySize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    shared.uPR.value = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait phones: widen the lens a little and pull the camera back so the whole island fits.
    camera.fov = camera.aspect < 1 ? 32 + (1 - camera.aspect) * 16 : 32;
    distScale = camera.aspect < 1.25 ? lerp(1, 1.6, clamp((1.25 - camera.aspect) / 0.85, 0, 1)) : 1;
    camera.updateProjectionMatrix();
  }

  /* ---- Loop ------------------------------------------------------------------------------------- */
  let active = false;
  let running = false;
  let time = 0;
  let last = performance.now();
  let firstFrame: (() => void) | null = null;
  const ready = new Promise<void>((res) => (firstFrame = res));
  const v = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const lookAt = new THREE.Vector3(0, 2, 0);
  const lookTarget = new THREE.Vector3(0, 2, 0);

  function frame(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    time += dt;
    shared.uTime.value = time;

    if (!state.dragging) {
      state.idle += dt;
      if (animated && !state.focusId && state.idle > 1.5) state.rotTarget += dt * 0.12; // turntable
    }
    const ease = 1 - Math.exp(-dt * (state.dragging ? 14 : 4));
    const dr = state.rotTarget - state.rot;
    state.rot += dr * ease;
    state.pitch += (state.pitchTarget - state.pitch) * ease;
    state.dist += (state.distTarget - state.dist) * (1 - Math.exp(-dt * 3));
    state.vel *= 0.9;

    // Focus target: where the camera looks while a hotspot is selected.
    if (state.focusId) {
      const i = HOTSPOTS.findIndex((h) => h.id === state.focusId);
      pivot.updateMatrixWorld();
      lookTarget.copy(anchors[i]);
      pivot.localToWorld(lookTarget);
      lookTarget.multiplyScalar(0.6);
      lookTarget.y = Math.max(1.2, lookTarget.y);
    } else lookTarget.set(0, 2, 0);
    lookAt.lerp(lookTarget, 1 - Math.exp(-dt * 3));

    pivot.rotation.y = state.rot;
    boat.position.y = 0.04 + Math.sin(time * 0.9) * 0.04;
    boat.rotation.z = Math.sin(time * 0.6) * 0.03;

    const cp = Math.cos(state.pitch);
    const d = state.dist * distScale;
    camera.position.set(0, Math.sin(state.pitch) * d, cp * d);
    camera.lookAt(lookAt);
    camera.updateMatrixWorld();

    // Project hotspot markers.
    toCam.set(camera.position.x, 0, camera.position.z).normalize();
    const w = width / 2;
    const h = height / 2;
    HOTSPOTS.forEach((hs, i) => {
      const el = markers.get(hs.id);
      if (!el) return;
      v.copy(anchors[i]);
      pivot.localToWorld(v);
      const facing = Math.cos(anchorTheta[i] - state.rot - Math.PI / 2); // 1 = facing the camera
      v.project(camera);
      const x = v.x * w + w;
      const y = -v.y * h + h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.dataset.facing = alwaysVisible[i] || facing > -0.25 ? 'front' : 'back';
    });

    renderer.render(scene, camera);
    if (animated) governor.tick(dt);
    if (firstFrame) { firstFrame(); firstFrame = null; }
  }

  function start() {
    if (running || !active || document.hidden) return;
    running = true;
    last = performance.now();
    renderer.setAnimationLoop(frame);
  }
  function stop() {
    running = false;
    renderer.setAnimationLoop(null);
  }

  const io = new IntersectionObserver(([e]) => {
    active = e.isIntersecting;
    active ? start() : stop();
  }, { rootMargin: '5% 0px' });
  io.observe(container);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(applySize);
  ro.observe(container);
  applySize();

  return {
    ready,
    registerMarker(id, el) {
      if (el) markers.set(id, el);
      else markers.delete(id);
    },
    focus(id) {
      state.focusId = id;
      state.idle = 0;
      if (id) {
        const i = HOTSPOTS.findIndex((h) => h.id === id);
        // Rotate so the hotspot faces the camera (+z), via the shortest route.
        state.rotTarget = state.rot + wrap(state.rot, anchorTheta[i] - Math.PI / 2);
        state.distTarget = FOCUS_DIST;
        state.pitchTarget = 0.42;
      } else {
        state.distTarget = BASE_DIST;
        state.pitchTarget = 0.5;
      }
    },
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onUp);
      island.dispose();
      puck.dispose();
      pier.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      hut.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      spa.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      boat.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      Object.values(mats).forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

