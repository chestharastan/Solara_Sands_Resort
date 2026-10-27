/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, Bed, CalendarCheck, Image, Tags, Plus, Trash2, Edit, Save, 
  Check, X, RefreshCw, LayoutDashboard, Globe, AlertCircle, Sparkles
} from 'lucide-react';
import { Hotel, Room, Amenity, GalleryItem, BookingInquiry } from '../types';

interface AdminConsoleProps {
  hotel: Hotel;
  rooms: Room[];
  amenities: Amenity[];
  gallery: GalleryItem[];
  inquiries: BookingInquiry[];
  onUpdateHotel: (hotel: Hotel) => void;
  onSaveRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onUpdateInquiryStatus: (inquiryId: string, status: BookingInquiry['status']) => void;
  onAddGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  onDeleteGalleryItem: (id: string) => void;
  onAddAmenity: (amenity: Amenity) => void;
  onDeleteAmenity: (id: string) => void;
}

/** Photo thumbnail that degrades to a neutral "no photo" tile (empty URL or a broken link). */
function Thumb({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div role="img" aria-label={`${alt} – no photo yet`} className={`${className} grid place-items-center bg-stone-200 text-[9px] font-mono uppercase tracking-wider text-stone-500`}>
        No photo
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setBroken(true)} className={`${className} object-cover`} referrerPolicy="no-referrer" />;
}

