/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { sceneState, subscribeScene } from '../../lib/sceneStore';
import { clockFromTod } from '../../lib/timeline';

/**
 * Live clock + phase of day ("06:05 · Sunrise") that stays in sync with the 3D
 * lighting. Subscribes to the scene store and writes text straight to the DOM,
 * so scrolling never re-renders React.
 */
export default function ClockReadout({ timeClass = '', phaseClass = '', className = '' }: { timeClass?: string; phaseClass?: string; className?: string }) {
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const paint = () => {
      const { label, phase } = clockFromTod(sceneState.tod);
      if (timeRef.current && timeRef.current.textContent !== label) timeRef.current.textContent = label;
      if (phaseRef.current && phaseRef.current.textContent !== phase) phaseRef.current.textContent = phase;
    };
    paint();
    return subscribeScene(paint);
  }, []);

  return (
    <span className={className}>
      <span ref={timeRef} className={`tabular-nums ${timeClass}`}>06:05</span>
      <span ref={phaseRef} className={phaseClass}>Sunrise</span>
    </span>
  );
}
