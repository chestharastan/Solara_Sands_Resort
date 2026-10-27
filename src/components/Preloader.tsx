/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { getDevice } from '../lib/device';
import { lockScroll } from '../lib/scroll';

/**
 * Intro curtain. A sun climbs over a horizon line while a counter runs to 100.
 *
 * `ready` flips true once the 3D chunk has compiled its shaders and fonts are
 * loaded; until then the counter eases towards ~92% and waits (so it never lies
 * about being finished). A minimum on-screen time avoids a distracting flash on
 * fast connections. All per-frame work writes to the DOM directly (no React state).
 */
export default function Preloader({ name, ready, onReveal }: { name: string; ready: boolean; onReveal: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;

  useEffect(() => {
    lockScroll(true);
    const reduced = getDevice().reducedMotion;
    const min = reduced ? 0.2 : 1.2;
    const t0 = performance.now();
    let last = t0;
    let shown = 0;
    let raf = 0;
    let done = false;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      const target = readyRef.current && t >= min ? 100 : Math.min(92, 92 * (1 - Math.exp(-t * 1.2)));
      shown += (target - shown) * (1 - Math.exp(-dt * (target === 100 ? 9 : 4)));
      if (numRef.current) numRef.current.textContent = String(Math.min(100, Math.round(shown)));
      rootRef.current?.style.setProperty('--p', shown.toFixed(2));
      if (shown > 99.3 && !done) {
        done = true;
        revealRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Never trap the visitor: reveal after 9s even if something hangs.
    const safety = window.setTimeout(() => {
      if (!done) {
        done = true;
        cancelAnimationFrame(raf);
        revealRef.current();
      }
    }, 9000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      lockScroll(false);
    };
  }, []);

  return (
    <motion.div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-ink px-[var(--gutter)] py-6 text-sand"
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1] }}
      style={{ ['--p' as string]: 0 }}
    >
      <div className="flex items-start justify-between">
        <span className="eyebrow !text-sand">{name}</span>
        <span className="eyebrow">Preparing the shoreline</span>
      </div>

      {/* Sun rising over a horizon */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[22%] mx-auto h-[34vmin] w-[34vmin] overflow-hidden" aria-hidden>
        <div
          className="mx-auto mt-[4vmin] h-[26vmin] w-[26vmin] rounded-full bg-gradient-to-b from-sun to-ember shadow-[0_0_80px_20px_rgba(255,130,70,0.35)]"
          style={{ transform: 'translateY(calc((1 - var(--p) / 100) * 115%))' }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-[22%] h-px bg-sand/25" aria-hidden />

      <div className="flex items-end justify-between gap-6">
        <div className="display text-[clamp(5rem,26vw,16rem)] leading-[0.8] tabular-nums">
          <span ref={numRef}>0</span>
          <span className="serif-i text-[0.35em] text-sun">%</span>
        </div>
        <p className="serif-i mb-2 hidden max-w-[16ch] text-right text-2xl text-sand/80 sm:block">Barefoot luxury on a private shore.</p>
      </div>
    </motion.div>
  );
}
