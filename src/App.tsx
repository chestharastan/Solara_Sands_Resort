/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Waves, Sparkles, Coffee, Briefcase, Clock, Utensils, Wifi, Car, Compass, 
  Mail, Phone, MapPin, Star, ShieldCheck, Heart, ArrowRight, UserCheck, 
  Info, LayoutDashboard, Globe, ChevronRight, Check, X, Shield, Menu
} from 'lucide-react';

import { Hotel, Room, Amenity, GalleryItem, Review, BookingInquiry } from './types';
import { 
  INITIAL_HOTEL, INITIAL_AMENITIES, INITIAL_ROOMS, 
  INITIAL_GALLERY, INITIAL_REVIEWS 
} from './data';

import InteractiveMap from './components/InteractiveMap';
import ReviewSection from './components/ReviewSection';
import BookingForm from './components/BookingForm';
import AdminConsole from './components/AdminConsole';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- DATABASE STATE WITH LOCALSTORAGE SYNCS ---
  const [hotel, setHotel] = useState<Hotel>(() => {
    const saved = localStorage.getItem('solara_hotel');
    return saved ? JSON.parse(saved) : INITIAL_HOTEL;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('solara_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [amenities, setAmenities] = useState<Amenity[]>(() => {
    const saved = localStorage.getItem('solara_amenities');
    return saved ? JSON.parse(saved) : INITIAL_AMENITIES;
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('solara_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('solara_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [inquiries, setInquiries] = useState<BookingInquiry[]>(() => {
    const saved = localStorage.getItem('solara_inquiries');
    return saved ? JSON.parse(saved) : [
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
        created_at: new Date().toISOString()
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
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  });

  // --- LOCAL PERSISTENCE TRIGGERS ---
  useEffect(() => {
    localStorage.setItem('solara_hotel', JSON.stringify(hotel));
  }, [hotel]);

  useEffect(() => {
    localStorage.setItem('solara_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('solara_amenities', JSON.stringify(amenities));
  }, [amenities]);

  useEffect(() => {
    localStorage.setItem('solara_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('solara_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('solara_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  // --- INTERACTION & NAVIGATION STATE ---
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('All');
  const [bookingRoomId, setBookingRoomId] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auto-scroll utility
  const scrollToSection = (elementId: string) => {
    setMobileMenuOpen(false);
    document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBookRoomSelection = (roomId: string) => {
    setBookingRoomId(roomId);
    scrollToSection('booking-form-anchor');
  };

  // --- ACTIONS FOR ADMIN MUTATIONS ---
  const handleUpdateHotel = (updatedHotel: Hotel) => {
    setHotel(updatedHotel);
  };

  const handleSaveRoom = (savedRoom: Room) => {
    setRooms(prev => {
      const exists = prev.some(r => r.id === savedRoom.id);
      if (exists) {
        return prev.map(r => r.id === savedRoom.id ? savedRoom : r);
      }
      return [...prev, savedRoom];
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const handleUpdateInquiryStatus = (inquiryId: string, status: BookingInquiry['status']) => {
    setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status } : i));
  };

  const handleAddGalleryItem = (newItem: Omit<GalleryItem, 'id'>) => {
    const item: GalleryItem = {
      ...newItem,
      id: `g_${Date.now()}`
    };
    setGallery(prev => [...prev, item]);
  };

  const handleDeleteGalleryItem = (id: string) => {
    setGallery(prev => prev.filter(item => item.id !== id));
  };

  const handleAddAmenity = (newAmenity: Amenity) => {
    setAmenities(prev => [...prev, newAmenity]);
  };

  const handleDeleteAmenity = (id: string) => {
    setAmenities(prev => prev.filter(item => item.id !== id));
  };

  // --- ACTIONS FOR VISITOR SUBMISSIONS ---
  const handleAddInquiry = (inquiryData: Omit<BookingInquiry, 'id' | 'status' | 'created_at'>) => {
    const inquiry: BookingInquiry = {
      ...inquiryData,
      id: `inquiry_${Date.now()}`,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    setInquiries(prev => [...prev, inquiry]);
  };

  const handleAddReview = (reviewData: Omit<Review, 'id' | 'date'>) => {
    const review: Review = {
      ...reviewData,
      id: `r_${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
    setReviews(prev => [review, ...prev]);
  };

  // Filter gallery list
  const filteredGallery = selectedGalleryCategory === 'All'
    ? gallery
    : gallery.filter(item => item.category === selectedGalleryCategory);

  // Dictionary lookup for Lucide Icon mappings
  const renderAmenityIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Wifi': return <Wifi className={className} />;
      case 'Waves': return <Waves className={className} />;
      case 'Utensils': return <Utensils className={className} />;
      case 'Car': return <Car className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Briefcase': return <Briefcase className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'Clock': return <Clock className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors relative antialiased">
      
      {/* Dynamic Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-brand-sand/95 backdrop-blur-md border-b border-brand-divider z-50 flex items-center justify-between px-4 md:px-8 xl:px-12 shadow-xs transition-all">
        <button 
          id="nav-logo"
          onClick={() => {
            setIsAdminMode(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-left flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-brand-sage flex items-center justify-center font-serif italic text-base text-white hover:bg-brand-sage-hover transition-all">
            S
          </div>
          <div>
            <h1 className="text-brand-charcoal font-serif font-bold text-sm tracking-wide leading-none">{hotel.name}</h1>
            <span className="text-[9px] font-mono tracking-widest text-brand-muted uppercase">{hotel.address.split(',')[1]?.trim() || 'Coastline'} Resort</span>
          </div>
        </button>

        {/* Desktop jump section links */}
        {!isAdminMode ? (
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-sans font-semibold tracking-wider uppercase text-stone-600">
            <button id="nav-btn-home" onClick={() => scrollToSection('home-hero')} className="hover:text-stone-950 cursor-pointer">Lobby</button>
            <button id="nav-btn-rooms" onClick={() => scrollToSection('rooms-block')} className="hover:text-stone-950 cursor-pointer">Suites</button>
            <button id="nav-btn-facilities" onClick={() => scrollToSection('facilities-block')} className="hover:text-stone-950 cursor-pointer">Amenities</button>
            <button id="nav-btn-gallery" onClick={() => scrollToSection('gallery-block')} className="hover:text-stone-950 cursor-pointer">Gallery</button>
            <button id="nav-btn-location" onClick={() => scrollToSection('location-block')} className="hover:text-stone-950 cursor-pointer">Location</button>
            <button id="nav-btn-reviews" onClick={() => scrollToSection('reviews-block')} className="hover:text-stone-950 cursor-pointer">Reviews</button>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-brand-charcoal bg-brand-sand-dark rounded-full px-4 py-1.5 border border-brand-border">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> Active Administration Workspace
          </div>
        )}

        {/* Portal Switching buttons */}
        <div className="hidden md:flex items-center gap-3">
          {!isAdminMode ? (
            <button
              id="goto-book-cta"
              onClick={() => scrollToSection('booking-form-anchor')}
              className="bg-brand-sage hover:bg-brand-sage-hover text-white text-[11px] font-sans font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm"
            >
              Book Your Experience
            </button>
          ) : (
            <button
              id="back-to-lobby-cta"
              onClick={() => setIsAdminMode(false)}
              className="border border-brand-border hover:border-brand-sage text-brand-charcoal hover:bg-brand-sand-dark text-[11px] font-sans font-semibold uppercase tracking-wider px-4 py-2.5 rounded-full transition-all cursor-pointer"
            >
              ← Back to Resort View
            </button>
          )}

          <button
            id="admin-toggle-switch"
            onClick={() => {
              setIsAdminMode(!isAdminMode);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`text-[10px] uppercase font-mono px-4 py-2 rounded-full flex items-center gap-1.5 transition-all outline-hidden cursor-pointer ${
              isAdminMode 
                ? 'bg-brand-sage hover:bg-brand-sage-hover text-white font-bold shadow-sm' 
                : 'bg-brand-sand-dark border border-brand-border text-brand-charcoal hover:bg-brand-sand-dark/60'
            }`}
          >
            {isAdminMode ? '🔑 Close Portal' : '🔑 Staff Portal'}
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            id="mobile-admin-btn"
            onClick={() => {
              setIsAdminMode(!isAdminMode);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[10px] uppercase font-mono p-2 rounded bg-stone-100 text-stone-700"
          >
            {isAdminMode ? 'Exit Desk' : 'Staff Desk'}
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded border border-stone-100 text-stone-800"
            aria-label="Toggle menu Options"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-brand-charcoal/25 backdrop-blur-md pt-20 flex flex-col items-center"
          >
            <motion.div 
              initial={{ scale: 0.95, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="bg-brand-sand w-5/6 rounded-[32px] p-6 border border-brand-border shadow-xl flex flex-col gap-4 text-center"
            >
              <h4 className="font-serif font-bold text-brand-charcoal border-b border-brand-divider pb-2">{hotel.name}</h4>
              <div className="flex flex-col gap-3 font-semibold text-brand-charcoal/80 text-sm">
                <button onClick={() => { setIsAdminMode(false); scrollToSection('home-hero'); }} className="py-1 hover:text-brand-sage">Resort Lobby</button>
                <button onClick={() => { setIsAdminMode(false); scrollToSection('rooms-block'); }} className="py-1 hover:text-brand-sage">Luxury Suites</button>
                <button onClick={() => { setIsAdminMode(false); scrollToSection('facilities-block'); }} className="py-1 hover:text-brand-sage">Facilities</button>
                <button onClick={() => { setIsAdminMode(false); scrollToSection('gallery-block'); }} className="py-1 hover:text-brand-sage">Photo Gallery</button>
                <button onClick={() => { setIsAdminMode(false); scrollToSection('location-block'); }} className="py-1 hover:text-brand-sage">Location Map</button>
                <button onClick={() => { setIsAdminMode(false); scrollToSection('reviews-block'); }} className="py-1 hover:text-brand-sage">Reviews</button>
                <button onClick={() => { setIsAdminMode(false); scrollToSection('booking-form-anchor'); }} className="py-2.5 bg-brand-sage text-white rounded-full mt-2 hover:bg-brand-sage-hover">Book Now</button>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-brand-muted font-mono text-xs uppercase underline tracking-wider pt-2 mt-2"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust container top-margin for static fixed navbar */}
      <main className="flex-1 mt-16 max-w-7xl mx-auto w-full px-4 md:px-8 xl:px-12 py-8 space-y-16">
        
        {/* ==================== WORKSPACE: STAFF OFFICE DESK VIEW ==================== */}
        {isAdminMode ? (
          <div className="space-y-6">
            <div className="bg-brand-sand-dark border border-brand-border p-4 rounded-[24px] flex items-start gap-3 select-none">
              <Info className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-brand-charcoal leading-relaxed font-sans">
                <strong>Local sandbox environment active:</strong> Use this panel to adjust room layouts, customize prices, or update descriptions. Any modifications you authorize here instantly change the visitor frontpage below. You can toggle back using the top <strong>Lobby</strong> views.
              </div>
            </div>

            <AdminConsole
              hotel={hotel}
              rooms={rooms}
              amenities={amenities}
              gallery={gallery}
              inquiries={inquiries}
              onUpdateHotel={handleUpdateHotel}
              onSaveRoom={handleSaveRoom}
              onDeleteRoom={handleDeleteRoom}
              onUpdateInquiryStatus={handleUpdateInquiryStatus}
              onAddGalleryItem={handleAddGalleryItem}
              onDeleteGalleryItem={handleDeleteGalleryItem}
              onAddAmenity={handleAddAmenity}
              onDeleteAmenity={handleDeleteAmenity}
            />
          </div>
        ) : (
          
          // ==================== WORKSPACE: VISITOR RECEPTION & LOBBY VIEW ====================
          <div className="space-y-16">
            
            {/* 1. HERO HOME BANNER */}
            <motion.header 
              id="home-hero" 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-[480px] md:h-[580px] rounded-[32px] overflow-hidden shadow-md flex items-center justify-center p-6 md:p-12 text-center text-white select-none"
            >
              
              {/* Cover background images with visual backdrop filter overlay */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <motion.img 
                  src={hotel.hero_image} 
                  alt={hotel.name} 
                  initial={{ scale: 1.02 }}
                  animate={{ scale: [1.02, 1.08, 1.02] }}
                  transition={{ 
                    duration: 30, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-charcoal/45 backdrop-blur-[1px]" />
              </div>
 
              {/* Central Text contents */}
              <div className="relative z-10 max-w-3xl space-y-4 md:space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                >
                  <span className="text-brand-charcoal bg-brand-sand-dark border border-brand-border text-[10px] md:text-xs uppercase font-bold px-4 py-1.5 rounded-full inline-block mb-3 shadow-xs">
                    🌟 Est. 2026 Coastal Escape
                  </span>
                  <h2 className="text-4xl md:text-5xl xl:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
                    {hotel.name}
                  </h2>
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-stone-100 font-serif italic text-base md:text-xl font-normal max-w-2xl mx-auto"
                >
                  "{hotel.tagline}"
                </motion.p>
 
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.6 }}
                  className="text-stone-200/95 text-xs md:text-sm font-sans max-w-xl mx-auto leading-relaxed font-light"
                >
                  Experience a sanctuary where premium architecture converges with pristine ocean shores. Our bespoke resort delivers organic spa curations and a high-end rooftop dining atmosphere.
                </motion.p>
 
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-center"
                >
                  <button
                    id="hero-book-now-cta"
                    onClick={() => scrollToSection('booking-form-anchor')}
                    className="w-full sm:w-auto bg-brand-sage hover:bg-brand-sage-hover text-white text-xs md:text-sm font-sans font-bold uppercase tracking-wider px-7 py-4 rounded-full transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95"
                  >
                    Confirm Stay Experience
                  </button>
                  <button
                    id="hero-explore-suites-cta"
                    onClick={() => scrollToSection('rooms-block')}
                    className="w-full sm:w-auto border border-white/40 hover:border-white text-white bg-white/5 hover:bg-white/15 text-xs md:text-sm font-sans font-bold uppercase tracking-wider px-7 py-4 rounded-full transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    Explore Stay Suites
                  </button>
                </motion.div>
              </div>
 
              {/* Highlights overlay badges for quick confidence answers */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.7 }}
                className="absolute bottom-6 left-6 right-6 hidden md:flex items-center justify-around bg-brand-charcoal/40 backdrop-blur-md rounded-2xl border border-white/10 py-4 text-xs font-sans tracking-wide font-medium"
              >
                <span className="flex items-center gap-2 hover:text-brand-sand-dark transition-colors"><Wifi className="w-4 h-4 text-brand-sand-dark" /> Complimentary Wi-Fi</span>
                <span className="flex items-center gap-2 hover:text-brand-sand-dark transition-colors"><Waves className="w-4 h-4 text-brand-sand-dark" /> Heated Sky Pool</span>
                <span className="flex items-center gap-2 hover:text-brand-sand-dark transition-colors"><Utensils className="w-4 h-4 text-brand-sand-dark" /> Michelin Chef Cuisine</span>
                <span className="flex items-center gap-2 hover:text-brand-sand-dark transition-colors"><Car className="w-4 h-4 text-brand-sand-dark" /> Private Valet & Transfers</span>
              </motion.div>
            </motion.header>

            {/* 2. SUMMARY DESCRIPTION BLOCK */}
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="bg-white rounded-[32px] border border-brand-border p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center select-none"
            >
              <div className="md:w-2/3 space-y-4">
                <h3 className="font-serif text-2xl md:text-3xl text-brand-charcoal font-bold max-w-lg">
                  Designed from natural stone and ocean wind drafts to soothe your getaway.
                </h3>
                <p className="text-brand-muted text-sm leading-relaxed font-sans">
                  {hotel.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-brand-charcoal pt-2 font-sans">
                  <span className="flex items-center gap-2 bg-brand-sand-dark border border-brand-border rounded-full px-4 py-2"><ShieldCheck className="w-4 h-4 text-brand-sage" /> Global Health Compliance Verified</span>
                  <span className="flex items-center gap-2 bg-brand-sand-dark border border-brand-border rounded-full px-4 py-2"><Heart className="w-4 h-4 text-rose-500" /> Certificate of Excellence Stay Rating</span>
                </div>
              </div>
              
              {/* Right: Small stat panel */}
              <div className="md:w-1/3 bg-brand-sand-dark/60 border border-brand-border rounded-[24px] p-6 w-full space-y-4 text-center">
                <div>
                  <div className="text-3xl font-serif font-bold text-brand-charcoal leading-none">4.8 ★</div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-brand-muted mt-1.5 block">Average Guest stays score</span>
                </div>
                <div className="border-t border-brand-divider my-3"></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong className="text-brand-charcoal block leading-tight">24-hour</strong>
                    <span className="text-[9px] text-brand-muted block mt-0.5">Concierge desk</span>
                  </div>
                  <div>
                    <strong className="text-brand-charcoal block leading-tight">100%</strong>
                    <span className="text-[9px] text-brand-muted block mt-0.5">Privacy assured</span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 3. ROOMS PAGE & SUITES */}
            <section id="rooms-block" className="space-y-6">
              <div className="text-center space-y-2 select-none">
                <span className="text-brand-sage bg-brand-sand-dark border border-brand-border text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block font-sans">
                  Accommodation Stays
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-950 tracking-tight">
                  Luxury Suites & Curate Retreats
                </h3>
                <p className="text-stone-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-sans">
                  Choose from custom architectural structures, each pre-stocked with bespoke organic linen, state-of-the-art climate zone locks, and ocean visibility maps.
                </p>
              </div>

              {/* Suites list map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {rooms.map((room) => {
                  const verifiedRoomAmenities = (room.amenities || []).map(id => amenities.find(a => a.id === id)).filter(Boolean) as Amenity[];
                  
                  return (
                    <motion.article
                      id={`room-card-${room.id}`}
                      key={room.id}
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.65 }}
                      className="bg-white border border-brand-border rounded-[32px] overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Stay photo */}
                        <div className="relative aspect-video w-full overflow-hidden bg-stone-50">
                          <img 
                            src={room.image} 
                            alt={room.name} 
                            className="w-full h-full object-cover select-none"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 right-4 bg-brand-charcoal/90 backdrop-blur-xs border border-brand-border/25 text-white font-mono text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full">
                            ✨ ${room.price} <span className="text-stone-300 font-normal font-sans">/ Night</span>
                          </div>
                        </div>

                        {/* Stays info */}
                        <div className="p-6 md:p-8 space-y-4">
                          <div>
                            <div className="flex items-center gap-3 text-stone-400 font-mono text-[10px] uppercase font-bold select-none">
                              <span className="flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-stone-350" /> {room.size} m² area</span>
                              <span>•</span>
                              <span>Max {room.capacity} Stays occupancies</span>
                            </div>
                            <h4 className="text-stone-900 font-sans font-semibold text-lg md:text-xl tracking-tight mt-1">
                              {room.name}
                            </h4>
                          </div>

                          <p className="text-stone-605 text-xs md:text-sm leading-relaxed font-sans font-normal text-stone-600">
                            {room.description}
                          </p>

                          {/* Specific Suite icons lists */}
                          {verifiedRoomAmenities.length > 0 && (
                            <div className="pt-3 border-t border-stone-50">
                              <span className="text-[9px] uppercase tracking-wider font-mono text-brand-muted block mb-2 font-bold select-none">Suite Amenities included:</span>
                              <div className="flex flex-wrap gap-2 text-brand-charcoal text-xs font-sans font-medium">
                                {verifiedRoomAmenities.map((am) => (
                                  <span key={am.id} className="flex items-center gap-1.5 bg-brand-sand border border-brand-border px-3 py-1 rounded-full text-brand-charcoal">
                                    {renderAmenityIcon(am.icon, "w-3 h-3 text-brand-sage")}
                                    <span>{am.name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card triggers */}
                      <div className="p-6 md:px-8 md:pb-8 pt-0 border-t border-stone-50">
                        <button
                          id={`book-room-btn-${room.id}`}
                          onClick={() => handleBookRoomSelection(room.id)}
                          className="w-full bg-brand-sage hover:bg-brand-sage-hover text-white text-xs font-sans tracking-wide uppercase px-5 py-3 rounded-full font-medium transition-all cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          Book Stay Selection <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                    </motion.article>
                  );
                })}
              </div>
            </section>

            {/* 4. FACILITIES & AMENITIES BENTO BOX */}
            <section id="facilities-block" className="space-y-6">
              <div className="text-center space-y-2 select-none">
                <span className="text-brand-sage bg-brand-sand-dark border border-brand-border text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block font-sans">
                  Resort Facilities
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-905 tracking-tight">
                  Resort Experience & Amenities
                </h3>
                <p className="text-stone-505 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-sans">
                  A perfect blend of active visual and physical wellness points curated by our around-the-clock concierge experts.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
                
                {/* Cell 1: Facilities */}
                <motion.div 
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  whileHover={{ y: -6, shadow: "0 10px 25px -5px rgba(90,90,64,0.06)" }}
                  className="bg-white border border-brand-border rounded-[32px] p-6 md:p-8 shadow-xs flex flex-col justify-between transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-full bg-brand-sand-dark border border-brand-border flex items-center justify-center text-brand-sage shadow-xs">
                      <Waves className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-stone-900 font-sans font-semibold text-base">Scenic Infrastructure</h4>
                      <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                        Relax at our state-of-the-art infinity waters, fully-equipped gym tracks, or cliffside hydrotherapy spas.
                      </p>
                    </div>
                  </div>
                  
                  <ul className="text-xs text-stone-600 font-sans font-medium space-y-2 mt-6 pt-4 border-t border-stone-50">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Open-air Infinity Heated Pool</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Cardiovascular Technogym Equipment</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Saltwater Hydro-Spas Baths</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Private Ocean Meditation Decks</li>
                  </ul>
                </motion.div>

                {/* Cell 2: Food & Beverage */}
                <motion.div 
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  whileHover={{ y: -6, shadow: "0 10px 25px -5px rgba(90,90,64,0.06)" }}
                  className="bg-white border border-brand-border rounded-[32px] p-6 md:p-8 shadow-xs flex flex-col justify-between transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-full bg-brand-sand-dark border border-brand-border flex items-center justify-center text-brand-sage shadow-xs">
                      <Utensils className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-stone-900 font-sans font-semibold text-base">Elegance Dining</h4>
                      <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                        Indulge in seasonal tasting menus sourced with local organic cliffside farms and curated microbrand wines.
                      </p>
                    </div>
                  </div>

                  <ul className="text-xs text-stone-600 font-sans font-medium space-y-2 mt-6 pt-4 border-t border-stone-50">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Michelin Chef Cliffside Restaurant</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Sunset Whiskey Lounge Bar</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> organic Sea-spray Terrace breakfast</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> In-room fine dining options</li>
                  </ul>
                </motion.div>

                {/* Cell 3: Support services */}
                <motion.div 
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  whileHover={{ y: -6, shadow: "0 10px 25px -5px rgba(90,90,64,0.06)" }}
                  className="bg-white border border-brand-border rounded-[32px] p-6 md:p-8 shadow-xs flex flex-col justify-between transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-full bg-brand-sand-dark border border-brand-border flex items-center justify-center text-brand-sage shadow-xs">
                      <Briefcase className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-stone-900 font-sans font-semibold text-base">Tailor Services</h4>
                      <p className="text-stone-505 text-xs mt-1 leading-relaxed">
                        Enjoy absolute freedom. Our stewards oversee everything from valet parking to chartered sea transport.
                      </p>
                    </div>
                  </div>

                  <ul className="text-xs text-stone-600 font-sans font-medium space-y-2 mt-6 pt-4 border-t border-stone-50">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Complimentary Airport Valet Car</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Express organic laundry services</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> 24-Hour dedicated guest butler</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-sage" /> Local excursions maps & tickets</li>
                  </ul>
                </motion.div>

              </div>
            </section>

            {/* 5. PHOTO GALLERY PORTFOLIO */}
            <section id="gallery-block" className="space-y-6">
              <div className="text-center space-y-2 select-none">
                <span className="text-brand-sage bg-brand-sand-dark border border-brand-border text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block font-sans">
                  Brand Aesthetics
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                  Visual Resort Gallery
                </h3>
                
                {/* Category filters */}
                <div className="flex flex-wrap gap-1.5 justify-center pt-3 font-sans max-w-lg mx-auto">
                  {['All', 'Rooms', 'Lobby', 'Pool', 'Restaurant', 'Exterior'].map((cat) => (
                    <button
                      id={`gallery-filter-${cat}`}
                      key={cat}
                      onClick={() => setSelectedGalleryCategory(cat)}
                      className={`px-4 py-2 rounded-full border text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                        selectedGalleryCategory === cat
                          ? 'bg-brand-sage border-brand-sage text-white shadow-sm'
                          : 'bg-white border-brand-border text-brand-charcoal hover:bg-brand-sand-dark'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos grid */}
              <motion.div 
                layout 
                className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5"
              >
                <AnimatePresence mode="popLayout">
                  {filteredGallery.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      key={item.id} 
                      className="group relative overflow-hidden rounded-[24px] border border-brand-border shadow-xs aspect-[4/3] bg-brand-sand-dark cursor-pointer"
                    >
                      <img 
                        src={item.image_url} 
                        alt={item.category} 
                        className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      {/* Badge text on lower left hover */}
                      <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none md:p-4">
                        <span className="text-[10px] text-white uppercase font-mono tracking-widest font-bold bg-brand-charcoal/80 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-full transition-all duration-300 translate-y-3 group-hover:translate-y-0">
                          {item.category} Area
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* 6. NEIGHBORHOOD LOCATION SECTION */}
            <section id="location-block" className="space-y-6">
              <div className="text-center space-y-2 select-none">
                <span className="text-brand-sage bg-brand-sand-dark border border-brand-border text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block font-sans">
                  The Surroundings
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-905 tracking-tight">
                  Unveiling the Wilderness Location
                </h3>
              </div>

              {/* Interactive map display */}
              <InteractiveMap address={hotel.address} />
            </section>

            {/* 7. REVIEWS & TESTIMONIALS SECTION */}
            <section id="reviews-block" className="space-y-6">
              <div className="text-center space-y-2 select-none">
                <span className="text-brand-sage bg-brand-sand-dark border border-brand-border text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block font-sans">
                  Guest Book Reviews
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-950 tracking-tight">
                  Experiences From Our Stays Guests
                </h3>
              </div>

              {/* Display component */}
              <ReviewSection 
                reviews={reviews} 
                onAddReview={handleAddReview} 
              />
            </section>

            {/* 8. CONTACT & RESERVATION INQUIRIES BLOCK */}
            <section id="booking-form-anchor" className="space-y-6 pt-4">
              <div className="text-center space-y-2 select-none">
                <span className="text-brand-sage bg-brand-sand-dark border border-brand-border text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block font-sans">
                  Secure Stays
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                  Request Stay Manifest Details
                </h3>
              </div>

              {/* Display form and rate estimations */}
              <BookingForm 
                rooms={rooms} 
                selectedRoomId={bookingRoomId} 
                onAddInquiry={handleAddInquiry} 
              />
            </section>

          </div>
        )}

      </main>

      {/* ==================== FOOTER PANEL ==================== */}
      <footer className="bg-brand-charcoal text-white/70 font-sans text-xs pt-16 pb-12 select-none mt-20 border-t border-brand-charcoal">
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4">
            <h4 className="text-white font-serif font-bold text-base leading-none">{hotel.name}</h4>
            <p className="text-[#c1c1b3] font-sans text-xs leading-relaxed max-w-xs">
              "An ocean retreat engineered with absolute privacy and architectural bliss."
            </p>
            <div className="flex gap-2">
              <span className="text-[10px] text-brand-sand bg-[#3c3c3a] px-3 py-1.5 rounded-full border border-brand-border/20 font-sans">
                ★ 4.8 Guest Stars
              </span>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            <h5 className="text-stone-300 font-bold uppercase text-[10px] tracking-widest font-mono">Resort Coordinates</h5>
            <p className="text-stone-500 leading-relaxed text-xs">
              {hotel.address}
            </p>
            <span className="text-[#e2e2d8] font-bold text-xs block mt-1">{hotel.phone}</span>
          </div>

          <div className="space-y-3 font-sans">
            <h5 className="text-[#e2e2d8] font-bold uppercase text-[10px] tracking-widest font-mono">Resort Navigation</h5>
            <div className="flex flex-col gap-1.5 text-xs">
              <button onClick={() => { setIsAdminMode(false); scrollToSection('rooms-block'); }} className="text-left hover:text-white cursor-pointer transition-colors">Luxury Suites</button>
              <button onClick={() => { setIsAdminMode(false); scrollToSection('facilities-block'); }} className="text-left hover:text-white cursor-pointer transition-colors">Facilities</button>
              <button onClick={() => { setIsAdminMode(false); scrollToSection('gallery-block'); }} className="text-left hover:text-white cursor-pointer transition-colors">Brand Galleries</button>
              <button onClick={() => { setIsAdminMode(false); scrollToSection('location-block'); }} className="text-left hover:text-white cursor-pointer transition-colors">Location Attractions</button>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            <h5 className="text-stone-300 font-bold uppercase text-[10px] tracking-widest font-mono">Assurance & Compliances</h5>
            <p className="text-stone-500 leading-relaxed text-xs">
              We warrant absolute confidential bookings and security operations. Fully certified sanitation, valet, and airport transfers.
            </p>
            <span className="text-[10px] text-[#e2e2d8] bg-brand-sage border border-brand-border/20 px-3 py-1 rounded-full inline-block font-sans">
              ✓ Verified Hospitality Stay MVP
            </span>
          </div>

        </div>

        {/* Marginal credits cleanly stated without telemetry logs */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-12 border-t border-brand-border/10 pt-6 flex flex-col md:flex-row items-center justify-between text-stone-605 text-[10px] md:text-xs">
          <p>© {new Date().getFullYear()} {hotel.name}. All hospitality rights reserved locally.</p>
          <p className="text-[#e2e2d8]/60 font-mono text-center md:text-right mt-2 md:mt-0 font-medium">Bespoke Boutique Experience Suite</p>
        </div>
      </footer>

    </div>
  );
}
