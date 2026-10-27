/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Device profiling.
 *
 * Everything heavy on this site (WebGL scenes, smooth scroll, backdrop blur,
 * shadow maps) is gated by the *tier* computed here, so a mid-range phone and a
 * gaming desktop both get a smooth experience rather than the same one.
 *
 *   low  – reduced-motion / data-saver / very weak hardware. Static, cheap.
 *   mid  – most phones and laptops. Capped pixel ratio, fewer particles.
 *   high – capable desktops. Full detail, shadows, MSAA.
 */

export type Tier = 'low' | 'mid' | 'high';

export interface DeviceProfile {
  tier: Tier;
  isTouch: boolean;
  isSmallScreen: boolean;
  reducedMotion: boolean;
  webgl: boolean;
  /** Upper bound for renderer.setPixelRatio – the governor can go lower at runtime. */
  maxDpr: number;
}

let cached: DeviceProfile | null = null;

/** True when a WebGL context can actually be created (not just when the API exists). */
export function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    // Release immediately – we only wanted to know if it is possible.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function getDevice(): DeviceProfile {
  if (cached) return cached;

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = window.innerWidth < 820;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(nav.connection?.saveData);
  const cores = nav.hardwareConcurrency ?? 4;
  // Safari/Firefox don't expose deviceMemory – assume a decent desktop, a modest phone.
  const memory = nav.deviceMemory ?? (isTouch ? 4 : 8);
  const webgl = detectWebGL();

  let tier: Tier = 'mid';
  if (reducedMotion || saveData || memory <= 2 || cores <= 2 || !webgl) tier = 'low';
  else if (!isTouch && !isSmallScreen && cores >= 8 && memory >= 8) tier = 'high';

  // Never render more pixels than the screen has: cap by the tier AND the display's real density.
  const tierCap = tier === 'high' ? 2 : tier === 'mid' ? (isTouch ? 1.35 : 1.5) : 1;
  const maxDpr = Math.max(1, Math.min(window.devicePixelRatio || 1, tierCap));

  cached = { tier, isTouch, isSmallScreen, reducedMotion, webgl, maxDpr };
  return cached;
}

/** Expose the tier on <html> so CSS can drop expensive effects (blur, grain) on weak devices. */
export function applyDeviceClasses() {
  const d = getDevice();
  const root = document.documentElement;
  root.dataset.tier = d.tier;
  root.dataset.touch = String(d.isTouch);
  root.dataset.motion = d.reducedMotion ? 'reduced' : 'full';
}
