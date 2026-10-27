/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ElementType, ReactNode, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { useParallaxY, useScrollZoom } from '../../hooks/useParallax';

const EXPO = [0.16, 1, 0.3, 1] as const;

/** Fade + rise when scrolled into view. Plays once. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'p' | 'li' | 'span' | 'section' | 'article';
}) {
  const M = motion[as] as ElementType;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1, ease: EXPO, delay }}
    >
      {children}
    </M>
  );
}

/**
 * Headline that rises word-by-word from behind a mask.
 * Wrap a word in *asterisks* to set it in the italic serif accent: "Rooms & *villas*".
 */
export function SplitReveal({
  text,
  as = 'h2',
  className = '',
  delay = 0,
  /** When provided, the animation follows this flag instead of scroll-into-view (e.g. the hero waits for the preloader). */
  when,
}: {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  delay?: number;
  when?: boolean;
}) {
  const Tag = motion[as] as ElementType;
  const ref = useRef<HTMLElement>(null);
  // Observe the heading itself. (Observing the word spans would never fire: they start translated
  // out of their own `overflow: hidden` mask, so IntersectionObserver treats them as fully clipped.)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const go = when ?? inView;
  const plain = text.replace(/\*/g, '');
  const tokens = text.split(/(\*[^*]+\*|\s+)/).filter((t) => t && !/^\s+$/.test(t));

  return (
    <Tag ref={ref} className={className} aria-label={plain}>
      {tokens.map((tok, i) => {
        const italic = tok.startsWith('*');
        const word = italic ? tok.slice(1, -1) : tok;
        return (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className={`inline-block will-change-transform ${italic ? 'serif-i pr-[0.06em]' : ''}`}
              initial={{ y: '110%' }}
              animate={{ y: go ? '0%' : '110%' }}
              transition={{ duration: 1.1, ease: EXPO, delay: delay + i * 0.055 }}
            >
              {word}
              {'\u00A0'}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}

/** Wraps media so it drifts vertically (parallax) as it crosses the screen. */
export function Parallax({ children, distance = 80, className = '' }: { children: ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useParallaxY(ref, distance);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/** Clips its children and scales them from `from` → 1 as they scroll into place. */
export function ZoomFrame({ children, from = 1.3, className = '' }: { children: ReactNode; from?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useScrollZoom(ref, from);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ scale }} className="absolute inset-0 origin-center will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
