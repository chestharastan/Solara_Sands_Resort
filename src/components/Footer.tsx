/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUp, KeyRound } from 'lucide-react';
import type { Hotel } from '../types';
import { motionScale } from '../hooks/useParallax';
import type { NavLink } from './MenuOverlay';

/** Footer with an oversized wordmark that rises into place as it scrolls into view. */
export default function Footer({ hotel, links, onNavigate, onTop, onStaff }: { hotel: Hotel; links: NavLink[]; onNavigate: (id: string) => void; onTop: () => void; onStaff: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const k = motionScale();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 1], [`${40 * k}%`, '0%']);
  const title = hotel.name.replace(/\s+(resort|hotel)$/i, '');

  return (
    <footer ref={ref} className="relative overflow-hidden bg-paper text-ink" aria-label="Site footer">
      <div className="px-[var(--gutter)] pt-20 md:pt-32">
        <div className="mx-auto grid max-w-[110rem] gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="serif-i max-w-[16ch] text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.05]">{hotel.tagline}</p>
          </div>

          <div className="grid gap-10 text-sm sm:grid-cols-3 md:col-span-7">
            <div>
              <h2 className="eyebrow mb-4 !text-ink/50">Find us</h2>
              <address className="not-italic leading-relaxed text-ink/80">
                {hotel.address}
                <br />
                <a href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`} className="mt-2 inline-block font-semibold hover:text-ember">{hotel.phone}</a>
                <br />
                <a href={`mailto:${hotel.email}`} className="break-all hover:text-ember">{hotel.email}</a>
              </address>
            </div>
            <div>
              <h2 className="eyebrow mb-4 !text-ink/50">Explore</h2>
              <ul className="grid gap-2">
                {links.slice(0, 6).map((l) => (
                  <li key={l.id}><button onClick={() => onNavigate(l.id)} className="text-left text-ink/80 transition-colors hover:text-ember">{l.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="eyebrow mb-4 !text-ink/50">Assurance</h2>
              <p className="leading-relaxed text-ink/70">Confidential bookings, certified sanitation, valet and airport transfers – handled quietly.</p>
            </div>
          </div>
        </div>

        <motion.div style={{ y }} className="pointer-events-none mt-16 select-none overflow-hidden md:mt-24" aria-hidden>
          <p className="display whitespace-nowrap text-center text-[clamp(3rem,13.4vw,19rem)] !leading-[0.8] text-ink">{title}</p>
        </motion.div>
      </div>

      <div className="border-t border-ink/15 px-[var(--gutter)] py-5">
        <div className="mx-auto flex max-w-[110rem] flex-col items-center justify-between gap-3 text-[0.72rem] text-ink/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {hotel.name}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <button onClick={onStaff} className="flex items-center gap-1.5 hover:text-ink"><KeyRound className="h-3 w-3" /> Staff portal</button>
            <button onClick={onTop} className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.1em] hover:text-ember">Back to top <ArrowUp className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    </footer>
  );
}
