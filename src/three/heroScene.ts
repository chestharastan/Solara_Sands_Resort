/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import type { DeviceProfile } from '../lib/device';
import { sceneState } from '../lib/sceneStore';
import { P_HERO_END, P_STORY_END, chapterCenter, samplePalette, sunElevation, type RGB } from '../lib/timeline';
import { Governor } from './governor';
import { buildBoat, buildIsland, createMaterials, createShared } from './kit';
import { rng } from './noise';
import { PARTICLE_FRAG, PARTICLE_VERT, SKY_FRAG, SKY_VERT } from './shaders';

/**
 * THE HERO SCENE
 * ──────────────
 * One fixed, full-screen canvas sits behind the first three sections. As the
 * visitor scrolls, `sceneState.progress` (0‥1) drives two things:
 *
 *   1. a CAMERA RIG – the camera flies from a low shot over open water, past the
 *      island ("zoom"), up for an aerial view of the villa, around to the beach
 *      at golden hour and back out under the stars. Keyframes are defined below
 *      and eased so the camera "settles" at each chapter.
 *   2. TIME OF DAY – the sun, sky, sea colour, light colour/intensity, stars,
 *      lit windows and pool lights all derive from `sceneState.tod`.
 *
 * Cost control: sky + sea = one fragment-shader pass; the whole resort is ~10
 * draw calls; shadows are baked per sun-position, not per frame; the pixel
 * ratio and detail level adapt to measured frame time (see governor.ts).
 */

export interface HeroSceneOptions {
  container: HTMLElement;
  zone: HTMLElement;
  profile: DeviceProfile;
}

export interface HeroScene {
  /** Resolves after shaders are compiled and the first frame is on screen. */
  ready: Promise<void>;
  dispose(): void;
}

/* ---- Camera path ------------------------------------------------------------
 * `p` is scroll progress. Positions/targets are world-space. The island's
 * centre is (8, 0, -24); the villa faces +z (towards the camera).            */
interface Key {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
}

const ISLAND_POS = new THREE.Vector3(8, 0, -24);

const KEYS: Key[] = [
  { p: 0, pos: [0, 1.5, 12], look: [-1.5, 6.0, -40] }, // hero: low, sun on the horizon
  { p: P_HERO_END, pos: [0.4, 1.7, 7], look: [1, 5, -40] },
  { p: (P_HERO_END + P_STORY_END) / 2, pos: [-1.5, 2.4, -4], look: [6, 8.5, -24] }, // story: push in – the island looms low in frame, under the text
  { p: P_STORY_END, pos: [-4.5, 5.2, -10], look: [8, 1.8, -24] }, // aerial three-quarter view
  { p: chapterCenter(0), pos: [-3.5, 4.4, -9.5], look: [8, 2.0, -24] }, // morning
  { p: chapterCenter(1), pos: [4, 3.2, -12], look: [8.5, 2.2, -24] }, // midday: close to the pool
  { p: chapterCenter(2), pos: [-7, 2.8, -11], look: [9, 2.6, -25] }, // golden hour: sun hangs just right of the island
  { p: chapterCenter(3), pos: [6, 2.4, -8], look: [8, 4.5, -24] }, // night: lanterns, stars above
  { p: 1, pos: [7, 3, -10], look: [8, 5.2, -24] },
];

const { smoothstep, clamp, lerp } = THREE.MathUtils;
const ease = (t: number) => lerp(t, t * t * (3 - 2 * t), 0.65); // part linear, part smoothstep

function sampleKeys(p: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = ease(clamp((p - a.p) / (b.p - a.p), 0, 1));
  outPos.set(lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t));
  outLook.set(lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t));
}

const setRGB = (c: THREE.Color, v: RGB) => c.setRGB(v[0], v[1], v[2], THREE.SRGBColorSpace);

