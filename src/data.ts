/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hotel, Room, Amenity, GalleryItem, Review } from './types';

export const INITIAL_HOTEL: Hotel = {
  id: 'solara_boutique',
  name: 'Solara Sands Resort',
  tagline: 'An elegant coastal escape designed to relax your senses.',
  description: 'Nestled between pristine blue shores and breathtaking cliffside scenery, Solara Sands Resort offers an exquisite retreat with a heated rooftop infinity pool, a Michelin-starred dining experience, a full-service organic spa, and tailored local exploration plans.',
  address: 'Sen Sok, Phnom Penh, Cambodia',
  phone: '+855 69 260 405',
  email: 'chesthareahtan@gmail.com',
  hero_image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80',
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
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['wifi', 'breakfast', 'reception', 'parking']
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'g_1',
    image_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    category: 'Rooms'
  },
  {
    id: 'g_2',
    image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    category: 'Lobby'
  },
  {
    id: 'g_3',
    image_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    category: 'Pool'
  },
  {
    id: 'g_4',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    category: 'Restaurant'
  },
  {
    id: 'g_5',
    image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    category: 'Exterior'
  },
  {
    id: 'g_6',
    image_url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80',
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
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
  },
  {
    id: 'r_2',
    guest_name: 'Marcus Kincaid',
    rating: 5,
    comment: 'Exceptional level of service. The 24/7 concierge helped arrange an immediate private wine tour, and the bed felt like sleeping on a cloud. Will definitely return next summer!',
    date: 'April 28, 2026',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
  },
  {
    id: 'r_3',
    guest_name: 'Aria Henderson',
    rating: 4,
    comment: 'Beautiful resort right by the sea. The rooftop swimming experience was surreal, looking directly over the ocean. Breakfast buffet had fantastic fresh options.',
    date: 'May 20, 2026',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80'
  }
];

export const NEARBY_ATTRACTIONS = [
  { name: 'Sandy Beach Cove', distance: '3 min walk', desc: 'Serene white sand coastline perfect for shells collection and light strolls.' },
  { name: 'Beacon Cliffside Lighthouse', distance: '5 min drive', desc: '140-year old cliff lighthouse offering 360-degree sunset panoramas.' },
  { name: 'Cove Village Downtown', distance: '8 min shuttle', desc: 'Boutique local market stores, organic bakeries, and handcrafted souvenirs.' },
  { name: 'Redwood Valley Hiking Trail', distance: '15 min drive', desc: 'Scenic wood trails towering above coastal mountain ridges.' }
];
