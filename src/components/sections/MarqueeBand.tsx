/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Marquee from '../ui/Marquee';

const WORDS = ['Infinity pool', 'Beach club', 'Hydro-spa', "Chef's table", 'Sunset sail', 'Stargazing deck', 'Private villas'];

/**
 * A quiet editorial ticker between the night chapter and the suites: one row, one direction, soft-faded
 * edges, thin hairlines. Words alternate between solid, muted and italic serif for rhythm.
 */
export default function MarqueeBand() {
  return (
    <section aria-label="Highlights" className="relative overflow-hidden border-y hairline bg-ink py-8 md:py-14">
      {/* The ticker is decorative (aria-hidden) – this is the accessible version of its content. */}
      <ul className="sr-only">
        {WORDS.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>

      <Marquee speed={64} className="marquee--fade">
        {WORDS.map((w, i) => (
          <span key={w} className="flex items-baseline gap-4 pr-12 md:gap-6 md:pr-20">
            <span className="eyebrow !text-sun">{String(i + 1).padStart(2, '0')}</span>
            <span
              className={`display text-[clamp(2.4rem,7.2vw,6.25rem)] !font-medium !tracking-[-0.04em] text-sand ${
                i % 3 === 1 ? '!text-sand/40' : i % 3 === 2 ? 'serif-i !font-normal !text-sun' : ''
              }`}
            >
              {w}
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
