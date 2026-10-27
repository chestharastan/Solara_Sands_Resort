/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Marquee from '../ui/Marquee';

const WORDS = ['Infinity pool', 'Beach club', 'Hydro-spa', "Chef's table", 'Sunset sail', 'Stargazing deck', 'Private villas'];

/** A hot colour band between the dark 3D story and the light suites – Noomo-style kinetic type. */
export default function MarqueeBand() {
  return (
    <section aria-label="Highlights" className="relative overflow-hidden bg-sun py-6 text-ink md:py-10">
      <Marquee duration={55}>
        {WORDS.map((w, i) => (
          <span key={w} className="flex items-center">
            <span className={`display px-6 text-[clamp(2.6rem,9vw,8rem)] md:px-10 ${i % 2 ? 'outline-text' : ''}`}>{w}</span>
            <span className="serif-i text-[clamp(2rem,6vw,5rem)]" aria-hidden>✺</span>
          </span>
        ))}
      </Marquee>
      <Marquee duration={70} reverse className="mt-2 md:mt-4">
        {[...WORDS].reverse().map((w) => (
          <span key={w} className="flex items-center">
            <span className="serif-i px-6 text-[clamp(1.8rem,5vw,4.2rem)] md:px-10">{w}</span>
            <span className="text-[clamp(1rem,2vw,1.6rem)]" aria-hidden>●</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
