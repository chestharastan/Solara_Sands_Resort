/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { MediaSpec, MediaTone } from '../../content/media';
import { getDevice } from '../../lib/device';

/**
 * <MediaSlot/> – the one component every photo/video on the site goes through.
 *
 *  • No `src`  → renders a *descriptive placeholder* (what to shoot, aspect ratio,
 *                pixel size, format) so the layout is final before content exists.
 *  • With `src` → renders the real <img>/<video>, lazy-loaded, with the same box,
 *                so uploading media never causes layout shift.
 *  • A broken URL (e.g. a typo in the Staff Portal) falls back to the placeholder
 *    instead of showing a broken-image icon.
 *
 * Videos are muted/looping/inline and only play while on screen (saves battery
 * and bandwidth); with prefers-reduced-motion they show their poster only.
 */

export interface MediaSlotProps {
  kind?: MediaSpec['kind'];
  src?: string;
  poster?: string;
  alt: string;
  label: string;
  spec: string;
  tone?: MediaTone;
  /** CSS aspect-ratio, e.g. "4 / 5". Ignored when `fill` is set. */
  ratio?: string;
  /** Stretch to the parent's size (parent must be `relative`). */
  fill?: boolean;
  className?: string;
  /** Load eagerly (above the fold). */
  priority?: boolean;
}

export default function MediaSlot({
  kind = 'image',
  src,
  poster,
  alt,
  label,
  spec,
  tone = 'sand',
  ratio,
  fill,
  className = '',
  priority,
}: MediaSlotProps) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasMedia = Boolean(src) && !failed;

  // Reset the error state if the source changes (e.g. staff fixes the URL).
  useEffect(() => setFailed(false), [src]);

  // Play videos only while visible.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || getDevice().reducedMotion) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src, kind]);

  const style = fill ? undefined : ratio ? { aspectRatio: ratio } : undefined;

  return (
    <div
      className={`media-slot ${fill ? 'absolute inset-0' : 'relative'} ${className}`}
      style={style}
      data-tone={tone}
      data-slot={label}
      data-kind={kind}
      data-filled={hasMedia}
    >
      {hasMedia ? (
        kind === 'video' ? (
          <video
            ref={videoRef}
            className="media-fill"
            muted
            loop
            playsInline
            preload="none"
            poster={poster}
            aria-label={alt}
            onError={() => setFailed(true)}
          >
            <source src={src} />
          </video>
        ) : (
          <img
            className="media-fill"
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <div role="img" aria-label={`Placeholder for ${kind}: ${alt}`} className="absolute inset-0">
          <div className="media-slot__bg" />
          <div className="media-slot__hatch" />
          <span className="media-slot__corner media-slot__corner--tl" />
          <span className="media-slot__corner media-slot__corner--tr" />
          <span className="media-slot__corner media-slot__corner--bl" />
          <span className="media-slot__corner media-slot__corner--br" />
          {kind === 'video' && (
            <span className="media-slot__play">
              <Play className="h-5 w-5 translate-x-px" fill="currentColor" />
            </span>
          )}
          <div className="media-slot__meta">
            <span className="eyebrow">{kind === 'video' ? 'Video placeholder' : 'Photo placeholder'}</span>
            <strong>{label}</strong>
            <small>{spec}</small>
          </div>
        </div>
      )}
    </div>
  );
}
