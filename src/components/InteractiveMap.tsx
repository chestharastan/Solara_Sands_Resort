/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { HOTEL_LOCATION, NEARBY_ATTRACTIONS } from '../data';

/**
 * LOCATION – a live Google map when `GOOGLE_MAPS_PLATFORM_KEY` is configured,
 * otherwise a stylised "nautical chart" (pure SVG – no key, no network) so the
 * public site never shows a setup screen. Same attraction list drives both.
 */
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as unknown as Record<string, string>).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

/** Draws a driving route from the resort to the selected place on the live map. */
function RouteDisplay({ origin, destination }: { origin: google.maps.LatLngLiteral; destination: google.maps.LatLngLiteral }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then(({ routes }) => {
        if (!routes?.[0]) return;
        const lines = routes[0].createPolylines();
        lines.forEach((p) => {
          p.setOptions({ strokeColor: '#ff9d5c', strokeOpacity: 0.9, strokeWeight: 4 });
          p.setMap(map);
        });
        polylinesRef.current = lines;
        if (routes[0].viewport) map.fitBounds(routes[0].viewport);
      })
      .catch((err) => console.warn('Route computation skipped:', err));

    return () => polylinesRef.current.forEach((p) => p.setMap(null));
  }, [routesLib, map, origin, destination]);

  return null;
}

/** The no-key fallback: a hand-drawn chart with a coastline, range rings and animated route. */
function ChartMap({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const home = { x: 48, y: 50 };
  const target = NEARBY_ATTRACTIONS[selected].chart;
  const mx = (home.x + target.x) / 2;
  const my = (home.y + target.y) / 2 - 9;

  return (
    <svg viewBox="0 0 100 75" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img" aria-label="Chart showing the resort and nearby places">
      <defs>
        <radialGradient id="chart-sea" cx="48%" cy="66%" r="75%">
          <stop offset="0" stopColor="#14606b" />
          <stop offset="1" stopColor="#08212b" />
        </radialGradient>
      </defs>
      <rect width="100" height="75" fill="url(#chart-sea)" />
      {/* graticule */}
      <g stroke="rgba(239,229,208,0.07)" strokeWidth="0.15">
        {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="75" />)}
        {Array.from({ length: 8 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} />)}
      </g>
      {/* range rings around the resort */}
      <g fill="none" stroke="rgba(85,217,207,0.35)" strokeWidth="0.2" strokeDasharray="0.8 1.2">
        {[12, 24, 36].map((r) => <circle key={r} cx={home.x} cy={home.y * 0.75 + 0} r={r} />)}
      </g>
      {/* coastline + land */}
      <path d="M0 0 H100 V22 C88 28 80 24 72 30 C62 38 66 52 56 60 C48 66 40 62 32 66 C24 70 12 66 0 72 Z" fill="#d9c28f" opacity="0.14" />
      <path d="M0 72 C12 66 24 70 32 66 C40 62 48 66 56 60 C66 52 62 38 72 30 C80 24 88 28 100 22" fill="none" stroke="#efe5d0" strokeOpacity="0.55" strokeWidth="0.35" />
      {/* route */}
      <path
        d={`M${home.x} ${home.y * 0.75} Q ${mx} ${my * 0.75} ${target.x} ${target.y * 0.75}`}
        fill="none"
        stroke="#ff9d5c"
        strokeWidth="0.55"
        strokeLinecap="round"
        strokeDasharray="1.6 1.6"
        style={{ animation: 'dash 1.6s linear infinite' }}
      />
      {/* resort */}
      <g>
        <circle cx={home.x} cy={home.y * 0.75} r="2.4" fill="#ff9d5c" opacity="0.25" />
        <circle cx={home.x} cy={home.y * 0.75} r="1.1" fill="#ff9d5c" />
        <text x={home.x + 2.4} y={home.y * 0.75 - 2} fontSize="2.3" fill="#efe5d0" fontFamily="var(--font-mono)" letterSpacing="0.1">SOLARA SANDS</text>
      </g>
      {/* attractions */}
      {NEARBY_ATTRACTIONS.map((a, i) => (
        <g key={a.name} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
          <circle cx={a.chart.x} cy={a.chart.y * 0.75} r={i === selected ? 2.2 : 1.4} fill="#efe5d0" opacity={i === selected ? 0.3 : 0.12} />
          <circle cx={a.chart.x} cy={a.chart.y * 0.75} r={i === selected ? 1 : 0.7} fill={i === selected ? '#ff9d5c' : '#efe5d0'} />
          <text x={a.chart.x + 2} y={a.chart.y * 0.75 + 0.8} fontSize="2" fill="#efe5d0" opacity={i === selected ? 1 : 0.6} fontFamily="var(--font-mono)">{a.name}</text>
        </g>
      ))}
      {/* compass */}
      <g transform="translate(91 10)" fill="none" stroke="#efe5d0" strokeOpacity="0.6" strokeWidth="0.25">
        <circle r="4" />
        <path d="M0 -6 L1.2 0 L0 6 L-1.2 0 Z" fill="#efe5d0" fillOpacity="0.5" />
        <text y="-7" textAnchor="middle" fontSize="2.2" fill="#efe5d0" stroke="none">N</text>
      </g>
    </svg>
  );
}

