/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { CHAPTERS_VH, CHAPTER_COUNT, chapterCenter } from '../../lib/timeline';
import { scrollToY } from '../../lib/scroll';
import { MEDIA, type MediaSpec } from '../../content/media';
import { useActiveChapter } from '../../hooks/useActiveChapter';
import ClockReadout from '../scene/ClockReadout';
import MediaSlot from '../ui/MediaSlot';

/**
 * A DAY AT SOLARA (Persepolis-style chaptered storytelling)
 * The stage is pinned for CHAPTERS_VH screens. Scrolling moves the sun across
 * the 3D sky and swaps the chapter card; clicking the rail jumps the camera to
 * that moment of the day. Edit the copy/media here – nothing else is coupled.
 */
interface Chapter {
  phase: string;
  /** Compact label for the phone rail. */
  short: string;
  clock: string;
  title: string;
  copy: string;
  facts: string[];
  media: MediaSpec;
}

const CHAPTERS: Chapter[] = [
  {
    phase: 'Morning',
    short: 'Morning',
    clock: '08:00',
    title: 'First light, *slow* water.',
    copy: 'Breakfast on the terrace with the lagoon at your feet. Paddle out before the heat, or do nothing at all.',
    facts: ['Terrace breakfast', 'Sunrise yoga', 'Kayaks & paddleboards'],
    media: MEDIA.chapterMorning,
  },
  {
    phase: 'Midday',
    short: 'Midday',
    clock: '12:30',
    title: 'Salt, sun and nothing *urgent.*',
    copy: 'Drift in the infinity pool, take the shade at the beach club, or let the spa work out the rest.',
    facts: ['Infinity pool', 'Beach club', 'Hydro-spa'],
    media: MEDIA.chapterMidday,
  },
  {
    phase: 'Golden hour',
    short: 'Golden',
    clock: '18:10',
    title: 'The sky does the *programming.*',
    copy: 'Climb to the rooftop lounge, or slip out on the evening sail as the whole horizon turns copper.',
    facts: ['Sunset sail 17:30', 'Rooftop lounge', 'Acoustic sets'],
    media: MEDIA.chapterGolden,
  },
  {
    phase: 'Moonlight',
    short: 'Night',
    clock: '21:45',
    title: 'Lanterns on. *Tide* in.',
    copy: 'A chef’s tasting menu at the water’s edge, then stars with nothing between you and them.',
    facts: ["Chef's table", 'Stargazing deck', '24h butler'],
    media: MEDIA.chapterNight,
  },
];

/** Renders `*word*` as italic serif accent. */
const Accent = ({ text }: { text: string }) => (
  <>
    {text.split(/(\*[^*]+\*)/).map((p, i) =>
      p.startsWith('*') ? <span key={i} className="serif-i text-sun">{p.slice(1, -1)}</span> : <span key={i}>{p}</span>,
    )}
  </>
);

export default function Chapters() {
  const active = useActiveChapter();
  const i = Math.max(0, active);
  const ch = CHAPTERS[i];

  const jump = (n: number) => {
    const zone = document.getElementById('scene-zone');
    if (!zone) return;
    const top = zone.getBoundingClientRect().top + window.scrollY;
    const travel = zone.offsetHeight - window.innerHeight;
    scrollToY(top + chapterCenter(n) * travel);
  };

  return (
    <section id="chapters" className="relative" style={{ height: `${CHAPTERS_VH * 100}svh` }} aria-label="A day at Solara">
      <div className="sticky top-0 h-[100svh] overflow-hidden px-[var(--gutter)] pt-24 md:pt-28">
        {/* Left: clock + phase */}
        <div className="pointer-events-none absolute left-[var(--gutter)] top-[8.4rem] [text-shadow:0_1px_14px_rgba(7,12,17,0.6)] md:top-28">
          <p className="eyebrow mb-3 hidden items-center gap-3 !text-sand md:flex"><span className="h-px w-10 bg-sun" /> 02 — A day at Solara</p>
          <ClockReadout
            className="flex flex-col"
            timeClass="display text-[clamp(2.8rem,8.5vw,7.5rem)] leading-[0.85] [text-shadow:0_2px_40px_rgba(7,12,17,0.4)]"
            phaseClass="serif-i mt-1 text-[clamp(1.3rem,2.6vw,2.2rem)] text-sun [text-shadow:0_1px_4px_rgba(7,12,17,0.9),0_0_22px_rgba(7,12,17,0.7)]"
          />
        </div>

        {/* Rail */}
        <ol className="absolute left-1/2 top-[5.4rem] z-10 flex -translate-x-1/2 gap-1.5 md:left-[var(--gutter)] md:top-auto md:bottom-10 md:translate-x-0" aria-label="Chapters">
          {CHAPTERS.map((c, n) => (
            <li key={c.phase}>
              <button
                onClick={() => jump(n)}
                aria-current={n === active ? 'step' : undefined}
                className={`glass rounded-full px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] transition-colors md:px-4 md:py-2 md:text-[0.68rem] ${n === active ? '!bg-sun !text-ink' : 'text-sand/80 hover:text-sand'}`}
              >
                <span className="md:hidden">{c.short}</span>
                <span className="max-md:hidden">{c.phase}</span>
              </button>
            </li>
          ))}
        </ol>

        {/* Card */}
        <div className="absolute inset-x-[var(--gutter)] bottom-4 md:inset-x-auto md:right-[var(--gutter)] md:bottom-auto md:top-1/2 md:w-[min(27rem,34vw)] md:-translate-y-1/2">
          <AnimatePresence mode="wait">
            <motion.article
              key={ch.phase}
              className="glass rounded-[1.75rem] p-3 md:p-4"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.98 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="overflow-hidden rounded-[1.25rem]">
                <MediaSlot {...ch.media} ratio="16 / 8" className="md:!aspect-[3/2]" />
              </div>
              <div className="px-2 pb-2 pt-4 md:px-3">
                <p className="eyebrow !text-sand/70">
                  {String(i + 1).padStart(2, '0')} / {String(CHAPTER_COUNT).padStart(2, '0')} · {ch.phase} · {ch.clock}
                </p>
                <h3 className="display mt-2 text-[clamp(1.4rem,2.4vw,2.1rem)] !leading-[1] !tracking-[-0.035em] normal-case"><Accent text={ch.title} /></h3>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-sand/80">{ch.copy}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {ch.facts.map((f) => (
                    <li key={f} className="rounded-full border border-sand/20 px-3 py-1 text-[0.68rem] font-medium tracking-wide text-sand/90">{f}</li>
                  ))}
                </ul>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
