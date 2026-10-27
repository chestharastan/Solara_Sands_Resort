/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MEDIA MANIFEST – the single place that says which photo/video goes where.
 *
 * Photography ships in `public/media/` (sources and licence: `public/media/CREDITS.md`). Every image
 * exists in two widths – `name-640.webp` and `name-1280.webp` – and <MediaSlot/> automatically builds a
 * `srcset` from the 1280 file, so phones download the small one.
 *
 * Replacing a photo:
 *   1. Export two WebP/AVIF files, `my-photo-640.webp` and `my-photo-1280.webp`, into `public/media/`.
 *   2. Point `src` below at `/media/my-photo-1280.webp`.
 *
 * Video: set `kind: 'video'`, `src` to an MP4 (plus `poster`). Videos are muted, loop, and only play
 * while on screen.
 *
 * Leave `src` empty and the slot renders a *descriptive placeholder* (what to shoot, ratio, size,
 * format) – handy for adding new slots before the content exists.
 *
 * Suites and gallery tiles are data-driven: edit them in the Staff Portal, or seed them in
 * `src/data.ts` (`room.image`, `gallery[].image_url`). Those follow the same file convention.
 */

export type MediaKind = 'image' | 'video';
export type MediaTone = 'sand' | 'sea' | 'dusk' | 'ink';

export interface MediaSpec {
  kind: MediaKind;
  /** Public path or absolute URL. Leave empty to show the placeholder. */
  src?: string;
  /** Video only: still frame displayed until playback starts. */
  poster?: string;
  /** `sizes` attribute for the responsive image (how wide the slot renders). */
  sizes?: string;
  /** Accessible description of the media (used as alt text). */
  alt: string;
  /** Short title shown on the placeholder. */
  label: string;
  /** Production spec shown on the placeholder. */
  spec: string;
  /** Tints the placeholder so empty slots still feel designed. */
  tone?: MediaTone;
}

const img = (slug: string) => `/media/${slug}-1280.webp`;

