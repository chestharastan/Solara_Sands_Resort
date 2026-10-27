/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { animate, useInView } from 'motion/react';
import { getDevice } from '../../lib/device';

/** Counts from 0 to `value` once when scrolled into view. Writes to the DOM directly (no re-renders). */
export default function CountUp({ value, decimals = 0, suffix = '', className = '' }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const fmt = (n: number) => `${n.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (getDevice().reducedMotion) {
      el.textContent = fmt(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = fmt(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {fmt(value)}
    </span>
  );
}
