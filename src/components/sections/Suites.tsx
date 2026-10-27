/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RefObject, createRef, useMemo, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight, Maximize2, Users } from 'lucide-react';
import type { Amenity, Room } from '../../types';
import { ROOM_SLOT } from '../../content/media';
import { AmenityIcon } from '../../lib/amenityIcons';
import { motionScale } from '../../hooks/useParallax';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MediaSlot from '../ui/MediaSlot';
import { Reveal, SplitReveal, ZoomFrame } from '../ui/Reveal';

/**
 * SUITES – "project cards" (Noomo). On desktop each card is `position: sticky`
 * with a slightly larger `top` than the last, so they pile up like a deck.
 *
 * The "buried" effect (shrink + darken) is driven by the NEXT card's arrival: its progress from
 * entering the viewport to reaching its pinned slot. (A sticky card never moves, so its own scroll
 * progress can't tell us anything while it is stacked.) On phones the cards simply flow – no sticky.
 */
function SuiteCard({
  room,
  index,
  total,
  amenities,
  onReserve,
  wrapRef,
  coverRef,
}: {
  room: Room;
  index: number;
  total: number;
  amenities: Amenity[];
  onReserve: (id: string) => void;
  wrapRef: RefObject<HTMLDivElement | null>;
  /** Wrapper of the card that will slide over this one (undefined for the last card). */
  coverRef?: RefObject<HTMLDivElement | null>;
}) {
  const wide = useMediaQuery('(min-width: 768px)');
  const k = wide && coverRef ? motionScale() : 0;
  // The next card pins at 5.5rem + (index+1) × 1.1rem from the top (see `style.top` below).
  const coverPinPx = Math.round((5.5 + (index + 1) * 1.1) * 16);
  const { scrollYProgress: cover } = useScroll({ target: coverRef ?? wrapRef, offset: ['start end', `start ${coverPinPx}px`] });
  const scale = useTransform(cover, [0, 1], [1, 1 - 0.07 * k]);
  const dim = useTransform(cover, [0, 1], [0, 0.55 * k]);

  // Once the next card has fully slid over this one it is visually buried: take it out of the tab order
  // and hit-testing so keyboard users never land on a control they cannot see.
  const [buried, setBuried] = useState(false);
  useMotionValueEvent(cover, 'change', (v) => {
    const next = wide && Boolean(coverRef) && v > 0.97;
    setBuried((b) => (b === next ? b : next));
  });

  const included = (room.amenities || []).map((id) => amenities.find((a) => a.id === id)).filter(Boolean) as Amenity[];

  return (
    <div
      ref={wrapRef}
      id={`room-${room.id}`}
      className="mb-5 md:sticky md:mb-[10svh]"
      style={wide ? { top: `calc(5.5rem + ${index} * 1.1rem)` } : undefined}
      inert={buried}
    >
      <motion.article style={{ scale }} className="relative grid origin-top overflow-hidden rounded-[1.75rem] bg-ink text-sand md:min-h-[min(76svh,44rem)] md:grid-cols-[1.15fr_1fr] md:rounded-[2.25rem]">
        <ZoomFrame className="min-h-[17rem] md:min-h-full" from={1.25}>
          <MediaSlot
            fill
            src={room.image}
            alt={room.name}
            label={room.name}
            kind={ROOM_SLOT.kind}
            spec={ROOM_SLOT.spec}
            sizes={ROOM_SLOT.sizes}
            tone={index % 2 ? 'sea' : 'sand'}
          />
        </ZoomFrame>

        <div className="flex flex-col gap-8 p-6 md:justify-between md:p-10">
          <div className="flex items-start justify-between gap-4">
            <span className="eyebrow !text-sand/70">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
            <span className="rounded-full bg-sun px-4 py-1.5 font-mono text-[0.72rem] font-medium text-ink">
              ${room.price} <span className="opacity-70">/ night</span>
            </span>
          </div>

          <div>
            <h3 className="display text-[clamp(1.9rem,3.6vw,3.4rem)] !leading-[0.95] !tracking-[-0.04em]">{room.name}</h3>
            <p className="mt-4 max-w-[46ch] text-[0.95rem] leading-relaxed text-sand/75">{room.description}</p>

            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.72rem] uppercase tracking-wider text-sand/80">
              <div className="flex items-center gap-2"><Maximize2 className="h-3.5 w-3.5 text-sun" /> {room.size} m²</div>
              <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-sun" /> Up to {room.capacity} guests</div>
            </dl>

            {included.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Included amenities">
                {included.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center gap-1.5 rounded-full border border-sand/15 px-3 py-1 text-[0.7rem] text-sand/85">
                    <AmenityIcon name={a.icon} className="h-3 w-3 text-sun" /> {a.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={() => onReserve(room.id)} className="btn self-start" id={`book-room-btn-${room.id}`}>
            Reserve this stay
            <span className="btn-arrow"><ArrowUpRight className="h-3.5 w-3.5" /></span>
          </button>
        </div>

        {/* Darkens as the next card covers this one */}
        <motion.div aria-hidden style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-ink" />
      </motion.article>
    </div>
  );
}

export default function Suites({ rooms, amenities, onReserve }: { rooms: Room[]; amenities: Amenity[]; onReserve: (roomId: string) => void }) {
  // One stable ref per card wrapper so each card can observe the arrival of the one after it.
  const wrappers = useMemo(() => rooms.map(() => createRef<HTMLDivElement>()), [rooms.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section id="suites" className="relative bg-paper text-ink" aria-label="Suites and villas">
      <div className="px-[var(--gutter)] pb-10 pt-20 md:pb-16 md:pt-36">
        <div className="mx-auto grid max-w-[110rem] items-end gap-8 md:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-3 !text-ink/60"><span className="h-px w-10 bg-ember" /> 03 — Accommodation</p>
            <SplitReveal text="Rooms & *villas* to arrive in." className="display h-xl" />
          </div>
          <Reveal delay={0.2}>
            <p className="lead max-w-md text-ink/70">
              Organic linen, climate-zoned calm and a horizon in every window. Choose the one that fits the way you want to wake up.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="px-[var(--gutter)] pb-24 md:pb-40">
        <div className="mx-auto max-w-[110rem]">
          {rooms.map((room, i) => (
            <SuiteCard
              key={room.id}
              room={room}
              index={i}
              total={rooms.length}
              amenities={amenities}
              onReserve={onReserve}
              wrapRef={wrappers[i]}
              coverRef={wrappers[i + 1]}
            />
          ))}
          {rooms.length === 0 && <p className="py-20 text-center text-ink/60">Suites are being refreshed – please check back shortly.</p>}
        </div>
      </div>
    </section>
  );
}
