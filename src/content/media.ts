/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MEDIA MANIFEST – the single place to plug in photography and film.
 *
 * No real media ships with the site. Every slot below renders a descriptive
 * placeholder (see <MediaSlot/>) that tells the content team exactly what to
 * upload: subject, aspect ratio, size and format.
 *
 * To go live with a slot:
 *   1. Drop the file into `public/media/` (e.g. `public/media/story-a.avif`).
 *   2. Set `src` below to its public path (`'/media/story-a.avif'`).
 *      For video also set `poster` (a still frame shown before playback).
 *   3. Done – the layout, aspect ratio, lazy loading, parallax and zoom effects
 *      are already wired. Nothing else in the code needs to change.
 *
 * Suites and gallery tiles are *data-driven* (editable in the Staff Portal) –
 * paste an image URL there, or set `image`/`image_url` in `src/data.ts`.
 * `ROOM_SLOT` / `GALLERY_SLOT` below only describe what the placeholders say.
 */

export type MediaKind = 'image' | 'video';
export type MediaTone = 'sand' | 'sea' | 'dusk' | 'ink';

export interface MediaSpec {
  kind: MediaKind;
  /** Public path or absolute URL. Leave empty to show the placeholder. */
  src?: string;
  /** Video only: still frame displayed until playback starts. */
  poster?: string;
  /** Accessible description of the *finished* media (used as alt text once uploaded). */
  alt: string;
  /** Short title shown on the placeholder. */
  label: string;
  /** Production spec shown on the placeholder. */
  spec: string;
  /** Tints the placeholder so empty slots still feel designed. */
  tone?: MediaTone;
}

export const MEDIA = {
  /* --- The idea ---------------------------------------------------------- */
  storyA: {
    kind: 'image',
    alt: 'Guests walking along the shoreline in warm morning light',
    label: 'Shoreline at first light',
    spec: 'Portrait 4:5 · 2000×2500 · AVIF/WebP',
    tone: 'sand',
  },
  storyB: {
    kind: 'video',
    alt: 'Slow aerial pass over the resort and the lagoon',
    label: 'Aerial resort pass',
    spec: 'Landscape 16:9 · 1920×1080 · MP4 + WebM · 8–12s loop · ≤ 6 MB',
    tone: 'sea',
  },

  /* --- A day at Solara (one per chapter) --------------------------------- */
  chapterMorning: {
    kind: 'image',
    alt: 'Breakfast terrace overlooking the water',
    label: 'Morning · breakfast terrace',
    spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP',
    tone: 'sand',
  },
  chapterMidday: {
    kind: 'video',
    alt: 'Swimmers in the infinity pool at midday',
    label: 'Midday · infinity pool',
    spec: 'Landscape 3:2 · 1600×1066 · MP4 + WebM · 6–10s loop',
    tone: 'sea',
  },
  chapterGolden: {
    kind: 'image',
    alt: 'Golden hour on the rooftop lounge',
    label: 'Golden hour · rooftop lounge',
    spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP',
    tone: 'dusk',
  },
  chapterNight: {
    kind: 'image',
    alt: 'Candle-lit dinner on the water’s edge',
    label: 'Night · chef’s table',
    spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP',
    tone: 'ink',
  },

  /* --- Experiences -------------------------------------------------------- */
  expWellness: {
    kind: 'image',
    alt: 'Hydrotherapy spa and meditation deck',
    label: 'Water & wellness',
    spec: 'Portrait 4:5 · 1600×2000 · AVIF/WebP',
    tone: 'sea',
  },
  expDining: {
    kind: 'image',
    alt: 'Seasonal tasting menu plated by the chef',
    label: 'Dining',
    spec: 'Portrait 4:5 · 1600×2000 · AVIF/WebP',
    tone: 'dusk',
  },
  expJourneys: {
    kind: 'image',
    alt: 'Private sea transfer to a nearby cove',
    label: 'Journeys & concierge',
    spec: 'Portrait 4:5 · 1600×2000 · AVIF/WebP',
    tone: 'sand',
  },

  /* --- Island explorer hotspots ------------------------------------------ */
  hotspotVillas: { kind: 'image', alt: 'Private pool villa exterior', label: 'Pool villas', spec: 'Landscape 16:10 · 1600×1000', tone: 'sand' },
  hotspotPool: { kind: 'image', alt: 'Infinity pool at sunset', label: 'Infinity pool', spec: 'Landscape 16:10 · 1600×1000', tone: 'sea' },
  hotspotBeach: { kind: 'image', alt: 'Beach club loungers and thatched bar', label: 'Beach club', spec: 'Landscape 16:10 · 1600×1000', tone: 'sand' },
  hotspotSpa: { kind: 'image', alt: 'Spa garden with palms', label: 'Spa garden', spec: 'Landscape 16:10 · 1600×1000', tone: 'sea' },
  hotspotPier: { kind: 'image', alt: 'Sunset pier and boats', label: 'Sunset pier', spec: 'Landscape 16:10 · 1600×1000', tone: 'dusk' },
} satisfies Record<string, MediaSpec>;

export type MediaKey = keyof typeof MEDIA;

/** Placeholder copy for data-driven suites (the photo itself comes from `room.image`). */
export const ROOM_SLOT = {
  kind: 'image' as const,
  spec: 'Landscape 3:2 · 2400×1600 · AVIF/WebP · hero shot of the suite',
  tone: 'sand' as MediaTone,
};

/** Placeholder copy for data-driven gallery tiles (photo comes from `item.image_url`). */
export const GALLERY_SLOT = {
  kind: 'image' as const,
  spec: 'Any ratio ≥ 1600px · AVIF/WebP',
  tones: ['sand', 'sea', 'dusk', 'ink'] as MediaTone[],
};
