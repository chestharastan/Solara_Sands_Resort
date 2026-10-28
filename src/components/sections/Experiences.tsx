/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { Amenity } from '../../types';
import { MEDIA, type MediaSpec } from '../../content/media';
import { AmenityIcon } from '../../lib/amenityIcons';
import { useParallaxY } from '../../hooks/useParallax';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Marquee from '../ui/Marquee';
import MediaSlot from '../ui/MediaSlot';
import { Parallax, Reveal, SplitReveal, ZoomFrame } from '../ui/Reveal';

/**
 * EXPERIENCES – depth through parallax.
 * The three feature columns scroll at different speeds (like layers at different
 * distances – the Simply Chocolate / Noomo editorial look). Phones get a plain,
 * single-column flow with no scroll-linked motion.
 */
interface Feature {
  n: string;
  title: string;
  copy: string;
  points: string[];
  media: MediaSpec;
  /** Parallax travel in px; different per column = depth. */
  depth: number;
}

const FEATURES: Feature[] = [
  {
    n: '01',
    title: 'Water & wellness',
    copy: 'An infinity pool that melts into the sea, a hydro-spa for slow afternoons and decks made for doing very little.',
    points: ['Open-air heated infinity pool', 'Cardio studio with Technogym', 'Saltwater hydro-spa baths', 'Ocean meditation decks'],
    media: MEDIA.expWellness,
    depth: 40,
  },
  {
    n: '02',
    title: 'Dining',
    copy: 'Seasonal tasting menus built around local organic farms, with a wine list worth the detour.',
    points: ['Chef-led cliffside restaurant', 'Sunset whiskey lounge', 'Sea-spray terrace breakfast', 'In-room fine dining'],
    media: MEDIA.expDining,
    depth: 110,
  },
  {
    n: '03',
    title: 'Journeys & concierge',
    copy: 'From valet and airport transfers to chartered sea transport – our stewards handle the details.',
    points: ['Complimentary airport transfer', 'Express organic laundry', '24-hour guest butler', 'Excursion maps & tickets'],
    media: MEDIA.expJourneys,
    depth: 70,
  },
];

function FeatureCard({ f, wide }: { f: Feature; wide: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const y = useParallaxY(ref, wide ? f.depth : 0);
  return (
    <motion.article ref={ref} style={{ y }} className="will-change-transform">
      <ZoomFrame className="aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem]" from={1.22}>
        <MediaSlot fill {...f.media} />
      </ZoomFrame>
      <div className="mt-6">
        <p className="eyebrow !text-sun">{f.n}</p>
        <h3 className="display mt-2 text-[clamp(1.7rem,2.8vw,2.6rem)] !leading-[0.95]">{f.title}</h3>
        <p className="mt-3 max-w-[40ch] text-[0.95rem] leading-relaxed text-sand/70">{f.copy}</p>
        <ul className="mt-5 grid gap-2 text-[0.85rem] text-sand/85">
          {f.points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 border-b hairline pb-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-sun" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export default function Experiences({ amenities }: { amenities: Amenity[] }) {
  const wide = useMediaQuery('(min-width: 768px)');
  return (
    <section id="experiences" className="relative overflow-hidden bg-ink-2 py-24 text-sand md:py-40" aria-label="Experiences">
      <div className="px-[var(--gutter)]">
        <div className="mx-auto grid max-w-[110rem] gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-10 bg-sun" /> 04 — Experiences</p>
            <SplitReveal text="Everything within reach of the *water.*" className="display h-lg" />
            <Reveal delay={0.2}>
              <p className="lead mt-8 max-w-xl text-sand/70">
                Active or entirely still – a considered mix of physical and visual wellness, looked after by a concierge team that never really sleeps.
              </p>
            </Reveal>
          </div>
          <div className="relative hidden min-h-[38rem] md:col-span-5 md:block">
            <Parallax distance={50} className="absolute right-0 top-0 w-[58%]">
              <MediaSlot {...MEDIA.storyA} ratio="4 / 5" className="rounded-[1.75rem]" />
            </Parallax>
            <Parallax distance={110} className="absolute bottom-[-30%] left-0 w-[62%]">
              <MediaSlot {...MEDIA.storyB} ratio="16 / 10" className="rounded-[1.75rem]" />
            </Parallax>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-[110rem] gap-14 md:mt-44 md:grid-cols-3 md:gap-8 lg:gap-12">
          {FEATURES.map((f) => (
            <FeatureCard key={f.n} f={f} wide={wide} />
          ))}
        </div>
      </div>

      {/* Amenity ticker – driven by the amenities list, so Staff Portal edits appear here */}
      {amenities.length > 0 && (
        <div className="mt-24 border-y hairline py-5 md:mt-40">
          <Marquee speed={50}>
            {amenities.map((a) => (
              <span key={a.id} className="flex items-center gap-3 px-8 text-[clamp(1.1rem,2vw,1.6rem)]">
                <AmenityIcon name={a.icon} className="h-5 w-5 text-sun" /> {a.name}
                <span className="serif-i pl-8 text-sand/30" aria-hidden>✺</span>
              </span>
            ))}
          </Marquee>
        </div>
      )}
    </section>
  );
}
