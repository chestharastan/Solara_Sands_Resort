/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';

import { useResortData } from './hooks/useResortData';
import { useSceneZone } from './hooks/useSceneZone';
import { getDevice } from './lib/device';
import { playIntro } from './lib/sceneStore';
import { initSmoothScroll, lockScroll, scrollToId, scrollToTop } from './lib/scroll';

import Preloader from './components/Preloader';
import Nav from './components/Nav';
import MenuOverlay, { NavLink } from './components/MenuOverlay';
import Footer from './components/Footer';
import AdminShell from './components/AdminShell';
import SceneBackdrop from './components/scene/SceneBackdrop';
import Hero from './components/sections/Hero';
import Story from './components/sections/Story';
import Chapters from './components/sections/Chapters';
import MarqueeBand from './components/sections/MarqueeBand';
import Suites from './components/sections/Suites';
import Experiences from './components/sections/Experiences';
import IslandExplorer from './components/sections/IslandExplorer';
import Gallery from './components/sections/Gallery';
import ReviewSection from './components/ReviewSection';
import BookingForm from './components/BookingForm';
import LazyMount from './components/ui/LazyMount';
import { Reveal, SplitReveal } from './components/ui/Reveal';

// Google Maps SDK is heavy – only fetched when the Location section is about to be seen.
const InteractiveMap = lazy(() => import('./components/InteractiveMap'));

/** Menu / jump links, in page order. `id` must match the section's DOM id. */
const LINKS: NavLink[] = [
  { id: 'story', label: 'The Resort' },
  { id: 'chapters', label: 'A Day at Solara' },
  { id: 'suites', label: 'Suites & Villas' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'island', label: 'Explore the Island' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'location', label: 'Location' },
  { id: 'reviews', label: 'Guest Book' },
  { id: 'booking', label: 'Reserve' },
];

/** Shared heading block for the lower sections. */
function SectionHead({ index, eyebrow, title }: { index: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-10 md:mb-14">
      <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-10 bg-sun" /> {index} — {eyebrow}</p>
      <SplitReveal text={title} className="display h-lg max-w-[18ch]" />
    </div>
  );
}

export default function App() {
  const data = useResortData();
  const { hotel, rooms, amenities, gallery, reviews } = data;

  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false); // preloader finished → intro plays
  const [showPreloader, setShowPreloader] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingRoomId, setBookingRoomId] = useState('');

  const zoneRef = useRef<HTMLDivElement>(null);
  useSceneZone(zoneRef, !isAdmin);

  useEffect(() => initSmoothScroll(), []);

  // Wait for web fonts too, so the headline doesn't reflow right after it animates in.
  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady(true));
    const t = window.setTimeout(() => setFontsReady(true), 3000);
    return () => window.clearTimeout(t);
  }, []);

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const reveal = useCallback(() => {
    setShowPreloader(false);
    setLoaded(true);
    playIntro(getDevice().reducedMotion);
  }, []);

  const go = useCallback((id: string) => {
    setMenuOpen(false);
    // Release the menu's scroll lock *now* (not on the next React commit) so the jump can't be swallowed.
    lockScroll(false);
    requestAnimationFrame(() => scrollToId(id));
  }, []);

  const reserveRoom = useCallback((roomId: string) => {
    setBookingRoomId(roomId);
    go('booking');
  }, [go]);

  const openAdmin = useCallback(() => {
    setMenuOpen(false);
    setIsAdmin(true);
    window.scrollTo(0, 0);
  }, []);
  const closeAdmin = useCallback(() => {
    setIsAdmin(false);
    window.scrollTo(0, 0);
  }, []);

  /* ----------------------------------- Staff portal ----------------------------------- */
  if (isAdmin) return <AdminShell data={data} onExit={closeAdmin} />;

  /* ----------------------------------- Public site ------------------------------------ */
  return (
    <MotionConfig reducedMotion="user">
      <a href="#home" className="skip-link">Skip to content</a>

      <AnimatePresence>
        {showPreloader && <Preloader name={hotel.name} ready={sceneReady && fontsReady} onReveal={reveal} />}
      </AnimatePresence>

      <Nav
        name={hotel.name}
        loaded={loaded}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onHome={() => scrollToTop()}
        onReserve={() => go('booking')}
      />
      <MenuOverlay open={menuOpen} links={LINKS} hotel={hotel} onClose={() => setMenuOpen(false)} onNavigate={go} onStaff={openAdmin} />

      {/* Fixed 3D canvas – visible behind the scene zone only */}
      <SceneBackdrop zoneRef={zoneRef} onReady={onSceneReady} />

      <main inert={menuOpen} className="relative z-10">
        {/* SCENE ZONE: Hero + Story + Day chapters share one scroll-driven 3D scene */}
        <div ref={zoneRef} id="scene-zone">
          <Hero hotel={hotel} loaded={loaded} onReserve={() => go('booking')} onExplore={() => go('island')} />
          <Story hotel={hotel} rooms={rooms} reviews={reviews} />
          <Chapters />
        </div>

        {/* From here the sections are opaque and cover the (now paused) canvas */}
        <MarqueeBand />
        <Suites rooms={rooms} amenities={amenities} onReserve={reserveRoom} />
        <Experiences amenities={amenities} />

        <IslandExplorer onNavigate={go} />

        <Gallery items={gallery} />

        <section id="location" className="bg-ink-2 px-[var(--gutter)] py-24 md:py-40" aria-label="Location">
          <div className="mx-auto max-w-[110rem]">
            <SectionHead index="07" eyebrow="The surroundings" title="Find the *shore.*" />
            <LazyMount className="min-h-[34rem] lg:min-h-[30rem]" fallback={<div className="h-[34rem] rounded-[2rem] border hairline lg:h-[30rem]" />}>
              <Suspense fallback={<div className="h-[34rem] rounded-[2rem] border hairline lg:h-[30rem]" />}>
                <InteractiveMap address={hotel.address} />
              </Suspense>
            </LazyMount>
          </div>
        </section>

        <section id="reviews" className="bg-ink px-[var(--gutter)] py-24 md:py-40" aria-label="Guest reviews">
          <div className="mx-auto max-w-[110rem]">
            <SectionHead index="08" eyebrow="Guest book" title="Heard on the *terrace.*" />
            <ReviewSection reviews={reviews} onAddReview={data.addReview} />
          </div>
        </section>

        <section id="booking" className="relative overflow-hidden bg-ink-2 px-[var(--gutter)] py-24 md:py-40" aria-label="Reserve">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-sun/15 blur-[120px]" />
          <div className="relative mx-auto max-w-[110rem]">
            <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-10 bg-sun" /> 09 — Reserve</p>
            <SplitReveal text="Your *shore* is waiting." className="display h-xl mb-10 md:mb-16" />
            <Reveal>
              <BookingForm hotel={hotel} rooms={rooms} selectedRoomId={bookingRoomId} onAddInquiry={data.addInquiry} />
            </Reveal>
          </div>
        </section>

        <Footer hotel={hotel} links={LINKS} onNavigate={go} onTop={scrollToTop} onStaff={openAdmin} />
      </main>
    </MotionConfig>
  );
}
