/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useRef } from 'react';

/**
 * Infinite CSS marquee. The track is the content twice, translated by -50%, so
 * the loop is seamless. It is a pure compositor animation (transform only) and
 * is paused while off-screen so it costs nothing when you can't see it.
 */
export default function Marquee({
  children,
  duration = 40,
  reverse = false,
  className = '',
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (el.dataset.paused = String(!e.isIntersecting)), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`marquee ${className}`} data-reverse={reverse} aria-hidden="true">
      <div className="marquee__track" style={{ ['--_dur' as string]: `${duration}s` }}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center">{children}</div>
      </div>
    </div>
  );
}
