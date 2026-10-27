/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Adaptive quality governor.
 *
 * Device tiers are a good first guess but they can't know how busy the GPU is
 * (a throttled laptop, a phone in low-power mode, 40 browser tabs…). So we
 * measure real frame times and react:
 *
 *   slow  → lower the pixel ratio first (cheapest, least visible),
 *           then shed features (shadows, particles, noise octaves).
 *   fast  → slowly raise the pixel ratio back up (never above the tier cap).
 *
 * A cool-down after every change prevents the oscillation you get from naive
 * "if slow then drop" loops.
 */

export interface GovernorOptions {
  dpr: number;
  minDpr: number;
  maxDpr: number;
  onDpr(dpr: number): void;
  /** level 1 → drop shadows / halve particles; level 2 → cheaper noise. */
  onDegrade(level: number): void;
}

export class Governor {
  dpr: number;
  level = 0;
  private opts: GovernorOptions;
  private acc = 0;
  private frames = 0;
  private windowT = 0;
  private cooldown = 2.5; // seconds of warm-up before judging anything
  private fastRun = 0;

  constructor(opts: GovernorOptions) {
    this.opts = opts;
    this.dpr = opts.dpr;
  }

  /** Call once per rendered frame with the real delta time (seconds). */
  tick(dt: number) {
    if (dt > 0.25) return; // tab was hidden / debugger pause – not a perf signal
    this.acc += dt;
    this.frames++;
    this.windowT += dt;
    if (this.windowT < 1) return;

    const avg = this.acc / this.frames;
    this.acc = this.frames = this.windowT = 0;

    if (this.cooldown > 0) {
      this.cooldown -= 1;
      return;
    }

    if (avg > 0.027) {
      // below ~37 fps
      this.fastRun = 0;
      if (this.dpr > this.opts.minDpr + 0.01) {
        this.dpr = Math.max(this.opts.minDpr, this.dpr * 0.8);
        this.opts.onDpr(this.dpr);
      } else if (this.level < 2) {
        this.level++;
        this.opts.onDegrade(this.level);
      }
      this.cooldown = 4;
    } else if (avg < 0.0185 && this.dpr < this.opts.maxDpr - 0.01 && this.level === 0) {
      // comfortably above ~54 fps for a while → claw some resolution back
      if (++this.fastRun >= 4) {
        this.fastRun = 0;
        this.dpr = Math.min(this.opts.maxDpr, this.dpr * 1.12);
        this.opts.onDpr(this.dpr);
        this.cooldown = 3;
      }
    } else {
      this.fastRun = 0;
    }
  }
}
