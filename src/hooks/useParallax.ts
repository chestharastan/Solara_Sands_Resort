/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RefObject } from 'react';
import { MotionValue, useScroll, useTransform } from 'motion/react';
import { getDevice } from '../lib/device';

/**
 * Scroll-linked parallax & zoom helpers (built on Motion's `useScroll`).
 *
 * They return Motion *values*, not React state, so scrolling never triggers a
 * re-render – Motion writes the transform straight to the element. Distances
 * are scaled down on touch/weak devices and disabled for reduced motion.
 */

/** 1 on capable desktops, less on phones/weak GPUs, 0 for reduced motion. */
export function motionScale(): number {
  const d = getDevice();
  if (d.reducedMotion) return 0;
  if (d.tier === 'low') return 0.35;
  return d.isTouch ? 0.6 : 1;
}

/**
 * Vertical parallax: the element drifts from +distance to −distance px while it
 * crosses the viewport. Use different distances for neighbours to create depth.
 */
export function useParallaxY(ref: RefObject<HTMLElement | null>, distance = 80): MotionValue<number> {
  const k = motionScale();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  return useTransform(scrollYProgress, [0, 1], [distance * k, -distance * k]);
}

/**
 * Zoom reveal: content starts scaled up and settles to 1 as it reaches the middle
 * of the viewport – the classic "zoom out into place" entrance for media.
 */
export function useScrollZoom(ref: RefObject<HTMLElement | null>, from = 1.3): MotionValue<number> {
  const k = motionScale();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  return useTransform(scrollYProgress, [0, 1], [1 + (from - 1) * k, 1]);
}
