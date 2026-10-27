/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryItem } from '../../types';
import { GALLERY_SLOT } from '../../content/media';
import { lockScroll } from '../../lib/scroll';
import MediaSlot from '../ui/MediaSlot';
import { Reveal, SplitReveal } from '../ui/Reveal';

const CATEGORIES = ['All', 'Rooms', 'Lobby', 'Pool', 'Restaurant', 'Exterior'] as const;

/**
 * Bento spans repeat every 6 tiles. On the 4-column desktop grid one cycle fills a 4×3 block exactly
 * (4+1+2+1+2+2 = 12 cells), so a multiple of 6 photos leaves no holes. `grid-flow-dense` back-fills any
 * gaps when staff add or remove photos.
 */
const SPANS = ['col-span-2 row-span-2', '', 'row-span-2', '', 'col-span-2', 'col-span-2'];

/**
 * GALLERY – filterable bento mosaic. Tiles "zoom in" as they scroll into view
 * (scale + clip), hover zooms the photo, and a click opens a lightbox that zooms
 * up from the centre. Arrow keys / swipe-free buttons navigate, Esc closes.
 */
export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');
  const [open, setOpen] = useState<number | null>(null);
  const list = useMemo(() => (cat === 'All' ? items : items.filter((i) => i.category === cat)), [items, cat]);

  const slotProps = (item: GalleryItem, i: number) => ({
    src: item.image_url,
    alt: `${item.category} at the resort`,
    label: `${item.category} · ${String(i + 1).padStart(2, '0')}`,
    spec: GALLERY_SLOT.spec,
    sizes: GALLERY_SLOT.sizes,
    kind: GALLERY_SLOT.kind,
    tone: GALLERY_SLOT.tones[i % GALLERY_SLOT.tones.length],
  });

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + list.length) % list.length)), [list.length]);

  return (
    <section id="gallery" className="bg-ink px-[var(--gutter)] py-24 md:py-40" aria-label="Gallery">
      <div className="mx-auto max-w-[110rem]">
        <div className="mb-10 grid items-end gap-6 md:mb-14 md:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-10 bg-sun" /> 06 — Gallery</p>
            <SplitReveal text="Moments, *slowed* down." className="display h-lg" />
          </div>
          <Reveal delay={0.2} className="md:justify-self-end">
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter photos">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  id={`gallery-filter-${c}`}
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] transition-colors ${cat === c ? 'border-sun bg-sun text-ink' : 'border-sand/20 text-sand/80 hover:border-sand/50'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <motion.ul layout className="grid grid-flow-dense auto-rows-[9.5rem] grid-cols-2 gap-2.5 sm:auto-rows-[12rem] md:grid-cols-4 md:auto-rows-[13rem] md:gap-4 lg:auto-rows-[16rem]">
          <AnimatePresence mode="popLayout">
            {list.map((item, i) => (
              <motion.li
                key={item.id}
                layout
                className={SPANS[i % SPANS.length]}
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: (i % 4) * 0.06 }}
              >
                <button
                  onClick={() => setOpen(i)}
                  aria-label={`Open ${item.category} photo ${i + 1}`}
                  className="group relative block h-full w-full overflow-hidden rounded-[1.1rem] md:rounded-[1.5rem]"
                >
                  <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-expo)] group-hover:scale-[1.08]">
                    <MediaSlot fill {...slotProps(item, i)} />
                  </div>
                  <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-widest text-sand opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {item.category}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        {list.length === 0 && <p className="py-16 text-center text-sand/60">No photos in this category yet.</p>}
      </div>

      <Lightbox items={list} index={open} slotProps={slotProps} onClose={close} onStep={step} />
    </section>
  );
}

function Lightbox({
  items,
  index,
  slotProps,
  onClose,
  onStep,
}: {
  items: GalleryItem[];
  index: number | null;
  slotProps: (item: GalleryItem, i: number) => React.ComponentProps<typeof MediaSlot>;
  onClose: () => void;
  onStep: (d: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = index !== null && items[index] !== undefined;

  useEffect(() => {
    if (!isOpen) return;
    lockScroll(true);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [isOpen, onClose, onStep]);

  return (
    <AnimatePresence>
      {isOpen && index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[80] grid place-items-center bg-ink/92 p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            key={items[index].id}
            className="relative aspect-[4/3] max-h-[84svh] w-full max-w-5xl overflow-hidden rounded-[1.5rem]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <MediaSlot fill {...slotProps(items[index], index)} sizes="(min-width: 1024px) 64rem, 95vw" />
          </motion.div>

          <button ref={closeRef} onClick={onClose} aria-label="Close viewer" className="glass absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full md:right-8 md:top-8">
            <X className="h-5 w-5" />
          </button>
          {items.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onStep(-1); }} aria-label="Previous photo" className="glass absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full md:left-8">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onStep(1); }} aria-label="Next photo" className="glass absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full md:right-8">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <p className="eyebrow absolute bottom-5 left-1/2 -translate-x-1/2 !text-sand/70">{index + 1} / {items.length}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
