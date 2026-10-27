/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MediaKey } from './media';

/**
 * Hotspots on the explorable island. `theta`/`u`/`lift` place the marker on the
 * 3D island (polar angle, fraction of the way to the shoreline, height above
 * ground – see `anchorAt` in three/kit.ts). Copy and media slots live here so
 * editors never have to touch the 3D code.
 */
export interface Hotspot {
  id: string;
  title: string;
  kicker: string;
  copy: string;
  media: MediaKey;
  /** Where to scroll when the visitor presses the call-to-action. */
  cta: { label: string; target: string };
  anchor:
    | { kind: 'polar'; theta: number; u: number; lift: number }
    | { kind: 'local'; x: number; y: number; z: number };
  /** Polar angle that should face the camera when selected (defaults to the anchor's own angle). */
  view?: number;
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'villas',
    title: 'Pool Villas',
    kicker: '01 · Stay',
    copy: 'Private villas set into the dunes – each with its own plunge pool, outdoor rain-shower and a butler who learns your name before you arrive.',
    media: 'hotspotVillas',
    cta: { label: 'See the suites', target: 'suites' },
    anchor: { kind: 'local', x: -1.9, y: 4.9, z: -0.4 },
    view: 1.37, // the villa faces +z, rotated 0.2 rad
  },
  {
    id: 'pool',
    title: 'Infinity Pool',
    kicker: '02 · Swim',
    copy: 'A heated infinity pool that dissolves into the horizon. Open from first light until the lanterns come on.',
    media: 'hotspotPool',
    cta: { label: 'A day at Solara', target: 'chapters' },
    anchor: { kind: 'local', x: 2.5, y: 2.5, z: 1.4 },
    view: 1.37,
  },
  {
    id: 'beach',
    title: 'Beach Club',
    kicker: '03 · Unwind',
    copy: 'Loungers, a thatched bar and sunset sips ankle-deep in the lagoon. Barefoot, always.',
    media: 'hotspotBeach',
    cta: { label: 'Experiences', target: 'experiences' },
    anchor: { kind: 'polar', theta: 0.95, u: 0.8, lift: 2.1 },
  },
  {
    id: 'spa',
    title: 'Spa Garden',
    kicker: '04 · Restore',
    copy: 'Saltwater hydro-spas, a meditation deck among the palms and treatments built on local botanicals.',
    media: 'hotspotSpa',
    cta: { label: 'Experiences', target: 'experiences' },
    anchor: { kind: 'polar', theta: -2.3, u: 0.6, lift: 3.0 },
  },
  {
    id: 'pier',
    title: 'Sunset Pier',
    kicker: '05 · Depart',
    copy: 'Private sea transfers, chartered sails and the best seat in the house for golden hour.',
    media: 'hotspotPier',
    cta: { label: 'Plan your stay', target: 'booking' },
    anchor: { kind: 'polar', theta: 2.55, u: 1.4, lift: 2.9 },
  },
];
