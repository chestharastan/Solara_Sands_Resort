/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Renders `children` only once the placeholder is within `margin` of the viewport (then keeps them).
 * Used for heavy things – a second WebGL context, the Google Maps SDK – so they don't compete with the
 * hero for CPU/GPU/network during first load.
 */
export default function LazyMount({ children, className = '', margin = '500px', fallback }: { children: ReactNode; className?: string; margin?: string; fallback?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || mounted) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, mounted]);

  return (
    <div ref={ref} className={className}>
      {mounted ? children : fallback}
    </div>
  );
}
