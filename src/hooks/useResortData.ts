/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Amenity, BookingInquiry, GalleryItem, Hotel, Review, Room } from '../types';
import { INITIAL_AMENITIES, INITIAL_GALLERY, INITIAL_HOTEL, INITIAL_INQUIRIES, INITIAL_REVIEWS, INITIAL_ROOMS } from '../data';

/**
 * The resort's "database": hotel profile, suites, amenities, gallery, reviews and
 * booking inquiries. Everything is persisted to localStorage so edits made in the
 * Staff Portal show up on the public site immediately (and survive a reload).
 *
 * Swap this hook's internals for real API calls when a backend exists – the UI
 * only depends on the shape it returns.
 */

/**
 * Reads JSON from localStorage. A missing, blocked, syntactically broken *or wrongly-shaped* entry
 * (e.g. the string "null", or an object where a list is expected) falls back instead of crashing the app.
 */
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== typeof fallback || Array.isArray(parsed) !== Array.isArray(fallback)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => load(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable (private mode) – keep working in memory */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export function useResortData() {
  const [hotel, setHotel] = usePersisted<Hotel>('solara_hotel', INITIAL_HOTEL);
  const [rooms, setRooms] = usePersisted<Room[]>('solara_rooms', INITIAL_ROOMS);
  const [amenities, setAmenities] = usePersisted<Amenity[]>('solara_amenities', INITIAL_AMENITIES);
  const [gallery, setGallery] = usePersisted<GalleryItem[]>('solara_gallery', INITIAL_GALLERY);
  const [reviews, setReviews] = usePersisted<Review[]>('solara_reviews', INITIAL_REVIEWS);
  const [inquiries, setInquiries] = usePersisted<BookingInquiry[]>('solara_inquiries', INITIAL_INQUIRIES);

  return {
    hotel,
    rooms,
    amenities,
    gallery,
    reviews,
    inquiries,

    // --- Staff Portal actions -------------------------------------------------
    updateHotel: setHotel,
    saveRoom: (saved: Room) =>
      setRooms((prev) => (prev.some((r) => r.id === saved.id) ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved])),
    deleteRoom: (id: string) => setRooms((prev) => prev.filter((r) => r.id !== id)),
    updateInquiryStatus: (id: string, status: BookingInquiry['status']) =>
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i))),
    addGalleryItem: (item: Omit<GalleryItem, 'id'>) => setGallery((prev) => [...prev, { ...item, id: `g_${Date.now()}` }]),
    deleteGalleryItem: (id: string) => setGallery((prev) => prev.filter((g) => g.id !== id)),
    addAmenity: (a: Amenity) => setAmenities((prev) => [...prev, a]),
    deleteAmenity: (id: string) => setAmenities((prev) => prev.filter((a) => a.id !== id)),

    // --- Visitor actions --------------------------------------------------------
    addInquiry: (data: Omit<BookingInquiry, 'id' | 'status' | 'created_at'>) =>
      setInquiries((prev) => [...prev, { ...data, id: `inquiry_${Date.now()}`, status: 'Pending', created_at: new Date().toISOString() }]),
    addReview: (data: Omit<Review, 'id' | 'date'>) =>
      setReviews((prev) => [
        { ...data, id: `r_${Date.now()}`, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
        ...prev,
      ]),
  };
}

export type ResortData = ReturnType<typeof useResortData>;
