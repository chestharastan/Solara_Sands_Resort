/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import type { Hotel } from '../../types';
import { HERO_VH } from '../../lib/timeline';
import { motionScale } from '../../hooks/useParallax';
import { SplitReveal } from '../ui/Reveal';
import ClockReadout from '../scene/ClockReadout';

/**
 * Hero – transparent, so the live 3D sunrise shows through.
 * Scrolling away "zooms" the headline towards the viewer while it fades, which
 * sells the camera push-in happening in the WebGL scene behind it.
 */
export default function Hero({ hotel, loaded, onReserve, onExplore }: { hotel: Hotel; loaded: boolean; onReserve: () => void; onExplore: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const k = motionScale();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1 + 0.35 * k]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 140 * k]);

  // "Solara Sands Resort" → big "Solara Sands" + serif "Resort"
  const m = hotel.name.match(/^(.*?)\s+(resort|hotel|villas?|lodge)$/i);
  const title = m ? m[1] : hotel.name;
  const suffix = m ? m[2] : '';
  const place = hotel.address.split(',').slice(0, 2).join(' · ');

  return (
    <section id="home" ref={ref} className="relative [overflow:clip]" style={{ height: `${HERO_VH * 100}svh` }} aria-label="Welcome">
      <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col px-[var(--gutter)] pb-5 pt-24 md:pb-7 md:pt-28">
        {/* HUD row – sits in the sky */}
        <motion.div
          className="flex items-start justify-between gap-6 [text-shadow:0_1px_12px_rgba(7,12,17,0.5)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          <p className="eyebrow min-w-0 truncate !text-sand">{suffix && <span className="max-sm:hidden">{suffix} — </span>}{place}</p>
          <ClockReadout className="eyebrow flex shrink-0 items-center gap-3 !text-sand" timeClass="!text-sand" phaseClass="!text-sun" />
        </motion.div>

        {/* Everything else lives in the lower "sea" band so the sun and the island stay clear. */}
        <motion.div style={{ scale }} className="mt-auto origin-bottom-left will-change-transform">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <SplitReveal
              as="h1"
              when={loaded}
              delay={0.15}
              text={title}
              className="display hero-title text-sand"
            />

            <motion.div
              className="flex flex-col gap-5 lg:shrink-0 lg:items-end lg:pb-[0.9vw] lg:text-right"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 30 }}
              transition={{ delay: 0.9, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="serif-i max-w-[28ch] text-[clamp(1.2rem,1.7vw,1.7rem)] leading-[1.1] text-sand [text-shadow:0_1px_18px_rgba(7,12,17,0.55)]">{hotel.tagline}</p>
              <div className="flex flex-wrap gap-2.5 lg:flex-nowrap lg:justify-end">
                <button onClick={onReserve} className="btn">
                  Reserve a stay
                  <span className="btn-arrow"><ArrowUpRight className="h-3.5 w-3.5" /></span>
                </button>
                <button onClick={onExplore} className="btn btn--ghost">
                  <span className="sm:hidden">Explore</span>
                  <span className="max-sm:hidden">Explore the island</span>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer row */}
        <motion.div
          className="mt-4 flex items-end justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ delay: 1.3, duration: 1 }}
        >
          <span className="eyebrow flex items-center gap-3 !text-sand/85">
            <span className="scroll-cue" aria-hidden /> Scroll to travel through the day
          </span>
          <span className="eyebrow hidden items-center gap-2 !text-sand/85 sm:flex"><ArrowDown className="h-3.5 w-3.5" aria-hidden /> 01 / 09</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
