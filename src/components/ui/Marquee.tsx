/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useRef } from 'react';
import { getDevice } from '../../lib/device';

/**
 * Infinite ticker.
 *
 * • It ALWAYS travels the same way. Scrolling only makes it a little faster (in either scroll direction) –
 *   it never flips and runs backwards, which reads as "going back and forth" and feels jarring.
 * • The track holds three copies of the content and wraps by exactly one copy's width, so the loop is
 *   seamless at any screen width.
 * • One requestAnimationFrame loop that exists only while the ticker is on screen; it writes a single
 *   `transform` (compositor-friendly) and reads nothing but `scrollY`.
 * • With prefers-reduced-motion it does not move at all – CSS lays one copy out as a static, wrapped list.
 */
export default function Marquee({ children, speed = 60, className = '' }: { children: ReactNode; /** px per second at rest */ speed?: number; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!root || !track || !group || getDevice().reducedMotion) return;

    let width = group.offsetWidth;
    let x = 0;
    let boost = 0; // smoothed extra speed from scrolling (0 … 2.5×)
    let raf = 0;
    let last = 0;
    let lastY = window.scrollY;

    const ro = new ResizeObserver(() => {
      width = group.offsetWidth;
    });
    ro.observe(group);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const y = window.scrollY;
      const v = Math.abs(y - lastY) / Math.max(dt, 0.001); // px/s, direction ignored on purpose
      lastY = y;
      boost += (Math.min(v / 1200, 2.5) - boost) * Math.min(1, dt * 5);
      x -= speed * (1 + boost) * dt;
      if (x <= -width) x += width;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        cancelAnimationFrame(raf);
        if (e.isIntersecting) {
          last = performance.now();
          lastY = window.scrollY;
          raf = requestAnimationFrame(tick);
        }
      },
      { rootMargin: '120px' },
    );
    io.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [speed]);

  return (
    <div ref={rootRef} className={`marquee ${className}`} aria-hidden="true">
      <div ref={trackRef} className="marquee__track">
        <div ref={groupRef} className="marquee__group">{children}</div>
        <div className="marquee__group">{children}</div>
        <div className="marquee__group">{children}</div>
      </div>
    </div>
  );
}
