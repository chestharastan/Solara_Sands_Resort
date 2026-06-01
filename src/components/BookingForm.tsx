/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Users, MessageSquare, CreditCard, Sparkles, Check, CheckSquare } from 'lucide-react';
import { Room, BookingInquiry } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface BookingFormProps {
  rooms: Room[];
  selectedRoomId?: string;
  onAddInquiry: (inquiry: Omit<BookingInquiry, 'id' | 'status' | 'created_at'>) => void;
}

export default function BookingForm({ rooms, selectedRoomId = '', onAddInquiry }: BookingFormProps) {
  const [roomId, setRoomId] = useState(selectedRoomId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Direct text messages / callbacks alerts
  const [infoAlert, setInfoAlert] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRoomId) {
      setRoomId(selectedRoomId);
    }
  }, [selectedRoomId]);

  const activeRoom = rooms.find((r) => r.id === roomId);

  // Calculate pricing breakdown
  let nights = 0;
  let totalPrice = 0;
  if (checkIn && checkOut && activeRoom) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (end > start) {
      totalPrice = nights * activeRoom.price;
    } else {
      nights = 0;
    }
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !checkIn || !checkOut || !roomId) {
      setInfoAlert('Please complete all required fields.');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setInfoAlert('Check-out date must occur after the check-in date.');
      return;
    }

    onAddInquiry({
      name,
      email,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      message,
      room_id: roomId
    });

    setSubmitted(true);
    setInfoAlert(null);
    setTimeout(() => {
      setName('');
      setEmail('');
      setCheckIn('');
      setCheckOut('');
      setGuests(2);
      setMessage('');
      setSubmitted(false);
    }, 4000);
  };

  const handleWhatsApp = () => {
    const textMsg = `Hi, I'm interested in booking the ${activeRoom ? activeRoom.name : 'resort room'} for ${nights || 3} nights.`;
    window.open(`https://wa.me/85569260405?text=${encodeURIComponent(textMsg)}`, '_blank');
  };

  const handleCall = () => {
    setInfoAlert('Opening Dial Phone: Call +855 69 260 405 to reach the front concierge desk.');
    setTimeout(() => setInfoAlert(null), 5000);
  };

  return (
    <div id="booking-section" className="bg-brand-charcoal text-stone-100 rounded-[32px] p-6 md:p-8 lg:p-10 border border-brand-charcoal shadow-xl relative overflow-hidden">
      
      {/* Decorative ambient visual background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-sage/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left column: Contact Info & Pricing Breakdowns */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="text-white bg-brand-sage/30 border border-brand-sage/20 text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full inline-block mb-3">
              Inquire & Booking
            </span>
            <h3 className="text-2xl md:text-3xl font-sans font-medium text-white tracking-tight mb-4">
              Reserve Your Bespoke Coastal Retreat
            </h3>
            <p className="text-stone-300 text-xs md:text-sm leading-relaxed mb-6">
              Our reservation leads are processed within 2 hours. Submit a custom inquiry below or connect instantly with our around-the-clock resort concierge.
            </p>

            {/* Concierge channels details */}
            <div className="space-y-4 text-xs md:text-sm font-sans mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-brand-sand-dark">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-stone-400 text-[10px] uppercase font-mono">Concierge Line</div>
                  <button onClick={handleCall} className="text-white hover:text-brand-sand-dark transition-colors cursor-pointer text-left font-sans font-semibold">
                    +855 69 260 405
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-brand-sand-dark">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-stone-400 text-[10px] uppercase font-mono">Inquiry Mail</div>
                  <a href="mailto:chesthareahtan@gmail.com" className="text-white hover:text-brand-sand-dark transition-colors font-sans font-semibold font-normal">
                    chesthareahtan@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Estimate Card */}
          <AnimatePresence mode="wait">
            {activeRoom ? (
              <motion.div 
                key={activeRoom.id}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-[24px] p-5 md:p-6 mt-auto"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-brand-sand-dark" />
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#e2e2d8] font-bold">Estimated Stay Rates</h4>
                </div>
                
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs text-stone-300">{activeRoom.name}</span>
                  <span className="text-xs font-mono text-stone-400">${activeRoom.price} / night</span>
                </div>

                <AnimatePresence mode="wait">
                  {nights > 0 ? (
                    <motion.div 
                      key="summary-filled"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 bg-black/20 p-3 rounded-lg border border-white/5 overflow-hidden"
                    >
                      <div className="flex justify-between text-xs text-stone-300">
                        <span>Duration:</span>
                        <span className="font-mono text-stone-300">{nights} nights</span>
                      </div>
                      <div className="flex justify-between text-xs text-stone-300">
                        <span>Local Tax & Service:</span>
                        <span className="font-mono text-stone-300">Complimentary</span>
                      </div>
                      <div className="border-t border-white/10 my-2 pt-2 flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-white">Estimated Total:</span>
                        <span className="text-lg font-sans font-bold text-white">${totalPrice}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.p 
                      key="summary-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] text-brand-sand-dark italic font-sans leading-relaxed"
                    >
                      💡 Select Check-In / Check-Out dates on the right to simulate live price computations.
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                key="no-room"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/5 border border-white/10 rounded-[24px] p-5 text-center text-xs text-stone-450 italic"
              >
                Select an accommodation option on the right to review customized service quotes.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: The Form itself */}
        <div className="lg:col-span-7 bg-[#1e1e1c]/40 border border-white/10 p-6 md:p-8 rounded-[24px] backdrop-blur-xs">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center h-full">
              <div className="w-12 h-12 bg-white/10 text-brand-sand-dark rounded-full flex items-center justify-center border border-white/15 mb-4 animate-bounce">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-white font-sans font-medium text-lg mb-2">Request Transmitted Successfully</h4>
              <p className="text-[#e2e2d8] text-xs font-serif leading-relaxed max-w-sm">
                "Our reservation stewards have received your inquiry for the {activeRoom?.name}. A formal confirmation proposal has been issued to your email registry."
              </p>
              <p className="text-stone-450 text-[11px] mt-4 font-mono">
                Click Staff Portal above to review your inquiry details live!
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {infoAlert && (
                <div role="alert" className="p-3.5 bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded-[12px] text-xs font-sans">
                  {infoAlert}
                </div>
              )}

              {/* Room Selection Dropdown */}
              <div>
                <label className="block text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-bold">
                  Accommodation Selection <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full text-white bg-brand-charcoal border border-white/10 focus:border-brand-sage px-3 py-2.5 rounded-xl text-xs md:text-sm font-sans outline-hidden cursor-pointer"
                >
                  <option value="" disabled>--- Select a Luxury Room ---</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id} className="bg-brand-charcoal text-white">
                      {room.name} (${room.price} / night)
                    </option>
                  ))}
                </select>
              </div>

              {/* Basic Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-bold">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Grand Duke Harrison"
                    className="w-full text-white bg-brand-charcoal border border-white/10 focus:border-brand-sage px-3 py-2.5 rounded-xl text-xs md:text-sm font-sans outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-bold">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="harrison@estate.com"
                    className="w-full text-white bg-brand-charcoal border border-white/10 focus:border-brand-sage px-3 py-2.5 rounded-xl text-xs md:text-sm font-sans outline-hidden"
                  />
                </div>
              </div>

              {/* Check in / Check out / Guests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-bold">
                    <Calendar className="w-3 h-3 text-stone-400 inline mr-1" /> Check-In <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-white bg-brand-charcoal border border-white/10 focus:border-brand-sage px-3 py-2.5 rounded-xl text-xs font-sans outline-hidden cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-bold">
                    <Calendar className="w-3 h-3 text-stone-400 inline mr-1" /> Check-Out <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-white bg-brand-charcoal border border-white/10 focus:border-brand-sage px-3 py-2.5 rounded-xl text-xs font-sans outline-hidden cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-bold">
                    <Users className="w-3 h-3 text-stone-400 inline mr-1" /> Total Guests <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full text-white bg-brand-charcoal border border-white/10 focus:border-brand-sage px-3 py-2.5 rounded-xl text-xs font-sans outline-hidden cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num} className="bg-brand-charcoal text-white">
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Concierge requests text */}
              <div>
                <label className="block text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-bold">
                  Special Concierge Desires / Message
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Helicopter pad pickup coordinates, diet limitations, private cellars preferences, or high-floor requests..."
                  className="w-full text-white bg-brand-charcoal border border-white/10 focus:border-brand-sage p-3 rounded-xl text-xs font-sans outline-hidden resize-none"
                />
              </div>

              {/* Submit triggers and prompt guides */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-brand-sage hover:bg-brand-sage-hover text-white text-xs md:text-sm font-sans tracking-wide uppercase px-5 py-3 rounded-full transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckSquare className="w-4 h-4" /> Transmit Inquire Booking
                </button>
                
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="border border-white/10 hover:border-brand-sage text-[#e2e2d8] hover:text-white hover:bg-white/5 text-xs font-sans tracking-wide uppercase px-5 py-3 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  WhatsApp Instant
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
