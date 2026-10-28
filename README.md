# Solara Sands Resort

A cinematic, scroll-driven resort website: a live **WebGL sunrise-to-night journey** around a private island, an **explorable 3D island**, parallax and zoom storytelling, a booking flow and a staff portal. It is built to feel smooth on a phone as well as a desktop, and it uses responsive, lazy-loaded photography (stand-ins today, easy to replace with the resort's own).

React 19 · TypeScript · Vite · Tailwind CSS v4 · Three.js · Motion · Lenis

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run lint       # type-check (tsc --noEmit)
```

Optional: set `GOOGLE_MAPS_PLATFORM_KEY` in `.env.local` to show a live Google map in the *Location* section. Without it a stylised SVG chart is shown instead – the public site never displays a setup screen.

## What's on the page

| # | Section | Idea (reference) |
|---|---|---|
| – | Preloader | A sun rises as the counter runs (Noomo-style curtain) |
| 01 | **Hero** | Live 3D sunrise over water; headline "zooms" toward you as you leave |
| 01 | **Story** | Pinned manifesto – words light up as you scroll while the 3D camera pushes in (Igloo / Beagle) |
| 02 | **A day at Solara** | Chaptered, pinned storytelling; scrolling moves the sun, the HUD clock and the camera (Persepolis) |
| – | Highlights ticker | A calm editorial ticker – one row, one direction, a little faster as you scroll |
| 03 | **Suites** | Sticky "deck" of project cards that bury each other (Noomo) |
| 04 | **Experiences** | Three columns at three parallax depths + amenity ticker (Simply Chocolate) |
| 05 | **Island explorer** | Drag-to-rotate 3D diorama with clickable hotspots (Bruno Simon) |
| 06 | Gallery | Filterable bento mosaic, zoom-in tiles, keyboard lightbox |
| 07 | Location | Chart / live map + attractions |
| 08 | Guest book | Ratings, swipeable reviews, add-a-review form |
| 09 | Reserve | Booking form with live price estimate |
| – | Staff portal | Edit suites, prices, gallery, amenities, hotel profile, inquiries (lazy-loaded; opened from the menu or footer) |

## Photography and video

The site ships with **stand-in photography** from Pexels (free for commercial use; sources in [`public/media/CREDITS.md`](public/media/CREDITS.md)). Swap in the resort's own photos before launch – nothing in the layout has to change.

* **Format:** every image exists twice, `name-640.webp` and `name-1280.webp`, in `public/media/`. `<MediaSlot/>` builds the `srcset` from the `-1280` path automatically, so phones download the small file (a full scroll is ~1.2 MB on a standard screen, only what you scroll to is fetched, and images fade in over a tinted background so nothing pops).
* **Static slots** (story, day chapters, experiences, island hotspots) are listed in [`src/content/media.ts`](src/content/media.ts). To replace one: export `my-photo-640.webp` + `my-photo-1280.webp` into `public/media/` and point `src` at `/media/my-photo-1280.webp`.
* **Data-driven slots** – suites and gallery tiles – are seeded in [`src/data.ts`](src/data.ts) and editable in the **Staff Portal** (paste an image URL).
* **Video:** set `kind: 'video'` and `src` to an MP4 (+ `poster`). Videos are muted, loop, only play while on screen, and show their poster under *prefers-reduced-motion*.
* **Empty or broken `src`** renders a *descriptive placeholder* (what to shoot, ratio, size, format) instead of a broken-image icon – useful for adding a new slot before its photo exists.
* **Share image:** add `<meta property="og:image" …>` in `index.html` (a comment marks the spot).

Recommended delivery for new photography: AVIF/WebP at 640 and 1280 px wide (2400 px if you want a larger lightbox); MP4 (H.264) + WebM, ≤ 6 MB, 8–12 s seamless loops.

## How the 3D works

```
src/lib/timeline.ts    ← the single source of truth: section heights, scroll → time-of-day, sky palette
src/lib/sceneStore.ts  ← tiny store (scroll progress, tod) shared by DOM and WebGL – no React re-renders
src/hooks/useSceneZone ← page scroll → sceneState.progress
src/three/heroScene.ts ← renderer, lights, camera rig (keyframes), governor wiring
src/three/shaders.ts   ← sky + sea in ONE full-screen fragment shader
src/three/kit.ts       ← procedural island, villa, palms (instanced), boat, lagoon
src/three/islandScene.ts ← the draggable diorama
```

* **Sky and sea are a single full-screen shader.** Each pixel casts a ray: it hits the sky (gradient, sun, moon, stars, clouds) or the analytic plane *y = 0* (waves, Fresnel reflection, sun glitter, horizon fog). Infinite water for the cost of one draw call.
* **The resort is ~20 draw calls**: geometry is merged per material and palms are one `InstancedMesh`. Props are sliced at the waterline with a clipping plane.
* **Hero, Story and Day chapters share one pinned scene zone.** `timeline.ts` defines their heights *and* the progress at which each begins, so layout and camera can never drift apart. Change `STORY_VH` / `CHAPTERS_VH` to lengthen a chapter.
* **Camera path**: edit `KEYS` in `heroScene.ts` (position + look-at per scroll progress). Sun position: `SUN_AZ`. Colours: `KEYS` in `timeline.ts`.
* The scenes are procedural and stylised (no model files). To use real 3D assets later, load a GLB with `GLTFLoader` and add it to the island group instead of calling `buildVilla()` / `buildPalms()` in `kit.ts`.

## Performance model

* **Tiers** (`src/lib/device.ts`): `low` (reduced-motion, data-saver, weak hardware), `mid` (most phones/laptops), `high` (capable desktops). They set the pixel-ratio cap, shader octaves, particle count, shadows and MSAA. The tier is also exposed as `<html data-tier>` so CSS can drop backdrop-blur and film grain.
* **Pixel ratio** is capped by *both* the tier and the real `devicePixelRatio`.
* **Adaptive governor** (`src/three/governor.ts`): measures real frame times; if slow it lowers the pixel ratio first, then sheds shadows/particles/noise; if fast it slowly recovers.
* **Nothing renders off-screen**: the hero loop stops when the scene zone leaves the viewport; the island loop stops when it does; both stop when the tab is hidden. Shadow maps are only re-baked when the sun has moved.
* **No idle wake-ups**: the smooth-scroll loop runs only while scrolling/interacting.
* **Code-splitting**: Three.js is a separate lazily-loaded chunk (first paint doesn't wait for it); the Staff Portal and Google Maps are lazy; the island scene is created only when its stage is near the viewport.
* **Scroll-linked effects write to the DOM directly** (Motion values / refs) – scrolling does not re-render React.
* Fonts are self-hosted (no render-blocking Google Fonts request).

## Resilience & accessibility

* **No WebGL / GPU blocked / context creation fails** → a CSS gradient sky that follows the same time-of-day palette, and the island explorer becomes a card list.
* **`prefers-reduced-motion`** → no smooth scrolling, parallax, marquee or intro animation; the 3D scene renders on demand instead of continuously.
* Keyboard: skip link, focus-visible rings, menu/lightbox with Esc + focus handling, buried suite cards are `inert`, the island has an accessible hotspot list.
* Corrupted or wrongly-shaped `localStorage` falls back to defaults instead of crashing.

## Browser support

Current Chrome, Edge, Safari 16+, Firefox. WebGL2 (or WebGL1) required for the 3D layer; everything degrades gracefully without it.

## Notes

* Data (suites, gallery, reviews, inquiries) is persisted in the browser's `localStorage` – there is no backend. Swap the internals of `src/hooks/useResortData.ts` for API calls when one exists.
* The live-map coordinates and attractions in `src/data.ts` are still the original Carmel-by-the-Sea sample data, whereas the resort address is Sen Sok, Phnom Penh. Update `HOTEL_LOCATION` and `NEARBY_ATTRACTIONS` for the real surroundings.
