/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, KeyRound, Mail, MapPin, Phone } from 'lucide-react';
import type { Hotel } from '../types';
import { lockScroll } from '../lib/scroll';

export interface NavLink {
  id: string;
  label: string;
}

const EXPO = [0.16, 1, 0.3, 1] as const;

/** Full-screen menu: large numbered links that rise in sequence (Noomo-style). */
export default function MenuOverlay({
  open,
  links,
  hotel,
  onClose,
  onNavigate,
  onStaff,
}: {
  open: boolean;
  links: NavLink[];
  hotel: Hotel;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onStaff: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Freeze the page behind the menu, close on Escape, move focus inside.
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-[65] overflow-y-auto bg-ink text-sand"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          data-lenis-prevent
        >
          <div className="mx-auto flex min-h-full max-w-[110rem] flex-col px-[var(--gutter)] pb-8 pt-28 md:pt-36">
            <button ref={closeRef} onClick={onClose} className="sr-only">
              Close menu
            </button>

            <ul className="grid flex-1 content-start gap-x-16 md:grid-cols-2">
              {links.map((l, i) => (
                <motion.li
                  key={l.id}
                  className="border-b hairline"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.35 + i * 0.05, duration: 0.9, ease: EXPO } }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <button onClick={() => onNavigate(l.id)} className="group flex w-full items-baseline gap-4 py-3.5 text-left md:py-5">
                    <span className="eyebrow w-7 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="display text-[clamp(1.7rem,4.4vw,3.6rem)] transition-all duration-500 group-hover:translate-x-3 group-hover:text-sun">{l.label}</span>
                    <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 -translate-x-2 text-sun opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                  </button>
                </motion.li>
              ))}
            </ul>

            <motion.div
              className="mt-10 grid gap-6 border-t hairline pt-6 text-sm text-sand/80 md:grid-cols-[1fr_auto] md:items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.8, duration: 0.8 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <div className="grid gap-2 sm:grid-cols-3 sm:gap-8">
                <span className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sun" />{hotel.address}</span>
                <a href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-2 hover:text-sun"><Phone className="h-4 w-4 text-sun" />{hotel.phone}</a>
                <a href={`mailto:${hotel.email}`} className="flex items-center gap-2 break-all hover:text-sun"><Mail className="h-4 w-4 shrink-0 text-sun" />{hotel.email}</a>
              </div>
              <button onClick={onStaff} className="inline-flex items-center gap-2 justify-self-start rounded-full border border-sand/20 px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] hover:bg-sand hover:text-ink md:justify-self-end">
                <KeyRound className="h-3.5 w-3.5" /> Staff portal
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
