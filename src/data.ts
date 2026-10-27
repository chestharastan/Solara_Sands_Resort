/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hotel, Room, Amenity, GalleryItem, Review, BookingInquiry } from './types';

export const INITIAL_HOTEL: Hotel = {
  id: 'solara_boutique',
  name: 'Solara Sands Resort',
  tagline: 'An elegant coastal escape designed to relax your senses.',
  description: 'Nestled between pristine blue shores and breathtaking cliffside scenery, Solara Sands Resort offers an exquisite retreat with a heated rooftop infinity pool, a Michelin-starred dining experience, a full-service organic spa, and tailored local exploration plans.',
  address: 'Sen Sok, Phnom Penh, Cambodia',
  phone: '+855 69 260 405',
  email: 'chesthareahtan@gmail.com',
  hero_image: '',
};

export const INITIAL_AMENITIES: Amenity[] = [
  { id: 'wifi', name: 'Free Wi-Fi', icon: 'Wifi' },
  { id: 'pool', name: 'Rooftop Pool', icon: 'Waves' },
  { id: 'dining', name: 'Restaurant & Bar', icon: 'Utensils' },
  { id: 'shuttle', name: 'Airport Pickup', icon: 'Car' },
  { id: 'parking', name: 'Free Valet Parking', icon: 'Compass' },
  { id: 'spa', name: 'Full-Service Spa', icon: 'Sparkles' },
  { id: 'business', name: 'Business Suite', icon: 'Briefcase' },
  { id: 'breakfast', name: 'Breakfast Buffet', icon: 'Coffee' },
  { id: 'reception', name: '24/7 Concierge', icon: 'Clock' },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room_1',
    hotel_id: 'solara_boutique',
    name: 'Deluxe Ocean King Room',
    description: 'Bask in premium luxury with custom linen, a pristine king-sized bed, marble bath fixtures, and floor-to-ceiling windows overlooking the sapphire waves.',
    price: 189,
    capacity: 2,
    size: 42,
    image: '',
    amenities: ['wifi', 'breakfast', 'reception', 'parking']
  },
  {
    id: 'room_2',
    hotel_id: 'solara_boutique',
    name: 'Sky Terrace Grand Suite',
    description: 'An expansive open-concept suite containing an isolated reading lounge, private heated outdoor terrace container, and absolute architectural privacy.',
    price: 320,
    capacity: 3,
    size: 68,
    image: '',
    amenities: ['wifi', 'pool', 'dining', 'breakfast', 'reception', 'parking']
  },
  {
    id: 'room_3',
    hotel_id: 'solara_boutique',
    name: 'Private Sanctuary Pool Villa',
    description: 'Elevate your retreat in a complete individual cliffside villa, featuring its own private overflow plunge pool, outdoor rain-shower, and personal butler request system.',
    price: 549,
    capacity: 4,
    size: 110,
    image: '',
    amenities: ['wifi', 'pool', 'dining', 'shuttle', 'spa', 'breakfast', 'reception', 'parking']
  },
  {
    id: 'room_4',
    hotel_id: 'solara_boutique',
    name: 'Vista Twin Room',
    description: 'Perfect for friends or small families, customized with dual double-sized therapeutic mattresses, garden pathways access, and high-speed working desks.',
    price: 149,
    capacity: 2,
    size: 38,
    image: '',
    amenities: ['wifi', 'breakfast', 'reception', 'parking']
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'g_1',
    image_url: '',
    category: 'Rooms'
  },
  {
    id: 'g_2',
    image_url: '',
    category: 'Lobby'
  },
  {
    id: 'g_3',
    image_url: '',
    category: 'Pool'
  },
  {
    id: 'g_4',
    image_url: '',
    category: 'Restaurant'
  },
  {
    id: 'g_5',
    image_url: '',
    category: 'Exterior'
  },
  {
    id: 'g_6',
    image_url: '',
    category: 'Exterior'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r_1',
    guest_name: 'Genevieve Sinclair',
    rating: 5,
    comment: 'The attention to detail at Solara is unparalleled. From the personalized check-in treats to the exceptional sunset views from our private pool villa, everything was pristine.',
    date: 'May 12, 2026',
    avatar_url: ''
  },
  {
    id: 'r_2',
    guest_name: 'Marcus Kincaid',
    rating: 5,
    comment: 'Exceptional level of service. The 24/7 concierge helped arrange an immediate private wine tour, and the bed felt like sleeping on a cloud. Will definitely return next summer!',
    date: 'April 28, 2026',
    avatar_url: ''
  },
  {
    id: 'r_3',
    guest_name: 'Aria Henderson',
    rating: 4,
    comment: 'Beautiful resort right by the sea. The rooftop swimming experience was surreal, looking directly over the ocean. Breakfast buffet had fantastic fresh options.',
    date: 'May 20, 2026',
    avatar_url: ''
  }
];

/** Demo inquiries so the Staff Portal is not empty on first run. */
export const INITIAL_INQUIRIES: BookingInquiry[] = [
  {
    id: 'inquiry_demo_1',
    name: 'Margot de Vore',
    email: 'margot.devore@chateau.fr',
    check_in: '2026-06-15',
    check_out: '2026-06-20',
    guests: 2,
    message: 'Looking forward to our first coastal summer getaway! Can we request high-floor suites with extra feather pillows?',
    status: 'Pending',
    room_id: 'room_2',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inquiry_demo_2',
    name: 'Dr. Alistair Sterling',
    email: 'a.sterling@cardio.org',
    check_in: '2026-07-01',
    check_out: '2026-07-08',
    guests: 4,
    message: 'Private Sanctuary Pool Villa reservation request. We will need valet coordination and double airport luxury pickup details.',
    status: 'Contacted',
    room_id: 'room_3',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export interface Attraction {
  name: string;
  distance: string;
  desc: string;
  /** Live-map coordinates (used only when a Google Maps key is configured). */
  location: { lat: number; lng: number };
  /** Marker colour on the live map. */
  color: string;
  /** Position on the stylised chart shown when there is no map key (0–100 in each axis). */
  chart: { x: number; y: number };
}

/** Coordinates of the resort on the live map. */
export const HOTEL_LOCATION = { lat: 36.5684, lng: -121.9616 };

export const NEARBY_ATTRACTIONS: Attraction[] = [
  {
    name: 'Sandy Beach Cove',
    distance: '3 min walk',
    desc: 'Serene white sand coastline perfect for shells collection and light strolls.',
    location: { lat: 36.5472, lng: -121.9365 },
    color: '#4a6b82',
    chart: { x: 70, y: 64 },
  },
  {
    name: 'Beacon Cliffside Lighthouse',
    distance: '5 min drive',
    desc: '140-year old cliff lighthouse offering 360-degree sunset panoramas.',
    location: { lat: 36.62, lng: -121.9701 },
    color: '#9c665d',
    chart: { x: 30, y: 18 },
  },
  {
    name: 'Cove Village Downtown',
    distance: '8 min shuttle',
    desc: 'Boutique local market stores, organic bakeries, and handcrafted souvenirs.',
    location: { lat: 36.5551, lng: -121.9213 },
    color: '#7b856a',
    chart: { x: 82, y: 36 },
  },
  {
    name: 'Redwood Valley Hiking Trail',
    distance: '15 min drive',
    desc: 'Scenic wood trails towering above coastal mountain ridges.',
    location: { lat: 36.4312, lng: -121.9105 },
    color: '#735f49',
    chart: { x: 22, y: 78 },
  },
];