/**
 * Sun azimuth (radians, 0 = straight ahead, negative = left) over the day. It is an art-directed
 * path, not astronomy: backlit sunrise in the hero, side light in the morning, front light at
 * midday, and at golden hour the sun swings round to the right so it hangs beside the island.
 */
const SUN_AZ: Array<[number, number]> = [[0, -0.55], [0.17, -0.55], [0.32, -1.5], [0.5, -3.14], [0.65, -3.9], [0.79, -4.9], [1, -5.6]];
function sunAzimuth(tod: number): number {
  if (tod <= SUN_AZ[0][0]) return SUN_AZ[0][1];
  for (let i = 1; i < SUN_AZ.length; i++) {
    if (tod <= SUN_AZ[i][0]) {
      const [t0, a0] = SUN_AZ[i - 1];
      const [t1, a1] = SUN_AZ[i];
      return lerp(a0, a1, (tod - t0) / (t1 - t0));
    }
  }
  return SUN_AZ[SUN_AZ.length - 1][1];
}

export function createHeroScene({ container, zone, profile }: HeroSceneOptions): HeroScene {
  const { tier, reducedMotion } = profile;
  const animated = !reducedMotion;
  const useShadows = tier !== 'low';

  /* ---- Renderer ---------------------------------------------------------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: tier === 'high', // MSAA is wasted on a full-screen shader; only silhouettes benefit
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.localClippingEnabled = true; // used to slice props at the waterline
  if (useShadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false; // re-baked only when the sun has moved
  }

  const shared = createShared();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);

  /* ---- Sky + sea (single full-screen pass) -------------------------------- */
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    defines: { OCTAVES: tier === 'high' ? 5 : tier === 'mid' ? 4 : 3 },
    uniforms: {
      uCamWorld: { value: camera.matrixWorld },
      uProjInv: { value: camera.projectionMatrixInverse },
      uCamPos: { value: camera.position },
      uTime: shared.uTime,
      uSunDir: { value: new THREE.Vector3(0, 0.1, -1) },
      uMoonDir: { value: new THREE.Vector3(0.35, 0.5, -0.9).normalize() },
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uSeaDeep: { value: new THREE.Color() },
      uSeaShallow: { value: new THREE.Color() },
      uStars: { value: 0 },
      uSunAmt: { value: 1 },
      uCloud: { value: 0.4 },
      uFog: { value: 0.016 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);

  /* ---- Lights -------------------------------------------------------------- */
  const hemi = new THREE.HemisphereLight('#ffffff', '#a89268', 0.6);
  const sun = new THREE.DirectionalLight('#ffffff', 2.5);
  const moon = new THREE.DirectionalLight('#8fa8ff', 0);
  moon.position.set(-10, 40, -10);
  // Sky-bounce fill from the camera side: keeps the facade readable when the sun is behind the island.
  const fill = new THREE.DirectionalLight('#ffffff', 0.5);
  fill.position.set(2, 12, 30);
  fill.target.position.copy(ISLAND_POS);
  scene.add(hemi, sun, sun.target, moon, fill, fill.target);
  sun.target.position.copy(ISLAND_POS);
  if (useShadows) {
    sun.castShadow = true;
    const s = tier === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(s, s);
    const sc = sun.shadow.camera;
    sc.left = sc.bottom = -15;
    sc.right = sc.top = 15;
    sc.near = 1;
    sc.far = 110;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
  }

  /* ---- World --------------------------------------------------------------- */
  const seaClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y = 0 → hides everything underwater
  const mats = createMaterials(seaClip);

  const island = buildIsland(mats, shared, { segs: tier === 'low' ? 56 : 84, palms: tier === 'low' ? 9 : 16 });
  island.group.position.copy(ISLAND_POS);
  scene.add(island.group);

  // Distant islets give depth/parallax at the horizon.
  const islets = [
    { x: -26, z: -52, s: 0.5, seed: 3 },
    { x: 34, z: -66, s: 0.8, seed: 5 },
  ].map((c) => {
    const isl = buildIsland(mats, shared, { withVilla: false, palms: 5, seed: c.seed, segs: 44 });
    isl.group.position.set(c.x, 0, c.z);
    isl.group.scale.setScalar(c.s);
    isl.group.rotation.y = c.seed;
    isl.group.traverse((o) => {
      o.castShadow = false;
    });
    scene.add(isl.group);
    return isl;
  });

  const boat = buildBoat(mats);
  boat.scale.setScalar(0.6);
  scene.add(boat);

  /* ---- Particles ----------------------------------------------------------- */
  const pCount = tier === 'high' ? 700 : tier === 'mid' ? 320 : 110;
  const rand = rng(99);
  const pPos = new Float32Array(pCount * 3);
  const pSeed = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (rand() - 0.5) * 70;
    pPos[i * 3 + 1] = 0.4 + rand() * 13;
    pPos[i * 3 + 2] = -50 + rand() * 66;
    pSeed[i] = rand();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));
  const pMat = new THREE.ShaderMaterial({
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    uniforms: {
      uTime: shared.uTime,
      uPR: shared.uPR,
      uSize: { value: 2.2 },
      uColor: { value: new THREE.Color('#fff2cf') },
      uAlpha: { value: 0.4 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  scene.add(particles);

  /* ---- Sizing --------------------------------------------------------------- */
  let width = 0;
  let height = 0;
  let aspect = 1;
  const governor = new Governor({
    dpr: profile.maxDpr,
    minDpr: 0.75,
    maxDpr: profile.maxDpr,
    onDpr: (d) => applySize(true, d),
    onDegrade: (level) => {
      if (level >= 1) {
        sun.castShadow = false;
        pGeo.setDrawRange(0, Math.floor(pCount / 2));
      }
      if (level >= 2) {
        skyMat.defines.OCTAVES = 2;
        skyMat.needsUpdate = true;
      }
      dirty = true;
    },
  });
  let dpr = profile.maxDpr;

  function applySize(force = false, nextDpr = dpr) {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    // Mobile browsers resize the viewport a little when the URL bar collapses; re-allocating
    // buffers for that would stutter. Ignore small height-only changes.
    if (!force && w === width && Math.abs(h - height) < 140 && height) return;
    width = w;
    height = h;
    dpr = nextDpr;
    shared.uPR.value = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    aspect = w / h;
    dirty = true;
  }

  /* ---- Input ---------------------------------------------------------------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (!profile.isTouch && animated) window.addEventListener('pointermove', onPointer, { passive: true });

  /* ---- Frame loop ----------------------------------------------------------- */
  let active = true;
  let running = false;
  let dirty = true;
  let time = animated ? 0 : 4.2;
  let last = performance.now();
  let pDisp = sceneState.progress;
  let todDisp = sceneState.tod;
  let shadowTod = -1;
  let firstFrame: (() => void) | null = null;
  const ready = new Promise<void>((res) => (firstFrame = res));

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tgtPos = new THREE.Vector3();
  const tgtLook = new THREE.Vector3();
  const sunDir = new THREE.Vector3();
  const tmp = new THREE.Color();
  let camInit = false;

  function updateSky(tod: number) {
    const pal = samplePalette(tod);
    const u = skyMat.uniforms;
    setRGB(u.uZenith.value, pal.zenith);
    setRGB(u.uHorizon.value, pal.horizon);
    setRGB(u.uGlow.value, pal.glow);
    setRGB(u.uSunColor.value, pal.sun);
    setRGB(u.uSeaDeep.value, pal.seaDeep);
    setRGB(u.uSeaShallow.value, pal.seaShallow);

    const elev = sunElevation(tod);
    const y = clamp(elev, -0.95, 0.97);
    const horiz = Math.sqrt(1 - y * y);
    const az = sunAzimuth(tod);
    sunDir.set(Math.sin(az) * horiz, y, -Math.cos(az) * horiz);
    u.uSunDir.value.copy(sunDir);

    const daylight = smoothstep(elev, -0.02, 0.32);
    const night = 1 - smoothstep(elev, -0.3, 0.03);
    u.uStars.value = night;
    u.uSunAmt.value = smoothstep(elev, -0.34, 0.03);
    u.uMoonDir.value.set(0.3, Math.max(0.3, -elev * 0.7 + 0.25), -0.9).normalize();

    // Lights follow the sky.
    sun.position.copy(ISLAND_POS).addScaledVector(sunDir, 55);
    setRGB(sun.color, pal.sun);
    sun.intensity = 3.2 * smoothstep(elev, -0.06, 0.2);
    setRGB(hemi.color, pal.zenith);
    hemi.color.lerp(tmp.set('#ffffff'), 0.25);
    hemi.groundColor.set('#8e7a58');
    hemi.intensity = 0.28 + 0.62 * daylight + 0.1 * night;
    moon.intensity = 0.9 * night;
    setRGB(fill.color, pal.horizon);
    fill.color.lerp(tmp.set('#ffffff'), 0.3);
    // A low sun is raking/backlit, so lift the warm bounce light to make sand and walls glow.
    const lowSun = smoothstep(elev, 0.4, 0.05) * smoothstep(elev, -0.12, 0.02);
    fill.intensity = (0.3 + 0.75 * (1 - daylight * 0.55) + 1.1 * lowSun) * (1 - night * 0.6);

    // Evening: the resort switches its lights on.
    const lit = 1 - smoothstep(elev, -0.14, 0.12);
    mats.glass.emissiveIntensity = lit * 1.5;
    if (island.villa) {
      island.villa.pool.uniforms.uGlow.value = lit;
      island.villa.lanternMat.uniforms.uAlpha.value = lit * 0.95;
    }
    island.lagoonMat.uniforms.uLight.value = 0.3 + 0.7 * daylight;
    islets.forEach((i) => (i.lagoonMat.uniforms.uLight.value = 0.3 + 0.7 * daylight));

    // Particles: warm sand glints by day, fireflies by night.
    setRGB(pMat.uniforms.uColor.value, pal.glow);
    pMat.uniforms.uColor.value.lerp(tmp.set('#c9ff9a'), night * 0.7);
    pMat.uniforms.uAlpha.value = 0.28 + 0.5 * night;

    if (useShadows && Math.abs(tod - shadowTod) > 0.004) {
      shadowTod = tod;
      renderer.shadowMap.needsUpdate = true;
    }
  }

  function frame(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (animated) {
      time += dt;
      shared.uTime.value = time;
    }

    // Damped progress → inertia for touch scrolling, extra silk for wheel scrolling.
    const target = sceneState.progress;
    const k = animated ? 1 - Math.exp(-dt * 6) : 1;
    const dp = target - pDisp;
    pDisp += dp * k;
    todDisp += (sceneState.tod - todDisp) * (animated ? 1 - Math.exp(-dt * 4) : 1);

    // Tall (phone) screens see far less horizontally, so: widen the lens, pull the camera back
    // along its approach, and in the hero yaw left so both the sun and the island stay in frame.
    const portrait = clamp((1.15 - aspect) / 0.65, 0, 1);
    sampleKeys(pDisp, tgtPos, tgtLook);
    if (portrait > 0) {
      const pull = 1 + portrait * 0.45;
      tgtPos.x = tgtLook.x + (tgtPos.x - tgtLook.x) * pull;
      tgtPos.z = tgtLook.z + (tgtPos.z - tgtLook.z) * pull;
      const heroMix = 1 - smoothstep(pDisp, 0, P_HERO_END * 1.5);
      tgtLook.x -= portrait * heroMix * 5.5;
      // Tilt the hero down on tall screens: the horizon (and island) rise, leaving the lower half for the headline.
      tgtLook.y -= portrait * heroMix * 9;
      // ...and during the chapters the info card covers the lower half, so aim lower to lift the island up.
      tgtLook.y -= portrait * smoothstep(pDisp, P_STORY_END - 0.06, P_STORY_END + 0.02) * 3.4;
    }

    // On wide screens the chapter cards sit on the right, so slide the island to the left of centre.
    tgtLook.x += (1 - portrait) * smoothstep(pDisp, P_STORY_END - 0.06, P_STORY_END + 0.02) * 4.5;

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    tgtPos.x += pointer.x * 0.9;
    tgtPos.y += -pointer.y * 0.4;
    tgtLook.x += pointer.x * 1.6;
    tgtLook.y += -pointer.y * 0.9;

    if (!camInit) {
      camPos.copy(tgtPos);
      camLook.copy(tgtLook);
      camInit = true;
    } else {
      const ck = animated ? 1 - Math.exp(-dt * 5) : 1;
      camPos.lerp(tgtPos, ck);
      camLook.lerp(tgtLook, ck);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // Scroll "warp": the lens opens up a touch while you scroll fast (zoom feel).
    const fov = 52 + portrait * 22 + clamp(Math.abs(dp) * 60, 0, 1) * 4;
    if (Math.abs(fov - camera.fov) > 0.01 || camera.aspect !== aspect) {
      camera.fov = fov;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    if (animated) {
      // Boat drifts and bobs; sails never stop gently moving.
      boat.position.set(-10 + Math.sin(time * 0.08) * 2.5, 0.04 + Math.sin(time * 0.9) * 0.04, -27 + Math.cos(time * 0.06) * 2);
      boat.rotation.set(Math.sin(time * 0.7) * 0.03, 0.6 + Math.sin(time * 0.1) * 0.15, Math.sin(time * 0.6) * 0.03);
    } else {
      boat.position.set(-10, 0.04, -27);
      boat.rotation.y = 0.6;
    }

    updateSky(todDisp);

    const needs = animated || dirty || Math.abs(dp) > 1e-4;
    if (needs) {
      renderer.render(scene, camera);
      dirty = false;
      if (animated) governor.tick(dt);
      if (firstFrame) {
        firstFrame();
        firstFrame = null;
      }
    }
  }

  function start() {
    if (running || !active || document.hidden) return;
    running = true;
    last = performance.now();
    renderer.setAnimationLoop(frame);
  }
  function stop() {
    if (!running) return;
    running = false;
    renderer.setAnimationLoop(null);
  }

  // Only burn GPU while the scene is actually visible.
  const io = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    container.classList.toggle('is-hidden', !active);
    active ? start() : stop();
  }, { rootMargin: '10% 0px' });
  io.observe(zone);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  const ro = new ResizeObserver(() => applySize());
  ro.observe(container);
  applySize(true);

  // Compile shaders off the main thread where supported, then show the first frame.
  const compile = (renderer as unknown as { compileAsync?: (s: THREE.Scene, c: THREE.Camera) => Promise<void> }).compileAsync;
  (compile ? compile.call(renderer, scene, camera) : Promise.resolve()).catch(() => {}).finally(start);

  if (import.meta.env.DEV) {
    // Dev-only inspection hook (stripped from production builds): jump straight to the current
    // scroll state without waiting for the camera/sun damping – handy for screenshots and tuning.
    (window as unknown as Record<string, unknown>).__solara = {
      renderer,
      scene,
      camera,
      sceneState,
      snap() {
        pDisp = sceneState.progress;
        todDisp = sceneState.tod;
        camInit = false;
        dirty = true;
      },
    };
  }

  return {
    ready,
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      island.dispose();
      islets.forEach((i) => i.dispose());
      pGeo.dispose();
      pMat.dispose();
      skyMat.dispose();
      sky.geometry.dispose();
      Object.values(mats).forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
