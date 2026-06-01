/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, MessageSquare, Plus, Check } from 'lucide-react';
import { Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewSectionProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date'>) => void;
}

export default function ReviewSection({ reviews, onAddReview }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Compute average rating
  const averageRating = reviews.length
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  // Compute breakdown percentages
  const starsBreakdown = [5, 4, 3, 2, 1].map((starNum) => {
    const count = reviews.filter((r) => r.rating === starNum).length;
    const percentage = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { starNum, count, percentage };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !comment) return;

    onAddReview({
      guest_name: guestName,
      rating,
      comment,
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=120&q=80`
    });

    setGuestName('');
    setRating(5);
    setComment('');
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 2000);
  };

  return (
    <div id="reviews-section" className="bg-white rounded-[32px] border border-brand-border p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-8 pb-8 border-b border-brand-divider">
        
        {/* Rating Breakdown */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-brand-sand-dark rounded-[24px] border border-brand-border w-full md:w-56 text-center">
          <div className="text-brand-muted font-mono text-[10px] tracking-widest uppercase mb-1">Guest Rating</div>
          <div className="text-4xl font-sans font-bold text-brand-charcoal tracking-tight flex items-baseline gap-1">
            {averageRating} <span className="text-brand-muted text-sm font-normal">/ 5</span>
          </div>
          
          <div className="flex items-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`w-4 h-4 ${
                  s <= Math.round(averageRating) ? 'fill-amber-500 text-amber-500' : 'text-stone-200'
                }`} 
              />
            ))}
          </div>
          
          <div className="text-brand-charcoal/70 text-xs font-sans mt-1">
            Based on {reviews.length} authentic guest stays
          </div>
        </div>

        {/* Breakdown bar graph */}
        <div className="flex-1 w-full space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-brand-muted font-mono font-bold mb-4 font-bold">Rating Distributions</h4>
          {starsBreakdown.map((row) => (
            <div key={row.starNum} className="flex items-center gap-3 text-xs text-brand-charcoal font-sans">
              <span className="w-12 text-left">{row.starNum} stars</span>
              <div className="flex-1 bg-brand-divider h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-sage h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-brand-muted">{row.percentage}%</span>
            </div>
          ))}
        </div>

        {/* Post review CTA */}
        <div className="flex-shrink-0 w-full md:w-auto self-stretch flex items-center justify-center">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full md:w-auto border border-brand-border hover:border-brand-sage text-brand-charcoal hover:bg-brand-sand-dark text-xs font-sans tracking-wide uppercase px-5 py-3 rounded-full transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="w-4 h-4" /> Share Your Stay Experience
            </button>
          )}
        </div>
      </div>

      {/* Slide down review entry form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-brand-sand/50 border border-brand-border rounded-[24px] p-6">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 bg-brand-sand-dark text-brand-sage rounded-full flex items-center justify-center mb-3 border border-brand-border">
                    <Check className="w-5 h-5 animate-bounce" />
                  </div>
                  <h4 className="text-brand-charcoal font-sans font-medium text-sm">Thank You for Your Feedback!</h4>
                  <p className="text-brand-muted text-xs font-sans mt-0.5">Your luxury review has been persisted locally in our registry.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-brand-charcoal font-sans font-semibold text-sm">Review Your Getaway</h4>
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      className="text-brand-muted hover:text-brand-charcoal text-xs font-mono font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-brand-charcoal text-xs font-sans font-medium mb-1.5">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Lady Cynthia Sterling"
                        className="w-full text-brand-charcoal border border-brand-border focus:border-brand-sage px-3 py-2.5 bg-white rounded-xl text-xs font-sans outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-brand-charcoal text-xs font-sans font-medium mb-1.5">Rating Rating</label>
                      <div className="flex items-center gap-1.5 h-8">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setRating(s)}
                            className="p-0.5 focus:outline-hidden cursor-pointer"
                          >
                            <Star 
                              className={`w-5 h-5 transition-transform hover:scale-110 ${
                                s <= rating ? 'fill-amber-500 text-amber-500' : 'text-stone-350'
                              }`} 
                            />
                          </button>
                        ))}
                        <span className="text-xs text-brand-muted font-mono ml-2">({rating} Stars)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-brand-charcoal text-xs font-sans font-medium mb-1.5">Experience Comments</label>
                    <textarea
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share details about your accommodations, amenities, beds, spa experience, or concierge services..."
                      className="w-full text-brand-charcoal border border-brand-border focus:border-brand-sage p-3 bg-white rounded-xl text-xs font-sans outline-hidden resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-brand-sage hover:bg-brand-sage-hover text-white text-xs font-sans tracking-wide uppercase px-5 py-3 rounded-full transition-all flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Post My Experience Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review List Grid */}
      <motion.div 
        layout 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {reviews.map((review) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              key={review.id} 
              className="border border-brand-border bg-white rounded-[24px] p-6 hover:border-brand-border/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 w-full">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={review.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                      alt={review.guest_name}
                      className="w-8 h-8 rounded-full border border-brand-divider object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h5 className="text-brand-charcoal font-sans font-semibold text-xs leading-tight">
                        {review.guest_name}
                      </h5>
                      <span className="text-brand-muted text-[10px] font-sans font-normal">
                        {review.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-0.5 animate-pulse">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-2.5 h-2.5 ${
                          s <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                <p className="text-brand-charcoal/80 text-xs font-sans leading-relaxed italic mb-4">
                  "{review.comment}"
                </p>
              </div>

              <div className="border-t border-brand-divider pt-3 mt-auto flex items-center justify-between text-[10px] text-brand-muted font-mono">
                <span className="text-brand-sage bg-brand-sand border border-brand-border/30 px-2.5 py-0.5 rounded-full font-sans">
                  ✓ Verified Stay
                </span>
                <span>Ref #{review.id.slice(0, 8)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