export default function AdminConsole({
  hotel, rooms, amenities, gallery, inquiries,
  onUpdateHotel, onSaveRoom, onDeleteRoom, onUpdateInquiryStatus,
  onAddGalleryItem, onDeleteGalleryItem, onAddAmenity, onDeleteAmenity
}: AdminConsoleProps) {
  
  const [activeTab, setActiveTab] = useState<'info' | 'rooms' | 'inquiries' | 'gallery' | 'amenities'>('inquiries');
  
  // Hotel Info State overrides
  const [hotelName, setHotelName] = useState(hotel.name);
  const [hotelTagline, setHotelTagline] = useState(hotel.tagline);
  const [hotelDesc, setHotelDesc] = useState(hotel.description);
  const [hotelAddress, setHotelAddress] = useState(hotel.address);
  const [hotelPhone, setHotelPhone] = useState(hotel.phone);
  const [hotelEmail, setHotelEmail] = useState(hotel.email);
  const [hotelHero, setHotelHero] = useState(hotel.hero_image);
  const [infoSavedAlert, setInfoSavedAlert] = useState(false);

  // Rooms Form State overrides
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomPrice, setRoomPrice] = useState(150);
  const [roomCapacity, setRoomCapacity] = useState(2);
  const [roomSize, setRoomSize] = useState(40);
  const [roomImage, setRoomImage] = useState('');
  const [roomAmenities, setRoomAmenities] = useState<string[]>([]);
  const [showRoomForm, setShowRoomForm] = useState(false);

  // Gallery Add State overrides
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState<GalleryItem['category']>('Rooms');

  // Amenity Add State overrides
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityIcon, setNewAmenityIcon] = useState('Sparkles');

  // Utility to start editing a room
  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomDesc(room.description);
    setRoomPrice(room.price);
    setRoomCapacity(room.capacity);
    setRoomSize(room.size);
    setRoomImage(room.image);
    setRoomAmenities(room.amenities || []);
    setShowRoomForm(true);
  };

  // Start creating a room
  const startCreateRoom = () => {
    setEditingRoomId(null);
    setRoomName('');
    setRoomDesc('');
    setRoomPrice(150);
    setRoomCapacity(2);
    setRoomSize(40);
    setRoomImage('');
    setRoomAmenities([]);
    setShowRoomForm(true);
  };

  const handleSaveHotelInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHotel({
      ...hotel,
      name: hotelName,
      tagline: hotelTagline,
      description: hotelDesc,
      address: hotelAddress,
      phone: hotelPhone,
      email: hotelEmail,
      hero_image: hotelHero,
    });
    setInfoSavedAlert(true);
    setTimeout(() => setInfoSavedAlert(false), 3000);
  };

  const handleSaveRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;

    onSaveRoom({
      id: editingRoomId || `room_${Date.now()}`,
      hotel_id: hotel.id,
      name: roomName,
      description: roomDesc,
      price: Number(roomPrice),
      capacity: Number(roomCapacity),
      size: Number(roomSize),
      image: roomImage,
      amenities: roomAmenities
    });

    setShowRoomForm(false);
    setEditingRoomId(null);
  };

  const toggleRoomAmenity = (amenityId: string) => {
    if (roomAmenities.includes(amenityId)) {
      setRoomAmenities(roomAmenities.filter(id => id !== amenityId));
    } else {
      setRoomAmenities([...roomAmenities, amenityId]);
    }
  };

  const handleAddGalleryItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl) return;
    onAddGalleryItem({
      image_url: newGalleryUrl,
      category: newGalleryCategory
    });
    setNewGalleryUrl('');
  };

  const handleAddAmenitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenityName) return;
    onAddAmenity({
      id: `amenity_${Date.now()}`,
      name: newAmenityName,
      icon: newAmenityIcon
    });
    setNewAmenityName('');
  };

  return (
    <div id="admin-panel" className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
      
      {/* Top Banner Header */}
      <div className="bg-stone-900 px-6 py-5 flex flex-col md:flex-row items-center justify-between border-b border-stone-850 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-stone-950 font-bold">
            <LayoutDashboard className="w-5 h-4" />
          </div>
          <div>
            <h2 className="text-white font-sans font-semibold text-base flex items-center gap-1.5">
              Solara Sands Portal <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-mono uppercase font-bold">Staff Admin Console</span>
            </h2>
            <p className="text-stone-400 text-xs">Direct local sync state controller • Version 1.0 (MVP)</p>
          </div>
        </div>
        <div className="text-[11px] font-mono font-medium text-stone-400 flex items-center gap-2 bg-stone-850 border border-stone-880 rounded-lg px-3 py-1.5 align-middle">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Connected Locally
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[480px]">
        {/* Left Side: Navigation Links */}
        <div className="w-full lg:w-64 bg-stone-100 border-b lg:border-b-0 lg:border-r border-stone-200 py-4 flex lg:flex-col gap-1 px-3 overflow-x-auto lg:overflow-x-visible whitespace-nowrap lg:whitespace-normal">
          <button
            id="admin-tab-inquiries"
            onClick={() => setActiveTab('inquiries')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans tracking-wide uppercase flex items-center justify-between font-medium cursor-pointer transition-all ${
              activeTab === 'inquiries' 
                ? 'bg-white border-l-2 border-amber-600 text-stone-950 shadow-xs' 
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-stone-505" /> Booking Inquiries
            </span>
            {inquiries.filter(i => i.status === 'Pending').length > 0 && (
              <span className="bg-amber-600 text-white font-mono font-bold text-[9px] rounded-full px-1.5 py-0.5">
                {inquiries.filter(i => i.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            id="admin-tab-rooms"
            onClick={() => setActiveTab('rooms')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans tracking-wide uppercase flex items-center gap-2 font-medium cursor-pointer transition-all ${
              activeTab === 'rooms' 
                ? 'bg-white border-l-2 border-amber-600 text-stone-950 shadow-xs' 
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
            }`}
          >
            <Bed className="w-4 h-4 text-stone-505" /> Manage Luxury Rooms
          </button>

          <button
            id="admin-tab-info"
            onClick={() => setActiveTab('info')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans tracking-wide uppercase flex items-center gap-2 font-medium cursor-pointer transition-all ${
              activeTab === 'info' 
                ? 'bg-white border-l-2 border-amber-600 text-stone-950 shadow-xs' 
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
            }`}
          >
            <Building className="w-4 h-4 text-stone-505" /> Edit Hotel Profile
          </button>

          <button
            id="admin-tab-gallery"
            onClick={() => setActiveTab('gallery')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans tracking-wide uppercase flex items-center gap-2 font-medium cursor-pointer transition-all ${
              activeTab === 'gallery' 
                ? 'bg-white border-l-2 border-amber-600 text-stone-950 shadow-xs' 
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
            }`}
          >
            <Image className="w-4 h-4 text-stone-505" /> Gallery Configurator
          </button>

          <button
            id="admin-tab-amenities"
            onClick={() => setActiveTab('amenities')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans tracking-wide uppercase flex items-center gap-2 font-medium cursor-pointer transition-all ${
              activeTab === 'amenities' 
                ? 'bg-white border-l-2 border-amber-600 text-stone-950 shadow-xs' 
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
            }`}
          >
            <Tags className="w-4 h-4 text-stone-505" /> Service Amenities
          </button>
        </div>

        {/* Right Side: Tab Contents Panel */}
        <div className="flex-1 bg-white p-6 md:p-8">
          
          {/* TABS: EDIT HOTEL INFORMATION */}
          {activeTab === 'info' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-lg font-sans font-semibold text-stone-900 tracking-tight">Hotel Information</h3>
                  <p className="text-stone-500 text-xs">Configure public marketing headers, brand descriptions, and direct reservation details.</p>
                </div>
                <Building className="w-5 h-5 text-stone-400" />
              </div>

              {infoSavedAlert && (
                <div role="alert" className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg flex items-center gap-2 mb-4">
                  <Check className="w-4 h-4" /> Hotel profile successfully customized and saved.
                </div>
              )}

              <form onSubmit={handleSaveHotelInfo} className="space-y-4 font-sans text-xs md:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 text-xs font-semibold mb-1">Hotel/Brand Name</label>
                    <input
                      type="text"
                      required
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      className="w-full text-stone-900 border border-stone-250 px-3 py-2 rounded-lg outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-xs font-semibold mb-1">Branded Slogan Tagline</label>
                    <input
                      type="text"
                      required
                      value={hotelTagline}
                      onChange={(e) => setHotelTagline(e.target.value)}
                      className="w-full text-stone-900 border border-stone-250 px-3 py-2 rounded-lg outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 text-xs font-semibold mb-1">Detailed Editorial Summary Description</label>
                  <textarea
                    required
                    rows={4}
                    value={hotelDesc}
                    onChange={(e) => setHotelDesc(e.target.value)}
                    className="w-full text-stone-900 border border-stone-250 p-3 rounded-lg outline-hidden resize-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-stone-600 text-xs font-semibold mb-1">Physical Address</label>
                    <input
                      type="text"
                      required
                      value={hotelAddress}
                      onChange={(e) => setHotelAddress(e.target.value)}
                      className="w-full text-stone-900 border border-stone-250 px-3 py-2 rounded-lg outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-xs font-semibold mb-1">Telephone Hot-line</label>
                    <input
                      type="text"
                      required
                      value={hotelPhone}
                      onChange={(e) => setHotelPhone(e.target.value)}
                      className="w-full text-stone-900 border border-stone-250 px-3 py-2 rounded-lg outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-xs font-semibold mb-1">Public Reservation Email</label>
                    <input
                      type="email"
                      required
                      value={hotelEmail}
                      onChange={(e) => setHotelEmail(e.target.value)}
                      className="w-full text-stone-900 border border-stone-250 px-3 py-2 rounded-lg outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 text-xs font-semibold mb-1">Landing Hero Image URL</label>
                  <input
                    type="url"
                    value={hotelHero}
                    onChange={(e) => setHotelHero(e.target.value)}
                    className="w-full text-stone-900 border border-stone-250 px-3 py-2 rounded-lg outline-hidden text-xs font-mono"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">Optional. The landing hero is a live 3D scene; this image is only kept as a social-share / no-WebGL poster.</span>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-stone-900 hover:bg-stone-850 text-white font-medium text-xs tracking-wider uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Hotel Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TABS: MANAGE ROOMS */}
          {activeTab === 'rooms' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-lg font-sans font-semibold text-stone-900 tracking-tight">Accommodation Rooms</h3>
                  <p className="text-stone-500 text-xs">Define room options, flat nightly prices, guest limits, sizes, details, and active room amenities.</p>
                </div>
                {!showRoomForm && (
                  <button
                    onClick={startCreateRoom}
                    className="bg-stone-900 hover:bg-stone-850 text-white text-xs font-semibold tracking-wide uppercase px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Room Category
                  </button>
                )}
              </div>

              {showRoomForm ? (
                <form onSubmit={handleSaveRoomSubmit} className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                    <h4 className="text-stone-900 font-sans font-bold text-xs uppercase tracking-wider">
                      {editingRoomId ? 'Modify Stay Room Category' : 'Create New Luxury Room Option'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowRoomForm(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs font-semibold font-mono"
                    >
                      Close Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 text-xs font-semibold mb-1">Room Name</label>
                      <input
                        type="text"
                        required
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g. Master Sky Penthouse"
                        className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 text-xs font-semibold mb-1">Image URL <span className="font-normal text-stone-400">(optional – leave empty to show the photo placeholder)</span></label>
                      <input
                        type="url"
                        value={roomImage}
                        onChange={(e) => setRoomImage(e.target.value)}
                        className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-600 text-xs font-semibold mb-1">Accomodation Description</label>
                    <textarea
                      required
                      rows={2}
                      value={roomDesc}
                      onChange={(e) => setRoomDesc(e.target.value)}
                      placeholder="Detail features like layouts, private balconies, bath types, ocean outlooks, custom bedding..."
                      className="w-full text-stone-900 border border-stone-250 bg-white p-3 rounded-lg outline-hidden resize-none text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-stone-600 text-xs font-semibold mb-1">Price per Night ($)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={roomPrice}
                        onChange={(e) => setRoomPrice(Number(e.target.value))}
                        className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 text-xs font-semibold mb-1">Accomodation Capacity (Max Guests)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={roomCapacity}
                        onChange={(e) => setRoomCapacity(Number(e.target.value))}
                        className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 text-xs font-semibold mb-1">Accomodation Size (m²)</label>
                      <input
                        type="number"
                        required
                        min={5}
                        value={roomSize}
                        onChange={(e) => setRoomSize(Number(e.target.value))}
                        className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-600 text-xs font-semibold mb-2">Select Active Amenities for Room</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {amenities.map(amenity => {
                        const hasAmenity = roomAmenities.includes(amenity.id);
                        return (
                          <button
                            type="button"
                            key={amenity.id}
                            onClick={() => toggleRoomAmenity(amenity.id)}
                            className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between font-sans ${
                              hasAmenity 
                                ? 'bg-amber-500/10 border-amber-500 text-stone-900 font-semibold' 
                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                            }`}
                          >
                            <span>{amenity.name}</span>
                            {hasAmenity && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoomForm(false);
                        setEditingRoomId(null);
                      }}
                      className="border border-stone-305 hover:bg-stone-100 text-stone-700 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-stone-900 hover:bg-stone-850 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Room Stay
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div 
                      key={room.id} 
                      className="border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row gap-5 items-center justify-between"
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                        <Thumb src={room.image} alt={room.name} className="w-20 h-16 rounded-lg border border-stone-100 shadow-xs flex-shrink-0" />
                        <div className="text-center md:text-left">
                          <h4 className="text-stone-900 font-sans font-semibold text-sm leading-tight flex items-center gap-2 justify-center md:justify-start">
                            {room.name}
                          </h4>
                          <p className="text-stone-500 text-xs mt-0.5 max-w-md line-clamp-1">{room.description}</p>
                          <div className="flex items-center gap-3 text-stone-400 font-mono text-[10px] mt-1.5 justify-center md:justify-start">
                            <span className="text-stone-600 font-bold bg-stone-100 px-1.5 py-0.5 rounded-sm">${room.price}/night</span>
                            <span>{room.size} m²</span>
                            <span>Max {room.capacity} Guests</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-center md:justify-end">
                        <button
                          onClick={() => startEditRoom(room)}
                          className="p-2 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Room
                        </button>
                        <button
                          onClick={() => onDeleteRoom(room.id)}
                          className="p-2 border border-stone-200 text-red-500 hover:bg-red-50 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Delete room stays option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {rooms.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-stone-200 rounded-xl text-stone-400 text-xs">
                      No boutique rooms created in records. Click "Add Room Category" to create stays.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TABS: BOOKING INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-lg font-sans font-semibold text-stone-900 tracking-tight">Booking Inquiries</h3>
                  <p className="text-stone-500 text-xs">Review guest lead submissions, check requested stays timelines, and record concierge contact updates.</p>
                </div>
                <CalendarCheck className="w-5 h-5 text-stone-400" />
              </div>

              <div className="space-y-4">
                {inquiries.slice().reverse().map((inquiry) => {
                  const selectedRoom = rooms.find(r => r.id === inquiry.room_id) || { name: 'Unknown stay' };
                  
                  // Compute nights & price preview
                  let totalNights = 3;
                  try {
                    const diff = Math.abs(new Date(inquiry.check_out).getTime() - new Date(inquiry.check_in).getTime());
                    totalNights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                  } catch(e) {}

                  return (
                    <div 
                      key={inquiry.id} 
                      className={`border border-stone-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-6 transition-all hover:bg-stone-50/40`}
                    >
                      <div className="space-y-2 select-none">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-sans font-bold text-sm text-stone-900">
                            {inquiry.name}
                          </span>
                          <span className="text-stone-400 text-xs font-serif">
                            ({inquiry.email})
                          </span>
                          <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                            inquiry.status === 'Pending' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' 
                              : inquiry.status === 'Contacted' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : inquiry.status === 'Confirmed' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-stone-50 text-stone-500 border-stone-200'
                          }`}>
                            {inquiry.status}
                          </span>
                        </div>

                        {/* Inquiry Details table */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-stone-600 font-sans bg-stone-50 p-3 rounded-lg border border-stone-100/50">
                          <div>
                            <span className="block text-stone-400 text-[9px] uppercase font-mono">Accomodation</span>
                            <strong>{selectedRoom.name}</strong>
                          </div>
                          <div>
                            <span className="block text-stone-400 text-[9px] uppercase font-mono">Requested Span</span>
                            <span>{inquiry.check_in} to {inquiry.check_out} ({totalNights} nights)</span>
                          </div>
                          <div>
                            <span className="block text-stone-400 text-[9px] uppercase font-mono">Total Occupants</span>
                            <span>{inquiry.guests} guests</span>
                          </div>
                          <div>
                            <span className="block text-stone-400 text-[9px] uppercase font-mono">Created Date</span>
                            <span className="font-mono text-[10px]">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {inquiry.message && (
                          <div className="text-xs text-stone-600 bg-amber-500/5 px-3 py-2 rounded-md border-l-2 border-amber-500/30">
                            <strong className="font-serif">Message: </strong>"{inquiry.message}"
                          </div>
                        )}
                      </div>

                      {/* Status controllers */}
                      <div className="flex flex-col gap-2 flex-shrink-0 w-full lg:w-44 lg:items-end justify-center">
                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest text-left lg:text-right">Change Inquiry Status</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {(['Pending', 'Contacted', 'Confirmed', 'Cancelled'] as const).map((st) => (
                            <button
                              id={`status-btn-${inquiry.id}-${st}`}
                              key={st}
                              onClick={() => onUpdateInquiryStatus(inquiry.id, st)}
                              className={`px-1.5 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                                inquiry.status === st 
                                  ? 'bg-stone-900 border border-stone-900 text-white' 
                                  : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-800'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}

                {inquiries.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-stone-200 rounded-xl text-stone-400 text-xs">
                    💬 No resort inquiries logs found yet. Guest submissions will appear here instantly!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TABS: CONFIG GALLERY */}
          {activeTab === 'gallery' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-lg font-sans font-semibold text-stone-900 tracking-tight">Gallery Configurator</h3>
                  <p className="text-stone-500 text-xs">Enforce brand visual proofs by uploading photo assets paired with categorized filters.</p>
                </div>
                <Image className="w-5 h-5 text-stone-400" />
              </div>

              {/* Add image form */}
              <form onSubmit={handleAddGalleryItemSubmit} className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end mb-6 font-sans">
                <div className="flex-1 w-full text-xs">
                  <label className="block text-stone-600 text-xs font-semibold mb-1">New Image URL (e.g. Unsplash)</label>
                  <input
                    type="url"
                    required
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs font-mono"
                  />
                </div>

                <div className="w-full md:w-44 text-xs">
                  <label className="block text-stone-600 text-xs font-semibold mb-1">Grid Filter Category</label>
                  <select
                    value={newGalleryCategory}
                    onChange={(e) => setNewGalleryCategory(e.target.value as GalleryItem['category'])}
                    className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs cursor-pointer"
                  >
                    {['Rooms', 'Lobby', 'Pool', 'Restaurant', 'Exterior'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-850 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer w-full md:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" /> Add Asset Photo
                </button>
              </form>

              {/* Display existing images listed in grid with trash action */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-stone-100 shadow-xs bg-stone-50">
                    <Thumb src={item.image_url} alt={item.category} className="w-full h-full transition-transform group-hover:scale-105" />
                    <div className="absolute top-2 left-2 text-[8px] bg-stone-900/80 backdrop-blur-xs text-white uppercase tracking-wider font-mono px-2 py-0.5 rounded-md font-bold">
                      {item.category}
                    </div>
                    
                    {/* Delete overlay hover */}
                    <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => onDeleteGalleryItem(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full scale-90 group-hover:scale-100 transition-transform shadow-md cursor-pointer"
                        title="Delete photo from records"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TABS: EDIT SERVICE AMENITIES */}
          {activeTab === 'amenities' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-lg font-sans font-semibold text-stone-900 tracking-tight">Service Amenities</h3>
                  <p className="text-stone-500 text-xs">Define general amenities and facilities provided across the hotel resorts stays.</p>
                </div>
                <Tags className="w-5 h-5 text-stone-400" />
              </div>

              {/* Add amenity form */}
              <form onSubmit={handleAddAmenitySubmit} className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end mb-6 font-sans">
                <div className="flex-1 w-full text-xs">
                  <label className="block text-stone-600 text-xs font-semibold mb-1">Amenity Name</label>
                  <input
                    type="text"
                    required
                    value={newAmenityName}
                    onChange={(e) => setNewAmenityName(e.target.value)}
                    placeholder="e.g. Complementary Yoga Deck"
                    className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs"
                  />
                </div>

                <div className="w-full md:w-56 text-xs">
                  <label className="block text-stone-600 text-xs font-semibold mb-1">Visual Icon Style</label>
                  <select
                    value={newAmenityIcon}
                    onChange={(e) => setNewAmenityIcon(e.target.value)}
                    className="w-full text-stone-900 border border-stone-250 bg-white px-3 py-2 rounded-lg outline-hidden text-xs cursor-pointer"
                  >
                    <option value="Sparkles">Sparkles (Aesthetic)</option>
                    <option value="Wifi">Wifi (Internet)</option>
                    <option value="Waves">Waves (Water/Pool/Spa)</option>
                    <option value="Utensils">Utensils (Food/Dining)</option>
                    <option value="Car">Car (Shuttles/Parking)</option>
                    <option value="Compass">Compass (Navigation/Valet)</option>
                    <option value="Briefcase">Briefcase (Corporate Office)</option>
                    <option value="Coffee">Coffee (Cafes/Breakfast)</option>
                    <option value="Clock">Clock (Concierge hours)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-850 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer w-full md:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" /> Add Amenity
                </button>
              </form>

              {/* Existing amenities grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {amenities.map((item) => (
                  <div key={item.id} className="border border-stone-200 rounded-xl p-3 flex items-center justify-between font-sans">
                    <div>
                      <h4 className="text-stone-900 font-semibold text-xs leading-none">{item.name}</h4>
                      <span className="text-[9px] font-mono font-medium text-stone-400 uppercase mt-1 inline-block bg-stone-100 rounded-md px-1 py-0.5">Icon: {item.icon}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => onDeleteAmenity(item.id)}
                      className="text-stone-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer"
                      title="Remove Amenity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
