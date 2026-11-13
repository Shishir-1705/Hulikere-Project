import React from 'react';
import {
  AlertTriangle,
  Building2,
  Droplets,
  Lightbulb,
  Navigation,
} from 'lucide-react';
import { isAttentionNeeded } from '../utils/assetHelpers';

export function StatsBar({
  data,
  activeCategory,
  activeStatusFilter,
  onSelectCategory,
  onSelectAttention,
}) {
  const tanks = data.waterTanks || [];
  const roads = data.roads || [];
  const buildings = data.publicBuildings || [];
  const lights = data.streetLights || [];

  const totalHouseholdsServed = tanks.reduce(
    (sum, t) => sum + (Number(t.householdsServed) || 0),
    0
  );
  const totalRoadMeters = roads.reduce((sum, r) => sum + (Number(r.length) || 0), 0);
  const workingLights = lights.filter((l) => l.status === 'working').length;
  const faultyLights = lights.filter((l) => l.status === 'faulty').length;

  const attentionCount = [...tanks, ...roads, ...buildings, ...lights].filter(
    isAttentionNeeded
  ).length;

  const cards = [
    {
      id: 'waterTanks',
      label: 'Water Tanks',
      value: tanks.length,
      sub: `${totalHouseholdsServed} households served`,
      icon: Droplets,
      iconBg: 'bg-sky-100 text-sky-700',
      activeBorder: 'ring-2 ring-sky-500 border-sky-300 bg-sky-50/40',
      onClick: () =>
        onSelectCategory(activeCategory === 'waterTanks' ? 'all' : 'waterTanks'),
      isActive: activeCategory === 'waterTanks' && activeStatusFilter !== 'poor',
    },
    {
      id: 'roads',
      label: 'Village Roads',
      value: roads.length,
      sub: `${(totalRoadMeters / 1000).toFixed(2)} km mapped`,
      icon: Navigation,
      iconBg: 'bg-teal-100 text-teal-700',
      activeBorder: 'ring-2 ring-teal-500 border-teal-300 bg-teal-50/40',
      onClick: () => onSelectCategory(activeCategory === 'roads' ? 'all' : 'roads'),
      isActive: activeCategory === 'roads' && activeStatusFilter !== 'poor',
    },
    {
      id: 'publicBuildings',
      label: 'Public Buildings',
      value: buildings.length,
      sub: `${buildings.filter((b) => b.condition === 'good').length} good • ${
        buildings.filter((b) => b.condition !== 'good').length
      } need care`,
      icon: Building2,
      iconBg: 'bg-indigo-100 text-indigo-700',
      activeBorder: 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/40',
      onClick: () =>
        onSelectCategory(
          activeCategory === 'publicBuildings' ? 'all' : 'publicBuildings'
        ),
      isActive:
        activeCategory === 'publicBuildings' && activeStatusFilter !== 'poor',
    },
    {
      id: 'streetLights',
      label: 'Street Lights',
      value: lights.length,
      sub: `${workingLights} working • ${faultyLights} faulty`,
      icon: Lightbulb,
      iconBg: 'bg-amber-100 text-amber-700',
      activeBorder: 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/40',
      onClick: () =>
        onSelectCategory(activeCategory === 'streetLights' ? 'all' : 'streetLights'),
      isActive: activeCategory === 'streetLights' && activeStatusFilter !== 'poor',
    },
    {
      id: 'attention',
      label: 'Attention Needed',
      value: attentionCount,
      sub: 'Poor condition / Faulty lights',
      icon: AlertTriangle,
      iconBg:
        attentionCount > 0
          ? 'bg-rose-100 text-rose-700'
          : 'bg-emerald-100 text-emerald-700',
      activeBorder: 'ring-2 ring-rose-500 border-rose-300 bg-rose-50/40',
      onClick: onSelectAttention,
      isActive: activeStatusFilter === 'poor',
    },
  ];

  return (
    <section className="bg-slate-50 border-b border-slate-200 px-4 lg:px-6 py-2.5 shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className={`text-left rounded-xl border bg-white px-3 py-2.5 transition hover:border-slate-300 hover:shadow-sm flex items-center gap-3 ${
                card.isActive ? card.activeBorder : 'border-slate-200'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-slate-900 leading-none">
                    {card.value}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 truncate">
                    {card.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-1">{card.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
