/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RefObject, useEffect } from 'react';
import { setSceneProgress } from '../lib/sceneStore';

/**
 * Converts page scroll into `sceneState.progress` (0‥1) for the "scene zone"
 * element (Hero + Story + Day chapters). The zone's geometry is measured once
 * and on resize – never inside the scroll handler – so scrolling stays free of
 * layout reads.
 *
 * `enabled` must be false while the zone element is not mounted (e.g. the Staff Portal is showing) and
 * flip back to true when it returns, so the listener re-attaches to the *new* element.
 */
export function useSceneZone(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    let top = 0;
    let travel = 1;

    const update = () => setSceneProgress((window.scrollY - top) / travel);
    const measure = () => {
      top = el.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, el.offsetHeight - window.innerHeight);
      update();
    };

    measure();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Fonts / late layout can move the zone – re-measure once everything has settled.
    const t = window.setTimeout(measure, 1200);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', measure);
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [ref, enabled]);
}
