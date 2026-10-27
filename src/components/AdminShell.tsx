/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import type { ResortData } from '../hooks/useResortData';

/** The Staff Portal is a separate chunk – public visitors never download it. */
const AdminConsole = lazy(() => import('./AdminConsole'));

/** Light, utilitarian workspace for staff. Deliberately plain: it is a tool, not the brand experience. */
export default function AdminShell({ data, onExit }: { data: ResortData; onExit: () => void }) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 [color-scheme:light]">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <button onClick={onExit} className="flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to resort
          </button>
          <span className="font-mono text-[0.7rem] uppercase tracking-widest text-stone-500">{data.hotel.name} · Staff workspace</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p>
            <strong>Local sandbox:</strong> changes made here (suites, prices, gallery, amenities, hotel profile) update the public site instantly and are saved in this browser.
            Paste image URLs to replace any media placeholder.
          </p>
        </div>

        <Suspense fallback={<div className="grid h-64 place-items-center text-sm text-stone-500">Loading staff console…</div>}>
          <AdminConsole
            hotel={data.hotel}
            rooms={data.rooms}
            amenities={data.amenities}
            gallery={data.gallery}
            inquiries={data.inquiries}
            onUpdateHotel={data.updateHotel}
            onSaveRoom={data.saveRoom}
            onDeleteRoom={data.deleteRoom}
            onUpdateInquiryStatus={data.updateInquiryStatus}
            onAddGalleryItem={data.addGalleryItem}
            onDeleteGalleryItem={data.deleteGalleryItem}
            onAddAmenity={data.addAmenity}
            onDeleteAmenity={data.deleteAmenity}
          />
        </Suspense>
      </main>
    </div>
  );
}
