/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The scroll "story" – one place that defines how the page maps to the 3D scene.
 *
 * The first three sections (Hero → Story → Day chapters) live in a single tall
 * "scene zone". While the visitor scrolls through it a *fixed* WebGL canvas
 * flies the camera around the resort and moves the sun across the sky.
 *
 * Section heights are expressed in viewport heights (vh) and shared between the
 * layout (CSS) and the camera/time maths (JS) so they can never drift apart.
 * To lengthen a chapter, change the numbers here – nothing else.
 */

export const HERO_VH = 1;
export const STORY_VH = 2.6;
export const CHAPTERS_VH = 4.2;

/** Scroll distance (in vh) the zone can travel: total height minus the final screen. */
const TRAVEL = STORY_VH + CHAPTERS_VH;

/** Progress (0‥1 across the zone) at which each stage begins/ends. */
export const P_HERO_END = HERO_VH / TRAVEL;
export const P_STORY_END = (HERO_VH + STORY_VH) / TRAVEL;
const CHAPTER_SPAN = 1 - P_STORY_END;

export const CHAPTER_COUNT = 4;

/** Progress at the middle of chapter i (0-based). */
export const chapterCenter = (i: number) => P_STORY_END + CHAPTER_SPAN * ((i + 0.5) / CHAPTER_COUNT);

/** Which chapter is active for a given progress (or -1 before they begin). */
export function chapterAt(p: number): number {
  if (p < P_STORY_END - 0.01) return -1;
  const i = Math.floor(((p - P_STORY_END) / CHAPTER_SPAN) * CHAPTER_COUNT);
  return Math.min(CHAPTER_COUNT - 1, Math.max(0, i));
}

/* -------------------------------------------------------------------------- */
/*  Time of day                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `tod` is a normalised day: 0 = deep night before dawn, ~0.15 = sunrise,
 * ~0.48 = noon, ~0.80 = sunset, 1 = night again.
 * (`sunElevation` below defines exactly where the sun is for each value.)
 * Anchors map scroll progress → tod. Between anchors we interpolate linearly.
 */
const TOD_ANCHORS: Array<[number, number]> = [
  [0, 0.17], // hero: the sun is just clearing the horizon
  [P_HERO_END, 0.2],
  [P_STORY_END, 0.32],
  [chapterCenter(0), 0.38],
  [chapterCenter(1), 0.5],
  [chapterCenter(2), 0.79],
  [chapterCenter(3), 0.97],
  [1, 1],
];

export function todFromProgress(p: number): number {
  const a = TOD_ANCHORS;
  if (p <= a[0][0]) return a[0][1];
  for (let i = 1; i < a.length; i++) {
    if (p <= a[i][0]) {
      const [p0, t0] = a[i - 1];
      const [p1, t1] = a[i];
      const k = (p - p0) / (p1 - p0);
      return t0 + (t1 - t0) * k;
    }
  }
  return a[a.length - 1][1];
}

/** Human clock for a tod value, so the HUD agrees with the lighting. */
const CLOCK_ANCHORS: Array<[number, number]> = [
  [0, 4.6],
  [0.17, 6.05],
  [0.32, 8.0],
  [0.5, 12.5],
  [0.79, 18.2],
  [1, 22.0],
];

export function clockFromTod(tod: number): { label: string; phase: string } {
  const a = CLOCK_ANCHORS;
  let hours = a[a.length - 1][1];
  for (let i = 1; i < a.length; i++) {
    if (tod <= a[i][0]) {
      const [t0, h0] = a[i - 1];
      const [t1, h1] = a[i];
      hours = h0 + (h1 - h0) * ((tod - t0) / (t1 - t0));
      break;
    }
  }
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const phase =
    tod < 0.1 ? 'First light'
    : tod < 0.22 ? 'Sunrise'
    : tod < 0.42 ? 'Morning'
    : tod < 0.6 ? 'Midday'
    : tod < 0.74 ? 'Afternoon'
    : tod < 0.86 ? 'Golden hour'
    : tod < 0.94 ? 'Dusk'
    : 'Moonlight';
  return { label, phase };
}

/* -------------------------------------------------------------------------- */
/*  Sky palette (sRGB 0‥1) – shared by the WebGL sky and the no-WebGL fallback  */
/* -------------------------------------------------------------------------- */

export type RGB = [number, number, number];

export interface Palette {
  zenith: RGB;
  horizon: RGB;
  glow: RGB;
  sun: RGB;
  seaDeep: RGB;
  seaShallow: RGB;
}

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

interface Key extends Record<keyof Palette, RGB> {
  t: number;
}

const KEYS: Key[] = [
  { t: 0.0,  zenith: hex('#050a18'), horizon: hex('#1a2748'), glow: hex('#32406e'), sun: hex('#ffb07a'), seaDeep: hex('#030812'), seaShallow: hex('#0b2536') },
  { t: 0.14, zenith: hex('#27386a'), horizon: hex('#ff9468'), glow: hex('#ff9a5a'), sun: hex('#ffc08a'), seaDeep: hex('#10273d'), seaShallow: hex('#3b6a82') },
  { t: 0.3,  zenith: hex('#2c78c2'), horizon: hex('#cfe6ea'), glow: hex('#ffe3ae'), sun: hex('#fff0cf'), seaDeep: hex('#0a4f6c'), seaShallow: hex('#37c0c2') },
  { t: 0.5,  zenith: hex('#1b6ccf'), horizon: hex('#a9ddf2'), glow: hex('#fff6dc'), sun: hex('#fffaf0'), seaDeep: hex('#075a7d'), seaShallow: hex('#45d6cf') },
  { t: 0.66, zenith: hex('#3a82c6'), horizon: hex('#f0dba8'), glow: hex('#ffd88f'), sun: hex('#ffe7b4'), seaDeep: hex('#0b5470'), seaShallow: hex('#3cbfb6') },
  { t: 0.8,  zenith: hex('#34296a'), horizon: hex('#ff7a45'), glow: hex('#ff8a48'), sun: hex('#ffb070'), seaDeep: hex('#1a2a4a'), seaShallow: hex('#7a5a6a') },
  { t: 0.92, zenith: hex('#10173a'), horizon: hex('#7d3d6d'), glow: hex('#b8506c'), sun: hex('#ff8a70'), seaDeep: hex('#070e22'), seaShallow: hex('#2a2c4c') },
  { t: 1.0,  zenith: hex('#040813'), horizon: hex('#15213d'), glow: hex('#2b3764'), sun: hex('#ff9a80'), seaDeep: hex('#02060f'), seaShallow: hex('#0a1c2e') },
];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function samplePalette(tod: number): Palette {
  const t = Math.min(1, Math.max(0, tod));
  let i = 1;
  while (i < KEYS.length - 1 && t > KEYS[i].t) i++;
  const a = KEYS[i - 1];
  const b = KEYS[i];
  const k = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
  const e = k * k * (3 - 2 * k); // smoothstep so colours linger on the keyframes
  const out = {} as Palette;
  (Object.keys(a) as Array<keyof Key>).forEach((key) => {
    if (key === 't') return;
    (out as unknown as Record<string, RGB>)[key] = mix(a[key] as RGB, b[key] as RGB, e);
  });
  return out;
}

/** Sun elevation (‑1‥1) for a tod. 0 at sunrise/sunset, ~0.9 at noon, negative at night. */
export function sunElevation(tod: number): number {
  return Math.sin(((tod - 0.15) / 0.65) * Math.PI) * 0.92 - (tod < 0.15 || tod > 0.8 ? 0.02 : 0);
}

export const toCss = (c: RGB) => `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;
