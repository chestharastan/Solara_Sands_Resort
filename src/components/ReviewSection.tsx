/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, MessageSquare, Plus, Star } from 'lucide-react';
import { Review } from '../types';

interface ReviewSectionProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date'>) => void;
}

/** Initials avatar – used when a review has no photo (all of them, until real guest photos exist). */
function Avatar({ name, url }: { name: string; url?: string }) {
  const [broken, setBroken] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  if (url && !broken) {
    return <img src={url} alt="" onError={() => setBroken(true)} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <span
      aria-hidden
      className="grid h-10 w-10 place-items-center rounded-full text-[0.78rem] font-semibold text-ink"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 72%), hsl(${(hue + 40) % 360} 70% 62%))` }}
    >
      {initials || '·'}
    </span>
  );
}

const Stars = ({ value, size = 'h-3.5 w-3.5' }: { value: number; size?: string }) => (
  <span className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`${size} ${s <= Math.round(value) ? 'fill-sun text-sun' : 'text-sand/20'}`} />
    ))}
  </span>
);

export default function ReviewSection({ reviews, onAddReview }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const average = reviews.length ? parseFloat((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)) : 0;
  const breakdown = [5, 4, 3, 2, 1].map((n) => {
    const count = reviews.filter((r) => r.rating === n).length;
    return { n, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !comment.trim()) return;
    onAddReview({ guest_name: guestName.trim(), rating, comment: comment.trim() });
    setGuestName('');
    setRating(5);
    setComment('');
    setSubmitted(true);
    window.setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 2200);
  };

  return (
    <div id="reviews-section">
      <div className="mb-10 grid gap-8 border-b hairline pb-10 md:mb-14 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-14 md:pb-14">
        <div>
          <p className="eyebrow mb-2">Guest rating</p>
          <p className="display text-[clamp(4.5rem,10vw,8.5rem)] !leading-[0.85]">
            {average.toFixed(1)}<span className="serif-i text-[0.3em] text-sun"> / 5</span>
          </p>
          <div className="mt-3 flex items-center gap-3"><Stars value={average} size="h-4 w-4" /><span className="text-sm text-sand/60">{reviews.length} verified stays</span></div>
        </div>

        <div className="grid max-w-xl gap-2" aria-label="Rating distribution">
          {breakdown.map((row) => (
            <div key={row.n} className="flex items-center gap-3 font-mono text-[0.72rem] text-sand/70">
              <span className="w-10">{row.n} ★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand/10">
                <motion.div className="h-full origin-left rounded-full bg-sun" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} style={{ width: `${row.pct}%` }} />
              </div>
              <span className="w-9 text-right">{row.pct}%</span>
            </div>
          ))}
        </div>

        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn--ghost justify-self-start md:justify-self-end">
            <Plus className="h-4 w-4" /> Share your stay
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-10 rounded-[1.5rem] border hairline bg-ink-2 p-5 md:p-8">
              {submitted ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-sun text-ink"><Check className="h-6 w-6" /></span>
                  <h4 className="display text-2xl">Thank you</h4>
                  <p className="mt-1 text-sm text-sand/70">Your review is now in the guest book.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <h4 className="display text-2xl">Review your stay</h4>
                    <button type="button" onClick={() => setShowForm(false)} className="eyebrow hover:text-sand">Cancel</button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="field">
                      <label htmlFor="rv-name">Your name</label>
                      <input id="rv-name" required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Cynthia Sterling" autoComplete="name" />
                    </div>
                    <div className="field">
                      <label id="rv-rating-label">Rating</label>
                      <div className="flex items-center gap-1 pt-2" role="radiogroup" aria-labelledby="rv-rating-label">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button type="button" key={s} role="radio" aria-checked={rating === s} aria-label={`${s} star${s > 1 ? 's' : ''}`} onClick={() => setRating(s)} className="p-0.5">
                            <Star className={`h-6 w-6 transition-transform hover:scale-110 ${s <= rating ? 'fill-sun text-sun' : 'text-sand/25'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="rv-comment">Your experience</label>
                    <textarea id="rv-comment" required rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Rooms, spa, dining, the people who looked after you…" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="btn"><MessageSquare className="h-4 w-4" /> Post review</button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phones: swipeable row. Desktop: grid. */}
      <motion.ul layout className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {reviews.map((r) => (
            <motion.li
              layout
              key={r.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-[82%] shrink-0 snap-center flex-col justify-between rounded-[1.5rem] border hairline bg-ink-2 p-6 md:w-auto"
            >
              <div>
                <Stars value={r.rating} />
                <blockquote className="serif-i mt-5 text-[1.35rem] leading-[1.2] text-sand">“{r.comment}”</blockquote>
              </div>
              <footer className="mt-8 flex items-center gap-3 border-t hairline pt-5">
                <Avatar name={r.guest_name} url={r.avatar_url} />
                <div>
                  <p className="text-sm font-semibold leading-tight">{r.guest_name}</p>
                  <p className="font-mono text-[0.65rem] text-sand/55">{r.date} · Verified stay</p>
                </div>
              </footer>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
