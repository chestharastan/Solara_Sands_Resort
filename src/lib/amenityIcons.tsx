/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Briefcase, Clock, Coffee, Compass, Car, Sparkles, Utensils, Waves, Wifi, type LucideProps } from 'lucide-react';

/** Amenity icon names are stored as strings (editable in the Staff Portal) – this maps them to components. */
const ICONS = { Wifi, Waves, Utensils, Car, Compass, Sparkles, Briefcase, Coffee, Clock };

export function AmenityIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Sparkles;
  return <Icon {...props} />;
}
