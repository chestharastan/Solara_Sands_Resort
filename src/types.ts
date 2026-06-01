/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  hero_image: string;
  tagline: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number; // in m²
  image: string;
  amenities: string[]; // standard amenity list for this room
}

export interface Amenity {
  id: string;
  name: string;
  icon: string; // Name of Lucide icon
}

export interface GalleryItem {
  id: string;
  image_url: string;
  category: 'Rooms' | 'Lobby' | 'Pool' | 'Restaurant' | 'Exterior';
}

export interface Review {
  id: string;
  guest_name: string;
  rating: number;
  comment: string;
  date: string;
  avatar_url?: string;
}

export interface BookingInquiry {
  id: string;
  name: string;
  email: string;
  check_in: string;
  check_out: string;
  guests: number;
  message: string;
  status: 'Pending' | 'Contacted' | 'Confirmed' | 'Cancelled';
  room_id: string; // The selected room ID
  created_at: string;
}
