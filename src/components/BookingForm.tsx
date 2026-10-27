/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CreditCard, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { BookingInquiry, Hotel, Room } from '../types';

interface BookingFormProps {
  hotel: Hotel;
  rooms: Room[];
  selectedRoomId?: string;
  onAddInquiry: (inquiry: Omit<BookingInquiry, 'id' | 'status' | 'created_at'>) => void;
}

const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function BookingForm({ hotel, rooms, selectedRoomId = '', onAddInquiry }: BookingFormProps) {
  const [roomId, setRoomId] = useState(selectedRoomId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  // A suite card elsewhere on the page can preselect the room.
  useEffect(() => {
    if (selectedRoomId) setRoomId(selectedRoomId);
  }, [selectedRoomId]);

  const activeRoom = rooms.find((r) => r.id === roomId);

  // Price estimate: whole nights between the two dates, only when the range is valid.
  const { nights, total } = useMemo(() => {
    if (!checkIn || !checkOut || !activeRoom) return { nights: 0, total: 0 };
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diff <= 0) return { nights: 0, total: 0 };
    const n = Math.ceil(diff / 86_400_000);
    return { nights: n, total: n * activeRoom.price };
  }, [checkIn, checkOut, activeRoom]);

  const phoneDigits = hotel.phone.replace(/\D/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !checkIn || !checkOut || !roomId) {
      setAlert('Please complete all required fields.');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setAlert('Check-out must be after check-in.');
      return;
    }
    onAddInquiry({ name, email, check_in: checkIn, check_out: checkOut, guests, message, room_id: roomId });
    setSubmitted(true);
    setAlert(null);
  };

  const reset = () => {
    setName('');
    setEmail('');
    setCheckIn('');
    setCheckOut('');
    setGuests(2);
    setMessage('');
    setSubmitted(false);
  };

  const whatsapp = () => {
    const text = `Hi, I'm interested in booking the ${activeRoom ? activeRoom.name : 'resort'} for ${nights || 3} nights.`;
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <div id="booking-section" className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* Left: contact + live estimate */}
      <div className="flex flex-col gap-8 lg:col-span-5">
        <p className="lead max-w-md text-sand/75">
          Requests are answered within two hours. Send an enquiry below, or talk to the concierge directly – there is always someone awake.
        </p>

        <ul className="grid gap-4 text-sm">
          <li>
            <a href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`} className="group flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-sand/20 transition-colors group-hover:bg-sun group-hover:text-ink"><Phone className="h-4 w-4" /></span>
              <span><span className="eyebrow block">Concierge line</span><span className="font-semibold">{hotel.phone}</span></span>
            </a>
          </li>
          <li>
            <a href={`mailto:${hotel.email}`} className="group flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-sand/20 transition-colors group-hover:bg-sun group-hover:text-ink"><Mail className="h-4 w-4" /></span>
              <span><span className="eyebrow block">Enquiries</span><span className="break-all font-semibold">{hotel.email}</span></span>
            </a>
          </li>
        </ul>

        <div className="rounded-[1.5rem] border hairline bg-ink-2 p-5 md:p-6" aria-live="polite">
          <div className="mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-sun" /><h3 className="eyebrow !text-sand">Estimated stay</h3></div>
          <AnimatePresence mode="wait">
            {activeRoom ? (
              <motion.div key={activeRoom.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-sand/85">{activeRoom.name}</span>
                  <span className="font-mono text-xs text-sand/60">${activeRoom.price} / night</span>
                </div>
                {nights > 0 ? (
                  <div className="mt-4 grid gap-1.5 border-t hairline pt-4 text-sm">
                    <div className="flex justify-between text-sand/70"><span>Duration</span><span className="font-mono">{nights} night{nights > 1 ? 's' : ''}</span></div>
                    <div className="flex justify-between text-sand/70"><span>Local tax &amp; service</span><span className="font-mono">Included</span></div>
                    <div className="mt-2 flex items-baseline justify-between"><span className="font-semibold">Estimated total</span><span className="display text-4xl !leading-none">${total}</span></div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs italic text-sand/55">Choose check-in and check-out dates to see your total.</p>
                )}
              </motion.div>
            ) : (
              <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs italic text-sand/55">Select a suite to see a quote.</motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: the form */}
      <div className="rounded-[1.75rem] border hairline bg-ink-2/70 p-6 md:rounded-[2.25rem] md:p-10 lg:col-span-7">
        {submitted ? (
          <div className="flex h-full min-h-[22rem] flex-col items-center justify-center text-center">
            <span className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-sun text-ink"><Check className="h-7 w-7" /></span>
            <h3 className="display text-3xl">Request received</h3>
            <p className="serif-i mt-3 max-w-sm text-xl text-sand/80">
              “Our reservations team has your enquiry{activeRoom ? ` for the ${activeRoom.name}` : ''} and will be in touch by email shortly.”
            </p>
            <button onClick={reset} className="btn btn--ghost mt-8">Make another request</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-7">
            {alert && <div role="alert" className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">{alert}</div>}

            <div className="field">
              <label htmlFor="bk-room">Accommodation *</label>
              <select id="bk-room" required value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="" disabled>Select a suite or villa</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — ${r.price} / night</option>
                ))}
              </select>
            </div>

            <div className="grid gap-7 md:grid-cols-2">
              <div className="field">
                <label htmlFor="bk-name">Full name *</label>
                <input id="bk-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="field">
                <label htmlFor="bk-email">Email *</label>
                <input id="bk-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>

            <div className="grid gap-7 sm:grid-cols-3">
              <div className="field">
                <label htmlFor="bk-in">Check-in *</label>
                <input id="bk-in" type="date" required min={isoToday()} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (checkOut && checkOut <= e.target.value) setCheckOut(''); }} />
              </div>
              <div className="field">
                <label htmlFor="bk-out">Check-out *</label>
                <input id="bk-out" type="date" required min={checkIn ? addDays(checkIn, 1) : isoToday()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="bk-guests">Guests</label>
                <select id="bk-guests" value={guests} onChange={(e) => setGuests(parseInt(e.target.value, 10))}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="bk-msg">Anything we should know?</label>
              <textarea id="bk-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Celebrations, dietary needs, transfers, a high floor…" />
            </div>

            <div className="flex flex-col gap-3 border-t hairline pt-7 sm:flex-row">
              <button type="submit" className="btn flex-1"><Send className="h-4 w-4" /> Send enquiry</button>
              <button type="button" onClick={whatsapp} className="btn btn--ghost"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
