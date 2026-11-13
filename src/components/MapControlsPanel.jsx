import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { getLocalizedName, tr } from '../i18n/translations';
import { CategoryIcon } from './CategoryIcon';

const ASSET_LAYER_ITEMS = [
  {
    key: 'waterTanks',
    labelKey: 'waterTanks',
    iconColor: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  {
    key: 'roads',
    labelKey: 'roads',
    iconColor: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  {
    key: 'publicBuildings',
    labelKey: 'publicBuildings',
    iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    key: 'streetLights',
    labelKey: 'streetLights',
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
  },
];

export function MapControlsPanel({
  lang,
  wards,
  totalCounts,
  filteredCount,
  visibleLayers,
  onToggleLayer,
  searchQuery,
  onSearchChange,
  wardFilter,
  onWardChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  onOpenListDrawer,
  onRecenter,
}) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (wardFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    Object.entries(visibleLayers).filter(
      ([k, v]) => k !== 'wards' && !v
    ).length;

  const controlsBody = (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={tr(lang, 'searchPlaceholder')}
          className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Ward & Condition Filters */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {tr(lang, 'wardLabel')}
          </label>
          <select
            value={wardFilter}
            onChange={(e) => onWardChange(e.target.value)}
            aria-label={tr(lang, 'wardLabel')}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{tr(lang, 'allWards')}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.ward}>
                {getLocalizedName(w, lang)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {tr(lang, 'conditionLabel')}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label={tr(lang, 'conditionLabel')}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{tr(lang, 'allConditions')}</option>
            <option value="good">{tr(lang, 'goodWorkingOption')}</option>
            <option value="fair">{tr(lang, 'fairOption')}</option>
            <option value="poor">{tr(lang, 'poorFaultyOption')}</option>
          </select>
        </div>
      </div>

      {/* Layer Checkboxes */}
      <div className="border-t border-slate-200/80 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          {tr(lang, 'assetLayers')}
        </p>
        <div className="space-y-1">
          {ASSET_LAYER_ITEMS.map((item) => {
            const checked = Boolean(visibleLayers[item.key]);
            const count = totalCounts[item.key] ?? 0;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleLayer(item.key)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span
                    className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${item.iconColor}`}
                  >
                    <CategoryIcon category={item.key} className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {tr(lang, item.labelKey)}
                  </span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </label>
            );
          })}

          <label className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition">
            <span className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={Boolean(visibleLayers.wards)}
                onChange={() => onToggleLayer('wards')}
                className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="w-6 h-6 rounded-md border border-dashed border-slate-400 bg-slate-50 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-600">
                W
              </span>
              <span className="text-xs font-medium text-slate-600 truncate">
                {tr(lang, 'wardBoundaries')}
              </span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              5
            </span>
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200/80 pt-2.5 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          {tr(lang, 'showingOf')}{' '}
          <strong className="text-slate-800">{filteredCount}</strong> / {totalCounts.all}
        </span>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
            >
              {tr(lang, 'reset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenListDrawer();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition"
          >
            <List className="w-3.5 h-3.5" />
            <span>{tr(lang, 'browseList')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Floating Panel (top-left) */}
      <div className="hidden md:block absolute top-3 left-3 z-[400] w-72 lg:w-80">
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold text-slate-800 truncate">
                {tr(lang, 'layersAndFilters')}
              </span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onRecenter}
                title={tr(lang, 'recenterMap')}
                className="p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-slate-200/60 transition"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDesktopCollapsed((v) => !v)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
              >
                {desktopCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!desktopCollapsed && <div className="p-3.5">{controlsBody}</div>}
        </div>
      </div>

      {/* Mobile Floating Pill Bar + Expandable Sheet */}
      <div className="md:hidden absolute top-2.5 left-2.5 right-2.5 z-[400] pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border shadow-md text-xs font-semibold transition ${
                mobileOpen
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white/95 backdrop-blur text-slate-800 border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{tr(lang, 'layersAndFilters')}</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-300 text-slate-900">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenListDrawer}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 backdrop-blur border border-slate-200 shadow-md text-xs font-semibold text-slate-800"
            >
              <List className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {tr(lang, 'listCountPrefix')} ({filteredCount})
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onRecenter}
            aria-label={tr(lang, 'recenterMap')}
            className="p-2 rounded-xl bg-white/95 backdrop-blur border border-slate-200 shadow-md text-slate-700"
          >
            <Crosshair className="w-4 h-4 text-emerald-700" />
          </button>
        </div>

        {mobileOpen && (
          <div className="mt-2 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-xl p-3.5 pointer-events-auto max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                {tr(lang, 'filterAndToggleTitle')}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {controlsBody}
          </div>
        )}
      </div>
    </>
  );
}
