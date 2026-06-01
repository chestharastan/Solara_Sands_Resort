/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, Globe, Sparkles, Key } from 'lucide-react';
import { NEARBY_ATTRACTIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Exact real Carmel-by-the-Sea scenic coordinate mapping corresponding to local attractions
const HOTEL_LOCATION = { lat: 36.5684, lng: -121.9616 };

const ATTRACTION_PLACES = [
  { 
    name: 'Sandy Beach Cove', 
    distance: '3 min walk', 
    desc: 'Serene white sand coastline perfect for shells collection and light strolls.',
    location: { lat: 36.5472, lng: -121.9365 },
    color: '#4a6b82'
  },
  { 
    name: 'Beacon Cliffside Lighthouse', 
    distance: '5 min drive', 
    desc: '140-year old cliff lighthouse offering 360-degree sunset panoramas.',
    location: { lat: 36.6200, lng: -121.9701 },
    color: '#9c665d'
  },
  { 
    name: 'Cove Village Downtown', 
    distance: '8 min shuttle', 
    desc: 'Boutique local market stores, organic bakeries, and handcrafted souvenirs.',
    location: { lat: 36.5551, lng: -121.9213 },
    color: '#7b856a'
  },
  { 
    name: 'Redwood Valley Hiking Trail', 
    distance: '15 min drive', 
    desc: 'Scenic wood trails towering above coastal mountain ridges.',
    location: { lat: 36.4312, lng: -121.9105 },
    color: '#735f49'
  }
];

// Sub-component to dynamically draw routes using computeRoutes
function RouteDisplay({ origin, destination }: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;
    
    // Clear previous route lines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
    .then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          // Style customized to fit our Solara Sands sage luxury vibe
          p.setOptions({
            strokeColor: '#849c84',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    })
    .catch((err) => {
      console.warn('Real-time route computation bypassed:', err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin, destination]);

  return null;
}

export default function InteractiveMap({ address }: { address: string }) {
  const [selectedAttraction, setSelectedAttraction] = useState<number>(0);
  const attractions = NEARBY_ATTRACTIONS;
  const currentAttraction = attractions[selectedAttraction];
  const activePlace = ATTRACTION_PLACES[selectedAttraction];

  return (
    <div id="interactive-map-section" className="bg-white rounded-[32px] border border-brand-border p-6 md:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Real Map UI */}
        <div className="flex-1">
          <div className="text-brand-sage font-mono text-xs tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 animate-spin" /> Live Interactive Neighborhood Map
          </div>
          <h3 className="text-xl font-serif font-bold text-[#2d2d2a] tracking-tight mb-4">
            Cliffview Cove & Surrounding Attractions
          </h3>
          
          <div className="relative aspect-video w-full rounded-[24px] bg-brand-sand-dark/20 border border-brand-border overflow-hidden shadow-inner flex items-center justify-center min-h-[300px]">
            {hasValidKey ? (
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={HOTEL_LOCATION}
                  defaultZoom={13}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Sands Resort Hotel Anchor */}
                  <AdvancedMarker position={HOTEL_LOCATION} title="Solara Sands Resort">
                    <Pin background="#849c84" borderColor="#ffffff" glyphColor="#ffffff" scale={1.15} />
                  </AdvancedMarker>

                  {/* All other landmarks */}
                  {ATTRACTION_PLACES.map((place, idx) => {
                    const isSelected = selectedAttraction === idx;
                    return (
                      <AdvancedMarker 
                        key={place.name} 
                        position={place.location} 
                        title={place.name}
                        onClick={() => setSelectedAttraction(idx)}
                      >
                        <Pin 
                          background={place.color} 
                          borderColor={isSelected ? "#ffffff" : "transparent"} 
                          glyphColor="#ffffff" 
                          scale={isSelected ? 1.25 : 0.9} 
                        />
                      </AdvancedMarker>
                    );
                  })}

                  {/* Real Dynamic Routes Computing Component */}
                  <RouteDisplay origin={HOTEL_LOCATION} destination={activePlace.location} />
                </Map>
              </APIProvider>
            ) : (
              /* High-fidelity Google Maps API Key Splash Setup Screen */
              <div className="absolute inset-0 bg-brand-sand/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10 select-none overflow-y-auto">
                <div className="max-w-md space-y-4">
                  <div className="w-12 h-12 rounded-full bg-brand-sand-dark border border-brand-border flex items-center justify-center mx-auto text-brand-sage animate-pulse">
                    <Key className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-brand-charcoal">
                    Google Maps Verification Required
                  </h4>
                  <p className="text-xs text-brand-charcoal/80 leading-relaxed max-w-sm mx-auto">
                    This module utilizes live location rendering to showcase drive times and routes. Connect your workspace API key to experience it.
                  </p>
                  
                  <div className="bg-white border border-brand-border/80 rounded-2xl p-4 text-left shadow-xs text-[11px] text-brand-charcoal space-y-3 font-sans">
                    <p className="font-semibold text-brand-sage uppercase tracking-wider font-mono text-[9px]">
                      Setup Guide Instructions:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                      <li>
                        Get an API key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-brand-sage font-semibold underline hover:text-brand-sage-hover">Get Live Key Credentials</a>
                      </li>
                      <li>
                        On the <strong>"Enter your environment variable to continue"</strong> popup, paste your API key and press <strong>Enter</strong>.
                      </li>
                      <li>
                        Or manually: Open <strong>Settings</strong> (⚙️ gear icon, top-right corner) &rarr; <strong>Secrets</strong> &rarr; enter name <code>GOOGLE_MAPS_PLATFORM_KEY</code> &rarr; paste value &rarr; press <strong>Enter</strong>.
                      </li>
                    </ol>
                    <p className="text-[10px] text-brand-muted italic leading-snug">
                      * The Solara Sands resort sandbox will rebuild automatically as soon as the key is saved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Address tag overlay */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-brand-border/40 rounded-full px-4 py-1.5 shadow-xs max-w-xs transition-all flex items-center gap-1.5 z-20">
              <MapPin className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" />
              <div className="text-[10px] text-brand-charcoal font-sans leading-tight">
                <strong>Resort address:</strong> {address}
              </div>
            </div>
            
            {/* Legend inside map window */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs border border-brand-border/40 rounded-xl px-2.5 py-1.5 shadow-xs flex flex-col gap-1 text-[8px] text-stone-600 font-sans font-medium z-20">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#849c84] inline-block"></span>
                <span>Sands Resort</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4a6b82] inline-block"></span>
                <span>Beaches & Coasts</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#7b856a] inline-block"></span>
                <span>Downtowns</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#735f49] inline-block"></span>
                <span>Scenic Parks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Driving details & destination chooser */}
        <div className="w-full lg:w-80 flex flex-col justify-between">
          <div>
            <span className="text-brand-sage bg-brand-sand-dark border border-brand-border text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block font-sans mb-3 select-none">
              Explore Locally
            </span>
            <p className="text-brand-charcoal/80 text-sm leading-relaxed mb-4 font-sans select-none">
              We offer complementary daily luxury shuttle services and custom-mapped bicycle rentals for all of the signature locations below.
            </p>

            {/* Attraction Buttons Grid */}
            <div className="space-y-2 mb-6">
              {attractions.map((attraction, i) => {
                const isActive = selectedAttraction === i;
                return (
                  <button
                    id={`attraction-btn-${i}`}
                    key={i}
                    onClick={() => setSelectedAttraction(i)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 group cursor-pointer min-w-0 ${
                      isActive
                        ? 'border-brand-sage/50 bg-brand-sand text-brand-charcoal font-semibold'
                        : 'border-brand-border hover:border-brand-sage/40 text-brand-charcoal/80 hover:bg-brand-sand-dark/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Navigation className={`w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform ${isActive ? 'text-brand-sage' : 'text-stone-400'}`} />
                      <span className="font-sans font-medium text-xs md:text-sm truncate">{attraction.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-brand-charcoal/70 bg-brand-sand-dark rounded-md px-1.5 py-0.5 group-hover:scale-105 transition-transform flex-shrink-0">
                      {attraction.distance}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details for current selected attraction */}
          <div className="border-t border-brand-divider pt-4 mt-auto min-h-[110px]">
            <h4 className="text-xs uppercase tracking-widest text-[#a8a892] font-mono font-bold flex items-center gap-1.5 mb-1.5 select-none">
              <Sparkles className="w-3 h-3 text-brand-sage" /> Point of Interest Details
            </h4>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAttraction}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[#2d2d2a] text-sm font-sans font-semibold mb-1">
                  {currentAttraction.name}
                </p>
                <p className="text-brand-charcoal/75 text-xs font-sans leading-relaxed">
                  {currentAttraction.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