export default function InteractiveMap({ address }: { address: string }) {
  const [selected, setSelected] = useState(0);
  const current = NEARBY_ATTRACTIONS[selected];

  return (
    <div id="interactive-map-section" className="grid gap-4 md:gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="relative aspect-[4/3] min-h-[20rem] overflow-hidden rounded-[1.75rem] border hairline bg-ink-2 md:aspect-[16/10] md:rounded-[2.25rem]">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map defaultCenter={HOTEL_LOCATION} defaultZoom={13} mapId="DEMO_MAP_ID" internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']} style={{ width: '100%', height: '100%' }}>
              <AdvancedMarker position={HOTEL_LOCATION} title="Solara Sands Resort">
                <Pin background="#ff9d5c" borderColor="#ffffff" glyphColor="#070c11" scale={1.15} />
              </AdvancedMarker>
              {NEARBY_ATTRACTIONS.map((p, idx) => (
                <AdvancedMarker key={p.name} position={p.location} title={p.name} onClick={() => setSelected(idx)}>
                  <Pin background={p.color} borderColor={idx === selected ? '#ffffff' : 'transparent'} glyphColor="#ffffff" scale={idx === selected ? 1.25 : 0.9} />
                </AdvancedMarker>
              ))}
              <RouteDisplay origin={HOTEL_LOCATION} destination={current.location} />
            </Map>
          </APIProvider>
        ) : (
          <ChartMap selected={selected} onSelect={setSelected} />
        )}

        <div className="glass pointer-events-none absolute bottom-3 left-3 flex max-w-[85%] items-center gap-2 rounded-full px-4 py-2 text-[0.72rem]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-sun" />
          <span className="truncate"><span className="text-sand/60">Resort address · </span>{address}</span>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-[1.75rem] border hairline p-5 md:rounded-[2.25rem] md:p-8">
        <div>
          <p className="eyebrow mb-3">Nearby</p>
          <p className="mb-5 text-sm leading-relaxed text-sand/70">Complimentary daily shuttle and custom-mapped bicycles for every place below.</p>
          <ul className="grid gap-2">
            {NEARBY_ATTRACTIONS.map((a, i) => (
              <li key={a.name}>
                <button
                  id={`attraction-btn-${i}`}
                  onClick={() => setSelected(i)}
                  aria-pressed={selected === i}
                  className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${selected === i ? 'border-sun/60 bg-sun/10' : 'border-sand/15 hover:border-sand/40'}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Navigation className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${selected === i ? 'text-sun' : 'text-sand/40'}`} />
                    <span className="truncate font-medium">{a.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.68rem] text-sand/60">{a.distance}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t hairline pt-5">
          <AnimatePresence mode="wait">
            <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <h3 className="display text-2xl !leading-none">{current.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sand/70">{current.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
