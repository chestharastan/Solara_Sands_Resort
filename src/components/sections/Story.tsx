/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import type { Hotel, Review, Room } from '../../types';
import { STORY_VH } from '../../lib/timeline';
import { motionScale } from '../../hooks/useParallax';
import CountUp from '../ui/CountUp';

/**
 * Story – a pinned manifesto. The section is STORY_VH screens tall but its
 * content is `sticky`, so the text stays put while you scroll and each word
 * "lights up" in turn. Behind it the 3D camera is pushing in on the island.
 *
 * Perf note: the word highlight is ONE scroll listener that writes `opacity`
 * to N spans directly – no React state, no layout reads.
 */
const STATEMENT =
  'A private shore where the only *schedule* is the sun. Wake to first light on the water, swim until the *lanterns* come on, and let the *tide* set the menu.';

export default function Story({ hotel, rooms, reviews }: { hotel: Hotel; rooms: Room[]; reviews: Review[] }) {
  const ref = useRef<HTMLElement>(null);
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  const k = motionScale();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const tokens = STATEMENT.split(' ').map((w) => ({ italic: /^\*.*\*[.,]?$/.test(w), text: w.replace(/\*/g, '') }));

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const a = 0.05;
    const b = 0.62;
    const n = wordRefs.current.length;
    wordRefs.current.forEach((el, i) => {
      if (!el) return;
      const t = Math.min(1, Math.max(0, ((v - a) / (b - a)) * n - i));
      el.style.opacity = String(0.16 + 0.84 * t);
    });
  });

  // The whole block drifts toward the viewer (zoom) and fades out at the end of the pin.
  const scale = useTransform(scrollYProgress, [0, 1], [1 - 0.06 * k, 1 + 0.08 * k]);
  const fade = useTransform(scrollYProgress, [0, 0.08, 0.9, 1], [0, 1, 1, 0]);
  const detailOpacity = useTransform(scrollYProgress, [0.5, 0.66], [0, 1]);
  const detailY = useTransform(scrollYProgress, [0.5, 0.66], [30 * k, 0]);

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <section id="story" ref={ref} className="relative" style={{ height: `${STORY_VH * 100}svh` }} aria-label="About the resort">
      <motion.div style={{ opacity: fade }} className="sticky top-0 flex h-[100svh] items-start px-[var(--gutter)] pt-[16svh] md:pt-[20svh]">
        <motion.div style={{ scale }} className="relative mx-auto w-full max-w-[84rem] origin-top will-change-transform">
          {/* Soft local scrim: keeps the statement legible wherever the 3D scene is bright. */}
          <div aria-hidden className="pointer-events-none absolute -inset-x-[6%] -inset-y-[18%] -z-10 bg-[radial-gradient(70%_60%_at_35%_45%,rgba(7,12,17,0.55),transparent_75%)]" />
          <p className="eyebrow mb-6 flex items-center gap-3 !text-sand/80 md:mb-10">
            <span className="h-px w-10 bg-sun" /> 01 — The idea
          </p>

          <p className="text-[clamp(1.75rem,5.2vw,5rem)] font-medium leading-[1.06] tracking-[-0.035em] [text-shadow:0_2px_30px_rgba(7,12,17,0.45)]">
            {tokens.map((t, i) => (
              <span
                key={i}
                ref={(el) => {
                  if (el) wordRefs.current[i] = el;
                }}
                className={t.italic ? 'serif-i text-sun' : ''}
                style={{ opacity: 0.16 }}
              >
                {t.text}{' '}
              </span>
            ))}
          </p>

          <motion.div style={{ opacity: detailOpacity, y: detailY }} className="mt-8 grid gap-8 md:mt-14 md:grid-cols-[1.3fr_1fr] md:gap-16">
            <p className="lead max-w-xl text-sand/85">{hotel.description}</p>
            <dl className="grid grid-cols-3 gap-4 border-t hairline pt-5">
              <div>
                <dt className="eyebrow">Suites &amp; villas</dt>
                <dd className="display mt-2 text-[clamp(2rem,4vw,3.4rem)]"><CountUp value={rooms.length} /></dd>
              </div>
              <div>
                <dt className="eyebrow">Guest rating</dt>
                <dd className="display mt-2 text-[clamp(2rem,4vw,3.4rem)]"><CountUp value={avg} decimals={1} /></dd>
              </div>
              <div>
                <dt className="eyebrow">Concierge</dt>
                <dd className="display mt-2 text-[clamp(2rem,4vw,3.4rem)]">24<span className="serif-i text-sun">/7</span></dd>
              </div>
            </dl>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
