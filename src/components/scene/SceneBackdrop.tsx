/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RefObject, useEffect, useRef } from 'react';
import { getDevice } from '../../lib/device';
import { sceneState, subscribeScene } from '../../lib/sceneStore';
import { samplePalette, toCss } from '../../lib/timeline';
import type { HeroScene } from '../../three/heroScene';

/**
 * Mounts the fixed 3D canvas behind the scene zone.
 *
 * • Three.js (~160 kB gz) is loaded with a dynamic import, so it is a separate
 *   chunk: the page shell, fonts and copy paint first and the 3D fades in.
 * • A CSS gradient "sky" is always rendered underneath. It is what visitors see
 *   while the chunk loads, and the permanent fallback when WebGL is missing,
 *   blocked, or crashes. It follows the same time-of-day palette.
 */
export default function SceneBackdrop({ zoneRef, onReady }: { zoneRef: RefObject<HTMLElement | null>; onReady: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  // CSS fallback sky follows the time of day (cheap: only runs when scroll/intro changes it).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const paint = () => {
      const pal = samplePalette(sceneState.tod);
      el.style.setProperty('--sky-top', toCss(pal.zenith));
      el.style.setProperty('--sky-mid', toCss(pal.horizon));
      el.style.setProperty('--sky-bot', toCss(pal.seaShallow));
    };
    paint();
    return subscribeScene(paint);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const zone = zoneRef.current;
    if (!container || !zone) return;

    const profile = getDevice();
    if (!profile.webgl) {
      readyRef.current();
      return;
    }

    let disposed = false;
    let scene: HeroScene | null = null;

    import('../../three/heroScene')
      .then(({ createHeroScene }) => {
        if (disposed) return;
        scene = createHeroScene({ container, zone, profile });
        return scene.ready.then(() => {
          if (disposed) return;
          container.classList.add('is-ready');
          readyRef.current();
        });
      })
      .catch((err) => {
        // Context creation can fail on blocklisted GPUs – stay on the CSS sky.
        console.warn('[Solara] 3D scene unavailable, using CSS sky.', err);
        if (!disposed) readyRef.current();
      });

    return () => {
      disposed = true;
      scene?.dispose();
    };
  }, [zoneRef]);

  return <div ref={containerRef} className="scene-backdrop" aria-hidden="true"><div className="sky-fallback" /></div>;
}
