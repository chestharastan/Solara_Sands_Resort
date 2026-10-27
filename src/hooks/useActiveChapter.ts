/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { sceneState, subscribeScene } from '../lib/sceneStore';
import { chapterAt } from '../lib/timeline';

/** Index of the day-chapter currently on screen (-1 before they begin). Re-renders only when it changes. */
export function useActiveChapter(): number {
  const [active, setActive] = useState(() => chapterAt(sceneState.progress));
  useEffect(
    () =>
      subscribeScene(() => {
        const next = chapterAt(sceneState.progress);
        setActive((prev) => (prev === next ? prev : next));
      }),
    [],
  );
  return active;
}