export const MEDIA = {
  /* --- The idea (shown beside the Experiences intro) -------------------- */
  storyA: {
    kind: 'image',
    src: img('story-shoreline'),
    sizes: '(min-width: 768px) 20vw, 60vw',
    alt: 'A terrace above the beach at first light, thatched umbrellas below and a pink sky over the sea',
    label: 'Shoreline at first light',
    spec: 'Portrait 4:5 · 2000×2500 · AVIF/WebP',
    tone: 'sand',
  },
  storyB: {
    kind: 'image',
    src: img('story-aerial'),
    sizes: '(min-width: 768px) 24vw, 80vw',
    alt: 'Aerial view of a beachfront resort among palm trees',
    label: 'Aerial resort pass',
    spec: 'Landscape 16:9 · 1920×1080 · AVIF/WebP (or MP4 + WebM · 8–12s loop)',
    tone: 'sea',
  },

  /* --- A day at Solara (one per chapter) --------------------------------- */
  chapterMorning: {
    kind: 'image',
    src: img('chapter-morning'),
    sizes: '(min-width: 768px) 28rem, 90vw',
    alt: 'A guest meditating on the sand at sunrise',
    label: 'Morning · sunrise on the shore',
    spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP',
    tone: 'sand',
  },
  chapterMidday: {
    kind: 'image',
    src: img('chapter-midday'),
    sizes: '(min-width: 768px) 28rem, 90vw',
    alt: 'An infinity pool with thatched umbrellas reflecting a blue sky',
    label: 'Midday · infinity pool',
    spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP (or MP4 + WebM · 6–10s loop)',
    tone: 'sea',
  },
  chapterGolden: {
    kind: 'image',
    src: img('chapter-golden'),
    sizes: '(min-width: 768px) 28rem, 90vw',
    alt: 'Sun loungers beside an infinity pool at sunset over the water',
    label: 'Golden hour · poolside lounge',
    spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP',
    tone: 'dusk',
  },
  chapterNight: {
    kind: 'image',
    src: img('chapter-night'),
    sizes: '(min-width: 768px) 28rem, 90vw',
    alt: 'A candle-lit table with wine glasses set for dinner at night',
    label: 'Night · chef’s table',
    spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP',
    tone: 'ink',
  },

  /* --- Experiences -------------------------------------------------------- */
  expWellness: {
    kind: 'image',
    src: img('exp-wellness'),
    sizes: '(min-width: 768px) 30vw, 100vw',
    alt: 'A massage therapist at work beside candles and dried lavender',
    label: 'Water & wellness',
    spec: 'Portrait 4:5 · 1600×2000 · AVIF/WebP',
    tone: 'sea',
  },
  expDining: {
    kind: 'image',
    src: img('exp-dining'),
    sizes: '(min-width: 768px) 30vw, 100vw',
    alt: 'A chef’s hands plating a dish with tweezers',
    label: 'Dining',
    spec: 'Portrait 4:5 · 1600×2000 · AVIF/WebP',
    tone: 'dusk',
  },
  expJourneys: {
    kind: 'image',
    src: img('exp-journeys'),
    sizes: '(min-width: 768px) 30vw, 100vw',
    alt: 'A wooden pier stretching out over calm water at dusk',
    label: 'Journeys & concierge',
    spec: 'Portrait 4:5 · 1600×2000 · AVIF/WebP',
    tone: 'sand',
  },

  /* --- Island explorer hotspots ------------------------------------------ */
  hotspotVillas: {
    kind: 'image',
    src: img('hotspot-villas'),
    sizes: '(min-width: 768px) 24rem, 90vw',
    alt: 'Pool villas with tiled roofs on a forested hillside above a beach',
    label: 'Pool villas',
    spec: 'Landscape 16:10 · 1600×1000',
    tone: 'sand',
  },
  hotspotPool: {
    kind: 'image',
    src: img('hotspot-pool'),
    sizes: '(min-width: 768px) 24rem, 90vw',
    alt: 'An infinity pool mirroring a sunset sky between palm trees',
    label: 'Infinity pool',
    spec: 'Landscape 16:10 · 1600×1000',
    tone: 'sea',
  },
  hotspotBeach: {
    kind: 'image',
    src: img('hotspot-beach'),
    sizes: '(min-width: 768px) 24rem, 90vw',
    alt: 'A sandy beach lined with straw umbrellas',
    label: 'Beach club',
    spec: 'Landscape 16:10 · 1600×1000',
    tone: 'sand',
  },
  hotspotSpa: {
    kind: 'image',
    src: img('hotspot-spa'),
    sizes: '(min-width: 768px) 24rem, 90vw',
    alt: 'Spa candles, frangipani flowers and a rolled towel',
    label: 'Spa garden',
    spec: 'Landscape 16:10 · 1600×1000',
    tone: 'sea',
  },
  hotspotPier: {
    kind: 'image',
    src: img('hotspot-pier'),
    sizes: '(min-width: 768px) 24rem, 90vw',
    alt: 'A wooden pier and boat on glassy water at sunset',
    label: 'Sunset pier',
    spec: 'Landscape 16:10 · 1600×1000',
    tone: 'dusk',
  },
} satisfies Record<string, MediaSpec>;

export type MediaKey = keyof typeof MEDIA;

/** Placeholder copy for data-driven suites (the photo itself comes from `room.image`). */
export const ROOM_SLOT = {
  kind: 'image' as const,
  sizes: '(min-width: 768px) 55vw, 100vw',
  spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP · hero shot of the suite',
  tone: 'sand' as MediaTone,
};

/** Placeholder copy for data-driven gallery tiles (photo comes from `item.image_url`). */
export const GALLERY_SLOT = {
  kind: 'image' as const,
  sizes: '(min-width: 768px) 32vw, 50vw',
  spec: 'Any ratio ≥ 1600px · AVIF/WebP',
  tones: ['sand', 'sea', 'dusk', 'ink'] as MediaTone[],
};
