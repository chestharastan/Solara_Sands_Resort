/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { todFromProgress } from './timeline';

/**
 * A tiny framework-free store shared by the DOM (HUD clock, chapter UI) and the
 * WebGL scene. It deliberately avoids React state: scroll updates 60×/s and we
 * never want that to trigger re-renders. Consumers subscribe and write straight
 * to the DOM or to shader uniforms.
 */

export const sceneState = {
  /** 0‥1 progress through the scene zone. */
  progress: 0,
  /** Time of day 0‥1 (see timeline.ts). Includes the sunrise intro offset. */
  tod: 0.17,
  /** 0‥1 – eases in once the preloader has finished (sun "rises" into view). */
  intro: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeScene(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function recompute() {
  const base = todFromProgress(sceneState.progress);
  const e = 1 - Math.pow(1 - sceneState.intro, 3);
  sceneState.tod = Math.max(0, base - (1 - e) * 0.11);
  listeners.forEach((l) => l());
}

export function setSceneProgress(p: number) {
  const next = Math.min(1, Math.max(0, p));
  if (Math.abs(next - sceneState.progress) < 1e-5) return;
  sceneState.progress = next;
  recompute();
}

export function setSceneIntro(v: number) {
  sceneState.intro = v;
  recompute();
}

/** Plays the sunrise intro. Resolves when done. Instant when reduced motion is on. */
export function playIntro(reduced: boolean, ms = 3400): Promise<void> {
  if (reduced) {
    setSceneIntro(1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      setSceneIntro(k);
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}
