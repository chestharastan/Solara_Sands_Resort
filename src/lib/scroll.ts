/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Lenis from 'lenis';
import { getDevice } from './device';

/**
 * Smooth scrolling (Lenis) + a few helpers so the rest of the app never touches
 * `window.scrollTo` directly (which would fight the smoothing).
 *
 * Lenis only eases wheel/trackpad input. Touch scrolling stays native, which is
 * what you want on phones: native momentum, no jank, no hijacked gestures.
 * It is skipped entirely when the visitor prefers reduced motion.
 */

let lenis: Lenis | null = null;
let wake: () => void = () => {};

/**
 * Lenis normally runs its own requestAnimationFrame loop forever (~60 wake-ups/s even when nothing moves,
 * which costs battery). We drive it ourselves instead: the loop starts on any scroll-ish input and stops
 * ~0.9s after the page has settled.
 */
export function initSmoothScroll(): () => void {
  if (getDevice().reducedMotion) return () => {};
  const instance = new Lenis({
    autoRaf: false,
    lerp: 0.1,
    wheelMultiplier: 0.95,
    // Touch stays native (default); nested scrollers opt out with data-lenis-prevent.
  });
  lenis = instance;

  let raf = 0;
  let running = false;
  let lastWake = 0;
  const loop = (t: number) => {
    instance.raf(t);
    if (instance.isScrolling || performance.now() - lastWake < 900) raf = requestAnimationFrame(loop);
    else running = false;
  };
  wake = () => {
    lastWake = performance.now();
    if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  };

  const events = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown', 'scroll', 'resize'] as const;
  events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
  wake();

  return () => {
    events.forEach((e) => window.removeEventListener(e, wake));
    cancelAnimationFrame(raf);
    running = false;
    instance.destroy();
    lenis = null;
    wake = () => {};
  };
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Scroll to a section by id. Lenis computes the destination once, but layout can still shift while we
 * travel (lazily mounted sections, late media). So when the glide ends we check we really arrived and,
 * if not, re-aim (twice at most).
 */
export function scrollToId(id: string, offset = 0, attempt = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, {
      offset,
      duration: 1.8,
      easing: easeOutExpo,
      force: true,
      onComplete: () => {
        if (attempt < 2 && Math.abs(el.getBoundingClientRect().top + offset) > 24) scrollToId(id, offset, attempt + 1);
      },
    });
    wake();
  } else {
    el.scrollIntoView({ behavior: getDevice().reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

export function scrollToY(y: number) {
  if (lenis) {
    lenis.scrollTo(y, { duration: 1.8, easing: easeOutExpo, force: true });
    wake();
  }
  else window.scrollTo({ top: y, behavior: getDevice().reducedMotion ? 'auto' : 'smooth' });
}

export function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.6, easing: easeOutExpo, force: true });
    wake();
  }
  else window.scrollTo({ top: 0, behavior: getDevice().reducedMotion ? 'auto' : 'smooth' });
}

/** Freeze/unfreeze page scrolling (menu overlay, lightbox, preloader). */
export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
    wake();
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}
