/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Hand, X } from 'lucide-react';
import { HOTSPOTS } from '../../content/island';
import { MEDIA } from '../../content/media';
import { getDevice } from '../../lib/device';
import type { IslandScene } from '../../three/islandScene';
import MediaSlot from '../ui/MediaSlot';
import { Reveal, SplitReveal } from '../ui/Reveal';

/**
 * ISLAND EXPLORER (inspired by Bruno Simon's explorable world)
 * A small 3D diorama the visitor can drag, with clickable hotspots. The 3D side
 * lives in three/islandScene.ts; this component owns the DOM: markers, the info
 * card and a chip list (the accessible, keyboard-friendly way to pick a hotspot).
 * If WebGL is unavailable the same hotspots render as a plain card grid.
 */
export default function IslandExplorer({ onNavigate }: { onNavigate: (id: string) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<IslandScene | null>(null);
  const markerEls = useRef(new Map<string, HTMLElement>());
  const [selected, setSelected] = useState<string | null>(null);
  const [failed, setFailed] = useState(!getDevice().webgl);
  const [touched, setTouched] = useState(false);

  // Layout is always final (the stage is rendered immediately); only the WebGL scene waits until the
  // stage is near the viewport, so it never competes with the hero for GPU/CPU during first load.
  const [near, setNear] = useState(false);
  useEffect(() => {
    const stage = stageRef.current;
    if (failed || !stage) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: '800px 0px' });
    io.observe(stage);
    return () => io.disconnect();
  }, [failed]);

  useEffect(() => {
    const stage = stageRef.current;
    if (failed || !near || !stage) return;
    let disposed = false;
    import('../../three/islandScene')
      .then(({ createIslandScene }) => {
        if (disposed) return;
        const scene = createIslandScene({ container: stage, profile: getDevice() });
        sceneRef.current = scene;
        markerEls.current.forEach((el, id) => scene.registerMarker(id, el));
      })
      .catch((err) => {
        console.warn('[Solara] Island explorer unavailable, showing the list view.', err);
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [failed, near]);

  const select = useCallback((id: string | null) => {
    setSelected((cur) => {
      const next = cur === id ? null : id;
      sceneRef.current?.focus(next);
      return next;
    });
  }, []);

  const active = HOTSPOTS.find((h) => h.id === selected) ?? null;

  const header = (
    <div className="mx-auto mb-10 grid max-w-[110rem] items-end gap-6 md:mb-14 md:grid-cols-[1.6fr_1fr]">
      <div>
        <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-10 bg-sun" /> 05 — Explore</p>
        <SplitReveal text="Wander the *island* before you land." className="display h-lg" />
      </div>
      <Reveal delay={0.2}>
        <p className="lead max-w-md text-sand/70">
          {failed ? 'Five places worth knowing before you arrive.' : 'Drag to turn it. Tap a marker to fly in. Everything you can see, you can book.'}
        </p>
      </Reveal>
    </div>
  );

  /* ---- Fallback: no WebGL ------------------------------------------------------------------ */
  if (failed) {
    return (
      <section id="island" className="bg-ink px-[var(--gutter)] py-24 md:py-40" aria-label="Explore the island">
        {header}
        <ul className="mx-auto grid max-w-[110rem] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HOTSPOTS.map((h) => (
            <li key={h.id} className="glass overflow-hidden rounded-[1.5rem]">
              <MediaSlot {...MEDIA[h.media]} ratio="16 / 10" />
              <div className="p-5">
                <p className="eyebrow !text-sun">{h.kicker}</p>
                <h3 className="display mt-2 text-2xl">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-sand/75">{h.copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  /* ---- 3D explorer --------------------------------------------------------------------------- */
  return (
    <section id="island" className="bg-ink px-[var(--gutter)] py-24 md:py-40" aria-label="Explore the island">
      {header}

      <div className="mx-auto max-w-[110rem]">
        <div
          ref={stageRef}
          onPointerDown={() => setTouched(true)}
          className="island-stage relative h-[68svh] min-h-[26rem] w-full overflow-hidden rounded-[1.75rem] border hairline bg-[radial-gradient(70%_70%_at_50%_58%,rgba(85,217,207,0.2),transparent_72%),linear-gradient(180deg,#0d141b,#070c11)] md:h-[74svh] md:max-h-[50rem] md:rounded-[2.25rem]"
        >
          {HOTSPOTS.map((h, i) => (
            <button
              key={h.id}
              data-hotspot
              ref={(el) => {
                if (el) markerEls.current.set(h.id, el);
                else markerEls.current.delete(h.id);
                sceneRef.current?.registerMarker(h.id, el);
              }}
              onClick={() => select(h.id)}
              aria-pressed={selected === h.id}
              aria-label={h.title}
              tabIndex={-1}
              className="hotspot"
              style={{ transform: 'translate3d(-100px,-100px,0)' }}
            >
              <span className="hotspot__dot">{i + 1}</span>
              <span className={`hotspot__label ${selected === h.id ? '' : 'max-md:hidden'}`}>{h.title}</span>
            </button>
          ))}

          {/* Drag hint */}
          <AnimatePresence>
            {!touched && (
              <motion.div
                className="glass pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.1em]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Hand className="h-3.5 w-3.5 text-sun" /> Drag to rotate
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info card (desktop: overlays the stage; phones: below) */}
          <AnimatePresence mode="wait">
            {active && (
              <motion.aside
                key={active.id}
                className="glass absolute bottom-4 left-4 right-4 z-10 hidden w-auto rounded-[1.5rem] p-3 md:left-6 md:right-auto md:bottom-6 md:block md:w-[min(24rem,40%)]"
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <InfoCard hotspotId={active.id} onClose={() => select(active.id)} onNavigate={onNavigate} />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Phones: info card below the stage */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active.id}
              className="glass mt-4 rounded-[1.5rem] p-3 md:hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <InfoCard hotspotId={active.id} onClose={() => select(active.id)} onNavigate={onNavigate} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accessible hotspot picker */}
        <ul className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Places on the island">
          {HOTSPOTS.map((h, i) => (
            <li key={h.id} className="shrink-0">
              <button
                onClick={() => select(h.id)}
                aria-pressed={selected === h.id}
                className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.08em] transition-colors ${selected === h.id ? 'border-sun bg-sun text-ink' : 'border-sand/20 text-sand/85 hover:border-sand/50'}`}
              >
                <span className="font-mono text-[0.65rem] opacity-70">{String(i + 1).padStart(2, '0')}</span> {h.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function InfoCard({ hotspotId, onClose, onNavigate }: { hotspotId: string; onClose: () => void; onNavigate: (id: string) => void }) {
  const h = HOTSPOTS.find((x) => x.id === hotspotId)!;
  return (
    <div>
      <div className="relative overflow-hidden rounded-[1.1rem]">
        <MediaSlot {...MEDIA[h.media]} ratio="16 / 8" />
        <button onClick={onClose} aria-label="Close details" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/70 text-sand hover:bg-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-2 pb-2 pt-4">
        <p className="eyebrow !text-sun">{h.kicker}</p>
        <h3 className="display mt-1.5 text-[1.7rem] !leading-none">{h.title}</h3>
        <p className="mt-2.5 text-[0.88rem] leading-relaxed text-sand/80">{h.copy}</p>
        <button onClick={() => onNavigate(h.cta.target)} className="btn btn--ghost mt-4 !px-4 !py-2.5 !text-[0.7rem]">
          {h.cta.label} <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
