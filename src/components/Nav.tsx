/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

/** Floating glass capsule. Slides away while reading downwards, returns on any upward scroll. */
export default function Nav({
  name,
  loaded,
  menuOpen,
  onToggleMenu,
  onHome,
  onReserve,
}: {
  name: string;
  loaded: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onHome: () => void;
  onReserve: () => void;
}) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    if (y < 120) setHidden(false);
    else if (y > prev + 4) setHidden(true);
    else if (y < prev - 4) setHidden(false);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-[70] px-[var(--gutter)] pt-3 md:pt-5"
      initial={{ y: -120, opacity: 0 }}
      animate={{ y: loaded && (!hidden || menuOpen) ? 0 : -120, opacity: loaded ? 1 : 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav aria-label="Primary" className="glass mx-auto flex max-w-[110rem] items-center justify-between rounded-full py-2 pl-2 pr-2 md:pl-3">
        <button onClick={onHome} aria-label={`${name} – back to top`} className="flex items-center gap-2.5 rounded-full pr-3 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sun to-ember text-ink" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="13" r="4.2" />
              <path d="M12 3v2.4M4.6 6.6l1.7 1.7M19.4 6.6l-1.7 1.7M2.5 13h2.4M19.1 13h2.4M3 20h18" />
            </svg>
          </span>
          <span className="leading-none max-[439px]:hidden">
            <span className="block whitespace-nowrap text-[0.78rem] font-semibold uppercase tracking-[0.12em] sm:hidden">{name.replace(/\s+(resort|hotel)$/i, '')}</span>
            <span className="hidden whitespace-nowrap text-[0.8rem] font-semibold uppercase tracking-[0.12em] sm:block">{name}</span>
            <span className="eyebrow mt-1 hidden sm:block">Private shore · Est. 2026</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button onClick={onReserve} className="btn !gap-2 !px-4 !py-2.5 !text-[0.72rem]">
            Reserve
            <span className="btn-arrow hidden !h-5 !w-5 sm:inline-grid">
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </button>
          <button
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className="flex items-center gap-2.5 rounded-full border border-sand/20 px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-sand hover:text-ink"
          >
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
            <span className="relative block h-2.5 w-4" aria-hidden>
              <span className={`absolute left-0 h-px w-full bg-current transition-all duration-500 ${menuOpen ? 'top-1/2 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 h-px w-full bg-current transition-all duration-500 ${menuOpen ? 'top-1/2 -rotate-45' : 'bottom-0'}`} />
            </span>
          </button>
        </div>
      </nav>
    </motion.header>
  );
}
