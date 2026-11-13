import React from 'react';
import { Building2, Droplets, Lightbulb, Navigation } from 'lucide-react';

const ICON_MAP = {
  waterTanks: Droplets,
  roads: Navigation,
  publicBuildings: Building2,
  streetLights: Lightbulb,
};

export function CategoryIcon({ category, className = 'w-4 h-4' }) {
  const Icon = ICON_MAP[category] || Building2;
  return <Icon className={className} />;
}
